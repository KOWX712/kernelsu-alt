# Library for KernelSU's module WebUI

## Install

```sh
npm i kernelsu-alt
```

## API

### isKsuWebui

Check if KernelSU WebUI bridge is available in the current environment.

Returns a `boolean` indicating whether the `ksu` object is available.

```javascript
import { isKsuWebui } from 'kernelsu-alt';

if (isKsuWebui()) {
  console.log('Running in KernelSU WebUI environment');
  // Safe to use KernelSU APIs
} else {
  console.log('Not running in KernelSU WebUI environment');
  // Fallback behavior
}
```

### exec

Spawns a **root** shell and runs a command within that shell, passing the `stdout` and `stderr` to a Promise when complete.
- `command` `<string>` The command to run, with space-separated arguments.
- `options` `<Object>`
  - `cwd` - Current working directory of the child process
  - `env` - Environment key-value pairs

```javascript
import { exec } from 'kernelsu-alt';

const { errno, stdout, stderr } = await exec('ls -l', { cwd: '/tmp' });

if (errno === 0) {
    // success
    console.log(stdout);
}
```

### spawn

Spawns a new process using the given `command` in **root** shell, with command-line arguments in `args`. If omitted, `args` defaults to an empty array.

Returns a `ChildProcess`, Instances of the ChildProcess represent spawned child processes.

- `command` `<string>` The command to run.
- `args` `<string[]>` List of string arguments. Also accepts an options object as the 2nd argument: `spawn(command, options)`.
- `options` `<Object>`:
  - `cwd` `<string>` - Current working directory of the child process
  - `env` `<Object>` - Environment key-value pairs

Example of running `ls -lh /data`, capturing `stdout`, `stderr`, and the exit code:

```javascript
import { spawn } from 'kernelsu-alt';

const ls = spawn('ls', ['-lh', '/data']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('exit', (code) => {
  console.log(`child process exited with code ${code}`);
});
``` 

#### ChildProcess

##### Event 'exit'

- `code` `<number>` The exit code if the child exited on its own.

The `'exit'` event is emitted after the child process ends. If the process exited, `code` is the final exit code of the process, otherwise null

##### Event 'error'

- `err` `<Error>` The error.

The `'error'` event is emitted whenever:

- The process could not be spawned.
- The process could not be killed.

##### `stdout`

A `Readable Stream` that represents the child process's `stdout`.

```javascript
const subprocess = spawn('ls');

subprocess.stdout.on('data', (data) => {
  console.log(`Received chunk ${data}`);
});
```

#### `stderr`

A `Readable Stream` that represents the child process's `stderr`.

### fullScreen

Request the WebView enter/exit full screen.

```javascript
import { fullScreen } from 'kernelsu-alt';
fullScreen(true);
```

### enableEdgeToEdge

Request the WebView to set padding to 0 or system bar insets

- tips: this is disabled by default but if you request resource from `internal/insets.css`, this will be enabled automatically.
- To get insets value and enable this automatically, you can
  - add `@import "https://mui.kernelsu.org/internal/insets.css";` in css OR
  - add `<link rel="stylesheet" type="text/css" href="/internal/insets.css" />` in html.
- Note: `enableInsets` is renamed to `enableEdgeToEdge` since KernelSU 32265. Old api is kept and marked as deprecated for compatibility, there is no plan to remove it currently.

```javascript
import { enableEdgeToEdge } from 'kernelsu-alt';
const result = await enableEdgeToEdge(true);
if (!result) {
  console.log('Function not implemented');
}
```

### toast

Show a toast message.

```javascript
import { toast } from 'kernelsu-alt';
toast('Hello, world!');
```

### exit

Close the WebUI window.

```javascript
import { exit } from 'kernelsu-alt';
exit();
```

### listPackages

> Deprecated: use [`pm.listPackages`](#pmlistpackages) instead.

Lists installed packages on the Android system.
- `type` `<string>` The type of packages to list. Can be one of `'user'`, `'system'`, or `'all'`. Defaults to `'all'`.

Returns a `Promise<string[]>` which resolves to an array of package names.

```javascript
import { listPackages } from 'kernelsu-alt';

// Get all installed packages
const allPackages = await listPackages();
console.log(allPackages);

// Get only user-installed packages
const userPackages = await listPackages('user');
console.log(userPackages);
```

### getPackagesInfo

> Deprecated: use [`pm.getPackagesInfo`](#pmgetpackagesinfo) instead.

Retrieves detailed information for one or more packages.
- `pkg` `<string|string[]>` A single package name or an array of package names.

Returns a `Promise<PackagesInfo|PackagesInfo[]>` which resolves to:
- A single package information object if a single package name is provided.
- An array of package information objects if an array of package names is provided.

The `PackagesInfo` object has the following structure:
- `packageName` `<string>` - Package name of the application.
- `versionName` `<string>` - Version of the application.
- `versionCode` `<number>` - Version code of the application.
- `appLabel` `<string>` - Display name of the application.
- `isSystem` `<boolean>` - Whether the application is a system app.
- `uid` `<number>` - UID of the application.

```javascript
import { getPackagesInfo } from 'kernelsu-alt';

// Get info for a single package
const info = await getPackagesInfo('com.android.settings');
console.log(info);

// Get info for multiple packages
const infos = await getPackagesInfo(['com.android.settings', 'com.android.shell']);
console.log(infos);
```

### pm

Package-manager helpers, multi-user aware. A package installed for several users (e.g. `com.android.bluetooth` with uid `1002` for user 0 and `1001002` for user 10) is listed once by `pm.listPackages`, and yields one info entry per uid from `pm.getPackagesInfo`.

Both methods work on every manager version: when `pm.support` is `false` they transparently fall back to the legacy [`listPackages`](#listpackages) / [`getpackagesinfo`](#getpackagesinfo) apis and adapt their result to the same return shape.

```javascript
import { pm } from 'kernelsu-alt';

const packages = await pm.listPackages('user');
const infos = await pm.getPackagesInfo(['com.android.settings', 'com.android.shell']);
```

#### pm.support

`boolean` — whether the multi-user pm interface is available in the current environment. Evaluated once when the module loads.

#### pm.version

`number` — the pm API version provided by the manager (Kotlin side) through the `ksu.pm` bridge. `0` when the bridge is unavailable.

```javascript
import { pm } from 'kernelsu-alt';

if (!pm.support) {
  console.log(`pm interface unavailable, legacy fallback in use (version ${pm.version})`);
}
```

#### pm.listPackages

Lists installed package names, deduplicated across users.
- `type` `<string>` The type of packages to list. Can be `'user'`, `'system'`, or `'all'`. Defaults to `'all'`.

Returns a `Promise<string[]>` of unique package names.
- when supported: the `ksu.pm().listPackages(type)` result (already deduplicated).
- when unsupported: the legacy [`listPackages`](#listpackages) result with duplicated entries mapped out.

```javascript
import { pm } from 'kernelsu-alt';

// list user packages
const packages = await pm.listPackages('user');
```

- tips: when the pm interface is available, you can use `ksu://icon/{packageName}` to get the app icon.

```javascript
img.src = `ksu://icon/${packageName}`;
```

#### pm.getPackagesInfo

Gets information for a list of packages, one entry per uid.
- `packages` `<string[]>` The list of package names.

Returns a `Promise<Array<PackageInfoPerUid | PackageInfoError>>` — a flat array with one entry per uid for each resolved package, following the input package order, with uids ascending within a package. If a package is missing or inaccessible, the entry contains `packageName` and `error` instead.
- when supported: the new `ksu.pm().getPackagesInfo(packages)` result.
- when unsupported: the legacy [`getPackagesInfo`](#getpackagesinfo) result with each entry converted to the `PackageInfoPerUid` shape (`userId` added).

```javascript
import { pm } from 'kernelsu-alt';

const infos = await pm.getPackagesInfo(['com.android.settings', 'com.android.shell']);
console.log(infos[0].userId);
```

#### PackageInfoPerUid

An object contains:

- `packageName` `<string>` Package name of the application.
- `versionName` `<string>` Version of the application. Empty string if unavailable.
- `versionCode` `<number>` Version code of the application.
- `appLabel` `<string>` Display name of the application.
- `isSystem` `<boolean | null>` Whether the application is a system app. `null` if application info is unavailable.
- `uid` `<number | null>` UID of the application for one user, e.g. `1002` or `1001002`. `null` if application info is unavailable.
- `userId` `<number | null>` User id the uid belongs to, i.e. `uid / 100000`. `null` if application info is unavailable — this is the field added for legacy fallback entries.

If a package could not be resolved, the returned object contains:

- `packageName` `<string>` The requested package name.
- `error` `<string>` Reason the package information could not be returned.

### io

File-system helpers: `File`, `FileInputStream`, `FileOutputStream` and `RandomAccessFile`.

#### io.support

`boolean` — whether the file interface is available in the current environment. Always check this before calling the other methods.

```javascript
import { io, toast } from 'kernelsu-alt';

if (!io.support) {
  toast('Current environment does not support the io interface. Please update KernelSU Manager.');
}
```

#### io.version

`number` — version of the io interface, `0` when unsupported.

```javascript
import { io } from 'kernelsu-alt';

if (io.support) {
  console.log(io.version);
}
```

#### io.File

`File(path)` returns a file object with the following methods:

- Existence: `exists()`, `isFile()`, `isDirectory()`, `isHidden()`, `isBlock()`, `isCharacter()`, `isSymlink()`
- Permissions: `canRead()`, `canWrite()`, `canExecute()`, `setReadOnly()`, `setReadable(readable, ownerOnly)`, `setWritable(writable, ownerOnly)`, `setExecutable(executable, ownerOnly)`
- Modification: `createNewFile()`, `delete()`, `deleteRecursive()`, `mkdir()`, `mkdirs()`, `renameTo(destPath)`, `createNewSymlink(target)`, `createNewLink(existing)`, `clear()`
- Listing: `list()`, `listFiles()` — both return a `string[]`
- Metadata: `length()`, `lastModified()`, `setLastModified(time)`, `getFreeSpace()`, `getTotalSpace()`, `getUsableSpace()`
- Paths: `getAbsolutePath()`, `getCanonicalPath()`, `getParent()`, `getPath()`, `getName()`
- Streams: `newInputStream()`, `newOutputStream(append?)` — return stream ids

```javascript
import { io } from 'kernelsu-alt';

const file = io.File('/data/adb/modules/my_module/config.txt');
if (file.exists()) {
  console.log(file.length(), file.lastModified());
} else {
  file.createNewFile();
}
```

#### io.FileInputStream

```javascript
import { io } from 'kernelsu-alt';

const fis = io.FileInputStream();
const id = fis.open('/data/adb/modules/my_module/config.txt');
console.log(fis.read(id));
fis.close(id);
```

- `open(path)` `<string>` Opens the file, returns a stream id.
- `read(id, maxBytes?)` `<string>` Reads the content (base64), optionally limited to `maxBytes`.
- `available(id)` `<number>`
- `close(id)` `<boolean>`

#### io.FileOutputStream

```javascript
import { io } from 'kernelsu-alt';

const fos = io.FileOutputStream();
const id = fos.open('/data/local/tmp/test.txt', false); // append = false
fos.write(id, btoa('hello world'));
fos.flush(id);
fos.close(id);
```

- `open(path, append?)` `<string>` Opens the file, returns a stream id.
- `write(id, base64)` `<boolean>`
- `writeByte(id, b)` `<boolean>`
- `flush(id)` `<boolean>`
- `close(id)` `<boolean>`

#### io.RandomAccessFile

```javascript
import { io } from 'kernelsu-alt';

const raf = io.RandomAccessFile();
const id = raf.open('/data/local/tmp/test.bin', 'rw');
raf.writeInt(id, 42);
raf.seek(id, 0);
console.log(raf.readInt(id));
raf.close(id);
```

- `open(path, mode)` `<string>` `mode` is `"r"`, `"w"`, `"rw"` or `"rws"`.
- Reads: `read(id)`, `readBytes(id, len)`, `readBoolean(id)`, `readByte(id)`, `readInt(id)`, `readLong(id)`, `readShort(id)`, `readFloat(id)`, `readDouble(id)`, `readUTF(id)`, `readLine(id)`
- Writes: `write(id, b)`, `writeBase64(id, data)`, `writeBoolean(id, v)`, `writeByte(id, v)`, `writeInt(id, v)`, `writeLong(id, v)`, `writeShort(id, v)`, `writeFloat(id, v)`, `writeDouble(id, v)`, `writeUTF(id, str)`
- Position/size: `seek(id, pos)`, `getFilePointer(id)`, `length(id)`, `setLength(id, newLength)`
- `close(id)` `<boolean>`

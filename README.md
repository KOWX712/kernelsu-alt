# Library for KernelSU's module WebUI

## Install

```sh
npm i kernelsu-alt
```

## API

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
- `args` `<string[]>` List of string arguments.
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

### toast

Show a toast message.

```javascript
import { toast } from 'kernelsu-alt';
toast('Hello, world!');
```

### listPackages

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

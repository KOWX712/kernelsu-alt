/**
 * Source: https://github.com/KOWX712/kernelsu-alt
 * Npm: https://www.npmjs.com/package/kernelsu-alt
 * 
 * Imported from https://www.npmjs.com/package/kernelsu
 * Modified version by KOWX712
 */

let callbackCounter = 0;
function getUniqueCallbackName(prefix) {
    return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
}

/**
 * Check if KernelSU WebUI bridge is available
 * @returns {boolean} True if ksu object is available in the global scope
 */
function isKsuWebui() {
    return typeof globalThis.ksu !== 'undefined';
}

/**
 * Execute shell command with ksu.exec
 * @param {string} command - The command to execute
 * @param {Object} [options={}] - Options object containing:
 *   - cwd <string> - Current working directory of the child process
 *   - env {Object} - Environment key-value pairs
 * @returns {Promise<Object>} Resolves with:
 *   - errno {number} - Exit code of the command
 *   - stdout {string} - Standard output from the command
 *   - stderr {string} - Standard error from the command
 */
function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        const callbackFuncName = getUniqueCallbackName("exec");
        window[callbackFuncName] = (errno, stdout, stderr) => {
            resolve({ errno, stdout, stderr });
            cleanup(callbackFuncName);
        };
        function cleanup(successName) {
            delete window[successName];
        }
        try {
            if (isKsuWebui()) {
                ksu.exec(command, JSON.stringify(options), callbackFuncName);
            } else {
                resolve({ errno: 1, stdout: "", stderr: "ksu is not defined" });
            }
        } catch (error) {
            reject(error);
            cleanup(callbackFuncName);
        }
    });
}

/**
 * Standard I/O stream for a child process.
 * @class
 */
class Stdio {
    constructor() {
        this.listeners = {};
    }
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
}

/**
 * Spawn shell process with ksu.spawn
 * @param {string} command - The command to execute
 * @param {string[]} [args=[]] - Array of arguments to pass to the command
 * @param {Object} [options={}] - Options object containing:
 *   - cwd <string> - Current working directory of the child process
 *   - env {Object} - Environment key-value pairs
 * @returns {Object} A child process object with:
 *   - stdout: Stream for standard output
 *   - stderr: Stream for standard error
 *   - stdin: Stream for standard input
 *   - on(event, listener): Attach event listener ('exit', 'error')
 *   - emit(event, ...args): Emit events internally
 */
function spawn(command, args = [], options = {}) {
    if (!Array.isArray(args)) {
        options = args;
        args = [];
    }
    const child = {
        listeners: {},
        stdout: new Stdio(),
        stderr: new Stdio(),
        stdin: new Stdio(),
        on(event, listener) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(listener);
        },
        emit(event, ...args) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(listener => listener(...args));
            }
        }
    };
    const callbackName = getUniqueCallbackName("spawn");
    window[callbackName] = child;
    child.on("exit", () => delete window[callbackName]);
    try {
        if (isKsuWebui()) {
            ksu.spawn(command, JSON.stringify(args), JSON.stringify(options), callbackName);
        } else {
            setTimeout(() => {
                child.stderr.emit("data", "ksu is not defined");
                child.emit("exit", 1);
            }, 0);
        }
    } catch (error) {
        child.emit("error", error);
        delete window[callbackName];
    }
    return child;
}

/**
 * Request the WebView enter/exit full screen.
 * @param {Boolean} isFullScreen - full screen state
 */
function fullScreen(isFullScreen) {
    if (isKsuWebui()) {
        ksu.fullScreen(isFullScreen);
    }
}

/**
 * Supported since KernelSU v3.0.0-55 (32234)
 * Supported since APatch 11169
 * 
 * Request the WebView to set padding to 0 or system bar insets
 * Disabled by default
 * Enabled automatically if there's a request on `internal/insets.css`
 * @deprecated Since 3.1.0 - Use {@link enableEdgeToEdge} instead
 * @param {Boolean} isEnable - insets enable state
 */
function enableInsets(isEnable) {
    try {
        enableEdgeToEdge(isEnable);
    } catch (e) { console.warn(e); }
}

/**
 * Supported since KernelSU v3.0.0-115 (32265)
 * 
 * Request the WebView to set padding to 0 or system bar insets
 * Disabled by default
 * @param {Boolean} isEnable - insets enable state
 * @returns {Promise<boolean>} A promise that resolves to true if the request is successful, false otherwise
 */
function enableEdgeToEdge(isEnable) {
    return new Promise((resolve, reject) => {
        if (typeof ksu?.enableEdgeToEdge === 'function') {
            ksu.enableEdgeToEdge(isEnable);
            return resolve(true);
        }
        if (typeof ksu?.enableInsets === 'function') {
            ksu.enableInsets(isEnable);
            return resolve(true);
        }
        reject(new Error(isKsuWebui() ? 'enableEdgeToEdge is not supported' : 'ksu is not defined'));
    });
}

/**
 * Show android toast message
 * @param {string} message - The message to display in toast
 * @returns {void}
 */
function toast(message) {
    if (isKsuWebui()) {
        ksu.toast(message);
    } else {
        console.log(message);
    }
}

/**
 * Supported since KernelSU v2.1.1-14 (22082)
 * Supported since APatch 11159
 * Fallback to pm list packages when unsupported
 * 
 * List installed packages
 * @deprecated Use pm.listPackages instead
 * @param {string} [type="all"] - The type of packages to list: "user", "system", or "all".
 * @returns {Promise<string[]>} A promise that resolves to an array of package names.
 */
async function listPackages(type) {
    if (typeof globalThis.ksu?.listPackages === 'function') {
        try {
            return JSON.parse(ksu.listPackages(type));
        } catch (error) {
            // Fallback to pm list package
        }
    }

    return new Promise((resolve, reject) => {
        const pmArgs = {
            all: [],
            user: ['-3'],
            system: ['-s'],
        };

        if (!(type in pmArgs)) {
            return reject(new Error(`Unknown listPackages type: ${type}`));
        }

        let pkgs = [];
        let stderr = '';

        const pm = spawn('pm', ['list', 'packages', ...pmArgs[type]]);
        pm.stdout.on('data', (data) => {
            if (data.trim() !== '') {
                pkgs.push(data.trim().replace(/^package:/, ''));
            }
        });
        pm.stderr.on('data', (data) => (stderr += data));
        pm.on('exit', (code) => {
            if (code !== 0) {
                return reject(new Error(`pm process exited with code ${code}: ${stderr.trim()}`));
            }
            resolve(pkgs);
        });
        pm.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * @typedef {object} PackagesInfo
 * @property {string} packageName - Package name of the application.
 * @property {string} versionName - Version of the application.
 * @property {number} versionCode - Version code of the application.
 * @property {string} appLabel - Display name of the application.
 * @property {boolean} isSystem - Whether the application is a system app.
 * @property {number} uid - UID of the application.
 */

/**
 * Supported since KernelSU v2.1.1-14 (22082)
 * Supported since APatch 11159
 * 
 * Retrieves detailed information for one or more packages.
 * @deprecated Use pm.getPackagesInfo instead
 * @param {string|string[]} pkg - A single package name or an array of package names.
 * @returns {Promise<PackagesInfo|PackagesInfo[]>} Resolves with:
 *   - a single package information object if one package is provided
 *   - {}
 *   - an array of package information objects if multiple packages are provided
 *   - [{},{}]
 */
function getPackagesInfo(pkg) {
    return new Promise((resolve, reject) => {
        if (!pkg) {
            return resolve([]);
        }

        if (typeof globalThis.ksu?.getPackagesInfo !== 'function') {
            return reject(new Error("ksu.getPackagesInfo is not available."));
        }

        const pkgs = Array.isArray(pkg) ? pkg : [pkg];
        if (pkgs.length === 0) {
            return resolve([]);
        }

        try {
            const infoJson = ksu.getPackagesInfo(JSON.stringify(pkgs));
            const result = JSON.parse(infoJson);
            
            if (!Array.isArray(pkg) && result.length === 1) {
                resolve(result[0]);
            } else {
                resolve(result);
            }
        } catch (error) {
            reject(new Error(`Failed to get package info: ${error.message}`));
        }
    });
}

const pmSupported = isKsuWebui() && typeof ksu.pm === "function";

/**
 * Convert a legacy getPackagesInfo entry into the PackageInfoPerUid shape.
 * Error entries ({@link PackageInfoError}) are passed through unchanged.
 * @param {object} entry - A legacy package info object.
 * @returns {object} The entry with a userId field added.
 */
function toPackageInfoPerUid(entry) {
    if (entry === null || typeof entry !== "object" || "error" in entry) {
        return entry;
    }
    const uid = typeof entry.uid === "number" ? entry.uid : null;
    return { ...entry, userId: uid === null ? null : Math.floor(uid / 100000) };
}

/**
 * Supported since KernelSU v3.3.1-29 (32709)
 * 
 * Package-manager helpers (multi-user aware).
 * When {@link pm.support} is false both methods fall back to the legacy
 */
const pm = {
    support: pmSupported,
    version: pmSupported ? ksu.pm().version() : 0,

    /**
     * @param {string} [type="all"] - The type of packages to list: "user", "system", or "all".
     * @returns {Promise<string[]>} Unique package names.
     */
    async listPackages(type) {
        if (pmSupported) {
            try {
                return JSON.parse(ksu.pm().listPackages(type));
            } catch (error) {
                // Fallback to the legacy listPackages
            }
        }

        const packages = await listPackages(type);
        return [...new Set(packages)];
    },

    /**
     * Get information for a list of packages, one entry per uid.
     * @param {string[]} packages - The list of package names.
     * @returns {Promise<Array<object>>} One entry per uid, or packageName/error.
     */
    async getPackagesInfo(packages) {
        const pkgs = Array.isArray(packages) ? packages : [packages];
        if (pkgs.length === 0) {
            return [];
        }

        if (pmSupported) {
            try {
                return JSON.parse(ksu.pm().getPackagesInfo(JSON.stringify(pkgs)));
            } catch (error) {
                // Fallback to the legacy getPackagesInfo
            }
        }

        const legacy = await getPackagesInfo(pkgs);
        const entries = Array.isArray(legacy) ? legacy : [legacy];
        return entries.map(toPackageInfoPerUid);
    },
};

/**
 * Close the WebUI window.
 */
function exit() {
    if (isKsuWebui()) {
        ksu.exit();
    }
}

const ioSupported = isKsuWebui() && typeof ksu.io === "function";

/**
 * Supported since KernelSU v3.3.1-28 (32708)
 * 
 * File-system helpers (file, stream and random-access-file interfaces).
 */
const io = {
    support: ioSupported,
    version: ioSupported ? ksu.io().version() : 0,

    /**
     * @param {string} path - Path of the file.
     * @returns {object} A file object with exists/isFile/isDirectory/... methods.
     */
    File(path) {
        const impl = ksu.io().File(path);
        return {
            exists() { return impl.exists(); },
            isFile() { return impl.isFile(); },
            isDirectory() { return impl.isDirectory(); },
            canRead() { return impl.canRead(); },
            canWrite() { return impl.canWrite(); },
            canExecute() { return impl.canExecute(); },
            createNewFile() { return impl.createNewFile(); },
            delete() { return impl.delete(); },
            deleteRecursive() { return impl.deleteRecursive(); },
            mkdir() { return impl.mkdir(); },
            mkdirs() { return impl.mkdirs(); },
            renameTo(destPath) { return impl.renameTo(destPath); },
            list() {
                try {
                    return JSON.parse(impl.list() || '[]');
                } catch (error) {
                    return [];
                }
            },
            listFiles() {
                try {
                    return JSON.parse(impl.listFiles() || '[]');
                } catch (error) {
                    return [];
                }
            },
            length() { return impl.length(); },
            lastModified() { return impl.lastModified(); },
            setLastModified(time) { return impl.setLastModified(time); },
            getAbsolutePath() { return impl.getAbsolutePath(); },
            getCanonicalPath() { return impl.getCanonicalPath(); },
            getParent() { return impl.getParent(); },
            getPath() { return impl.getPath(); },
            getName() { return impl.getName(); },
            isHidden() { return impl.isHidden(); },
            isBlock() { return impl.isBlock(); },
            isCharacter() { return impl.isCharacter(); },
            isSymlink() { return impl.isSymlink(); },
            createNewSymlink(target) { return impl.createNewSymlink(target); },
            createNewLink(existing) { return impl.createNewLink(existing); },
            clear() { return impl.clear(); },
            setReadOnly() { return impl.setReadOnly(); },
            setReadable(readable, ownerOnly) { return impl.setReadable(readable, ownerOnly); },
            setWritable(writable, ownerOnly) { return impl.setWritable(writable, ownerOnly); },
            setExecutable(executable, ownerOnly) { return impl.setExecutable(executable, ownerOnly); },
            getFreeSpace() { return impl.getFreeSpace(); },
            getTotalSpace() { return impl.getTotalSpace(); },
            getUsableSpace() { return impl.getUsableSpace(); },
            newInputStream() { return impl.newInputStream(); },
            newOutputStream(append) { return append !== undefined ? impl.newOutputStream(append) : impl.newOutputStream(); },
            toString() { return impl.toString(); },
        };
    },

    FileInputStream() {
        const impl = ksu.io().FileInputStream();
        return {
            open(path) { return impl.open(path); },
            read(id, maxBytes) { return maxBytes !== undefined ? impl.read(id, maxBytes) : impl.read(id); },
            available(id) { return impl.available(id); },
            close(id) { return impl.close(id); },
        };
    },

    FileOutputStream() {
        const impl = ksu.io().FileOutputStream();
        return {
            open(path, append) { return append !== undefined ? impl.open(path, append) : impl.open(path); },
            write(id, data) { return impl.write(id, data); },
            writeByte(id, b) { return impl.writeByte(id, b); },
            flush(id) { return impl.flush(id); },
            close(id) { return impl.close(id); },
        };
    },

    RandomAccessFile() {
        const impl = ksu.io().RandomAccessFile();
        return {
            open(path, mode) { return impl.open(path, mode); },
            read(id) { return impl.read(id); },
            readBytes(id, len) { return impl.readBytes(id, len); },
            readBoolean(id) { return impl.readBoolean(id); },
            readByte(id) { return impl.readByte(id); },
            readInt(id) { return impl.readInt(id); },
            readLong(id) { return impl.readLong(id); },
            readShort(id) { return impl.readShort(id); },
            readFloat(id) { return impl.readFloat(id); },
            readDouble(id) { return impl.readDouble(id); },
            readUTF(id) { return impl.readUTF(id); },
            readLine(id) { return impl.readLine(id); },
            write(id, b) { impl.write(id, b); },
            writeBase64(id, data) { impl.writeBase64(id, data); },
            writeBoolean(id, v) { impl.writeBoolean(id, v); },
            writeByte(id, v) { impl.writeByte(id, v); },
            writeInt(id, v) { impl.writeInt(id, v); },
            writeLong(id, v) { impl.writeLong(id, v); },
            writeShort(id, v) { impl.writeShort(id, v); },
            writeFloat(id, v) { impl.writeFloat(id, v); },
            writeDouble(id, v) { impl.writeDouble(id, v); },
            writeUTF(id, str) { impl.writeUTF(id, str); },
            seek(id, pos) { return impl.seek(id, pos); },
            getFilePointer(id) { return impl.getFilePointer(id); },
            length(id) { return impl.length(id); },
            setLength(id, newLength) { return impl.setLength(id, newLength); },
            close(id) { return impl.close(id); },
        };
    },
};

export {
    exec,
    spawn,
    fullScreen,
    enableInsets,
    enableEdgeToEdge,
    toast,
    listPackages,
    getPackagesInfo,
    isKsuWebui,
    exit,
    io,
    pm,
};

/**
 * Source: https://github.com/KOWX712/kernelsu-alt
 * Npm: https://www.npmjs.com/package/kernelsu-alt
 * 
 * Imported from https://www.npmjs.com/package/kernelsu
 * Modified version by KOWX712
 */

export interface ExecOptions {
    /** Current working directory of the child process */
    cwd?: string;
    /** Environment key-value pairs */
    env?: Record<string, string>;
}

export interface ExecResult {
    /** Exit code of the command */
    errno: number;
    /** Standard output from the command */
    stdout: string;
    /** Standard error from the command */
    stderr: string;
}

/**
 * Standard I/O stream for a child process.
 */
export interface Stdio {
    on(event: 'data', listener: (data: string) => void): void;
    emit(event: string, ...args: any[]): void;
}

/**
 * Child process object returned by spawn
 */
export interface ChildProcess {
    /** Stream for standard output */
    stdout: Stdio;
    /** Stream for standard error */
    stderr: Stdio;
    /** Stream for standard input */
    stdin: Stdio;
    /** Attach event listener ('exit', 'error') */
    on(event: 'exit', listener: (code: number) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    /** Emit events internally */
    emit(event: string, ...args: any[]): void;
}

export interface PackagesInfo {
    /** Package name of the application. */
    packageName: string;
    /** Version of the application. */
    versionName: string;
    /** Version code of the application. */
    versionCode: number;
    /** Display name of the application. */
    appLabel: string;
    /** Whether the application is a system app. */
    isSystem: boolean;
    /** UID of the application. */
    uid: number;
}

/**
 * Execute shell command with ksu.exec
 * @param command - The command to execute
 * @param options - Options object
 */
export function exec(command: string, options?: ExecOptions): Promise<ExecResult>;

/**
 * Spawn shell process with ksu.spawn
 * @param command - The command to execute
 * @param args - Array of arguments to pass to the command
 * @param options - Options object
 */
export function spawn(command: string, args?: string[], options?: ExecOptions): ChildProcess;

/**
 * Request the WebView enter/exit full screen.
 * @param isFullScreen - full screen state
 */
export function fullScreen(isFullScreen: boolean): void;

/**
 * Supported since KernelSU v3.0.0-55 (32234)
 * Supported since APatch 11169
 * 
 * Request the WebView to set padding to 0 or system bar insets
 * @deprecated Since 3.1.0 - Use {@link enableEdgeToEdge} instead
 * @param isEnable - insets enable state
 */
export function enableInsets(isEnable: boolean): void;

/**
 * Supported since KernelSU v3.0.0-115 (32265)
 * 
 * Request the WebView to set padding to 0 or system bar insets
 * Disabled by default
 * @param isEnable - insets enable state
 * @returns A promise that resolves to true if the request is successful, false otherwise
 */
export function enableEdgeToEdge(isEnable: boolean): Promise<boolean>;

/**
 * Show android toast message
 * @param message - The message to display in toast
 */
export function toast(message: string): void;

/**
 * Supported since KernelSU v2.1.1-14 (22082)
 * Supported since APatch 11159
 * Fallback to pm list packages when unsupported
 * 
 * List installed packages
 * @param type - The type of packages to list: "user", "system", or "all".
 */
export function listPackages(type?: "user" | "system" | "all"): Promise<string[]>;

/**
 * Supported since KernelSU v2.1.1-14 (22082)
 * Supported since APatch 11159
 * 
 * Retrieves detailed information for one or more packages.
 * @param pkg - A single package name or an array of package names.
 */
export function getPackagesInfo(pkg: string): Promise<PackagesInfo>;
export function getPackagesInfo(pkg: string[]): Promise<PackagesInfo[]>;

export type ConsoleService = {
    log: <T>(...args: T[]) => void,
    prompt: (message: string) => string | null,
}

export type FileIO = {
    read: (path: string) => Promise<Uint8Array>,
    write: (path: string, data: string) => Promise<void>
}

export type ProcessRunner = {
    run: (cmd: string[]) => Promise<string>
}
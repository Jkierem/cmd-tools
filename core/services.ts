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

export type OSService = {
    create: (path: string) => Promise<void>,
    mkDir: (path: string) => Promise<void>,
    chmod: (path: string, mode: number) => Promise<void>,
    rmDir: (path: string) => Promise<void>,
    exists: (path: string) => Promise<boolean>,
    chDir: (path: string) => Promise<void>,
}
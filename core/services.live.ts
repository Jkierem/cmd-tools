import { Maybe } from "./jazzi/mod.ts"
import { decode } from "./codec.ts"
import type { ConsoleService, FileIO, ProcessRunner, OSService } from "./services.ts"

export const LiveConsole: ConsoleService = {
    log: console.log,
    prompt: (msg: string) => prompt(msg)
}

export const LiveFileIO: FileIO = {
    read: Deno.readFile,
    write: Deno.writeTextFile
}

export const LiveProcess: ProcessRunner = {
    run: async (cmd: string[]) => {
        const proc = Deno.run({ cmd, stderr: "piped", stdout: "piped"})
        const status = await proc.status()
        const stdOut = await proc.output()
        const stdErr = await proc.stderrOutput()
        const decodeOrEmpty = (uint: Uint8Array) => Maybe.fromEmpty(uint).map(decode).onNone('')
    
        const message = `${decodeOrEmpty(stdOut) || decodeOrEmpty(stdErr)}`
        if( status.code === 0 ){
            return message
        } else {
            return Promise.reject(message+`Process exited with non-zero code ${status.code}`)
        }
    },
}

export const LiveOS: OSService = {
    chmod: Deno.chmod,
    create: (path: string) => Deno.create(path).then(() => {}),
    mkDir: (path: string) => Deno.mkdir(path),
    rmDir: (path: string) => Deno.remove(path, { recursive: true }),
    chDir: (path: string) => Promise.resolve(Deno.chdir(path)),
    exists: async (path: string) => {
        try {
            await Deno.lstat(path)
            return true
        } catch(e) {
            if(e instanceof Deno.errors.NotFound){
                return false
            }
            throw e
        }
    }
}

const print = (str: string) => Promise.resolve(console.log(str))

export const DryOS: OSService = {
    chmod: (path: string, mode: number) => print(`os.chmod(${path},${mode})`),
    create: (path: string) => print(`os.create(${path})`),
    mkDir: (path: string) => print(`os.mkDir(${path})`),
    rmDir: (path: string) => print(`os.rmDir(${path})`),
    chDir: (path: string) => print(`os.chDir(${path})`),
    exists: (path: string) => print(`os.exists(${path})`).then(() => true)
}
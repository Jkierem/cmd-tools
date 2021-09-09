import Maybe from "./maybe.mod.ts"
import { decode } from "./codec.mod.ts"
import type { ConsoleService, FileIO, ProcessRunner } from "./services.mod.ts"

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
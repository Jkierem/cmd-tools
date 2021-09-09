import IOPromise from "./io-promise.mod.ts"
import Maybe from "./maybe.mod.ts"
import { decode } from "./codec.mod.ts"

const decodeOrEmpty = (uint: Uint8Array) => Maybe.fromEmpty(uint).map(decode).onNone('')

const promisifyProcess = async <T extends Deno.RunOptions>(proc: Deno.Process<T>) => {
    const status = await proc.status()
    const stdOut = await proc.output()
    const stdErr = await proc.stderrOutput()

    const message = `${decodeOrEmpty(stdOut) || decodeOrEmpty(stdErr)}`
    if( status.code === 0 ){
        return message
    } else {
        return Promise.reject(message+`Process exited with non-zero code ${status.code}`)
    }
}

export type ProcessRunner = {
    run: (cmd: string[]) => Promise<string>
}

export const LiveProcess: ProcessRunner = {
    run: (cmd: string[]) => promisifyProcess(Deno.run({ cmd, stderr: "piped", stdout: "piped"}))
}

const IOProcess = {
    of: (cmd: string[]) => {
        return IOPromise
            .require<{ runner: ProcessRunner }>()
            .access("runner")
            .chain(runner => IOPromise.of(() => runner.run(cmd)))
    },
}

export default IOProcess
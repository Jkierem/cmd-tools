import IOPromise from './io-promise.mod.ts'
import Maybe from './maybe.mod.ts'
import { decode } from "./decode.mod.ts"
import { EmptyConfig } from "./configuration.mod.ts"

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

const denoProc = (cmd: string[]) => promisifyProcess(Deno.run({ cmd, stderr: "piped", stdout: "piped" }))

export const IOProcess = {
    of: IOPromise.unary(denoProc),
}

export type CommandEmptyConfig = EmptyConfig

export type CommandResult<T> = T | never

export type CommandEnv<T = EmptyConfig> = { args: string[], config: T }

export type Command<Env,A> = IOPromise<CommandEnv<Env>,CommandResult<A>>

export const Command = {
    ask: <T = EmptyConfig>() => IOPromise.require<CommandEnv<T>>(),
    pure: <T = EmptyConfig>(): Command<T, CommandEnv<T>> => IOPromise.require<CommandEnv<T>>(),
    fail: <T>(cause: T) => IOPromise.fail(cause) as Command<unknown,never>,
    succeed: <T>(value: T) => IOPromise.succeed(value) as Command<unknown,T>,
}
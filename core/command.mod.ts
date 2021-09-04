import IOPromise from './io-promise.mod.ts'
import Maybe from './maybe.mod.ts'

const Decoder = new TextDecoder()
const decode = (x: Uint8Array) => Decoder.decode(x)

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

export type CommandResult<T> = T | never

export type CommandConfig = {}

export type CommandEnv = { args: string[], config: CommandConfig }

export type Command<A> = IOPromise<CommandEnv,CommandResult<A>>

export const Command = {
    of: <A>(fn: (env: CommandEnv) => Promise<A>): Command<A> => IOPromise.of(fn),
    ask: () => IOPromise.of<CommandEnv, CommandEnv>(x => Promise.resolve(x)),
    pure: (): Command<CommandEnv> => IOPromise.of(x => Promise.resolve(x)),
    fail: <T>(cause: T) => IOPromise.fail(cause) as Command<never>,
    succeed: <T>(value: T) => IOPromise.succeed(value) as Command<T>
}
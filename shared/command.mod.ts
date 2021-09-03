import IOPromise from './io-promise.mod.ts'
import Reader from '../shared/reader.mod.ts'

const Decoder = new TextDecoder()
const decode = (x: Uint8Array) => Decoder.decode(x)

const promisifyProcess = async <T extends Deno.RunOptions>(proc: Deno.Process<T>) => {
    const status = await proc.status()
    if( status.code === 0 ){
        return proc.output()
    } else {
        const err = await proc.stderrOutput();
        return Promise.reject(`${decode(err)} \nProcess exited with non-zero code ${status.code}`)
    }
}

const denoProc = (cmd: string[]) => promisifyProcess(Deno.run({ cmd, stderr: "piped", stdout: "piped" }))

export const IOProcess = {
    of: IOPromise.unary(denoProc),
    decoded: (cmd: string[]) => IOProcess.of(cmd).map(decode)
}

export type CommandResult<T> = Promise<T> | Promise<never>

export type CommandEnv = { args: string[] }

export type Command<A> = Reader<CommandEnv,CommandResult<A>>

export const Command = {
    of: <A>(fn: (env: CommandEnv) => Promise<A>): Command<A> => Reader.of(fn),
    ask: () => Reader.of<CommandEnv,CommandEnv>(x => x),
    pure: (): Command<CommandEnv> => Reader.of<CommandEnv, CommandResult<CommandEnv>>(x => Promise.resolve(x)),
    fail: <T>(cause: T) => Reader.of<CommandEnv,CommandResult<never>>(() => Promise.reject(cause)),
    succeed: <T>(value: T) => Command.pure().map(() => value)
}
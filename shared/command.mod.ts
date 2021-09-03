import IO from './io.mod.ts'
import Reader from '../shared/reader.mod.ts'

export const IOCommand = (cmd: string[]) => IO.of(() => Deno.run({ cmd, stdout: "piped", stderr: "piped" }))

export type CommandResult<T> = Promise<T> | Promise<never>

export type CommandEnv = { args: string[] }

export type Command<A> = Reader<CommandEnv,CommandResult<A>>

export const Command = {
    of: <A>(fn: (env: CommandEnv) => Promise<A>): Command<A> => Reader.of(fn),
    ask: () => Reader.of<CommandEnv,CommandEnv>(x => x),
    pure: (): Command<CommandEnv> => Reader.of<CommandEnv, CommandResult<CommandEnv>>(x => Promise.resolve(x))
}

const Decoder = new TextDecoder()
export const decode = (x: Uint8Array) => Decoder.decode(x)
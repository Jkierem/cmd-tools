import Async from './jazzi/async/mod.ts'
import type { Async as AsyncT } from './jazzi/async/types.ts'
import { EmptyConfig } from "./configuration.ts"
import type { FileIO, ConsoleService, ProcessRunner, OSService } from "./services.ts"

export type CommandEmptyConfig = EmptyConfig

export type CommandResult<T> = T | never

export type CommandEnv<T = EmptyConfig> = { 
    args: string[], 
    config: T, 
    runner: ProcessRunner,
    fileIO: FileIO,
    console: ConsoleService
    os: OSService
}

export type Command<Env,A> = AsyncT<CommandEnv<Env>, unknown, CommandResult<A>>

export type CommandOf<A> = Command<EmptyConfig,A>

export const Command = {
    ask: <T = EmptyConfig>() => Async.require<CommandEnv<T>>(),
    pure: <T = EmptyConfig>(): Command<T, CommandEnv<T>> => Async.require<CommandEnv<T>>(),
    fail: <T>(cause: T) => Async.Fail(cause) as Command<unknown,never>,
    succeed: <T>(value: T) => Async.Success(value) as Command<unknown,T>,
}
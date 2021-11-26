import IOPromise from './io-promise.ts'
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

export type Command<Env,A> = IOPromise<CommandEnv<Env>,CommandResult<A>>

export type CommandOf<A> = Command<EmptyConfig,A>

export const Command = {
    ask: <T = EmptyConfig>() => IOPromise.require<CommandEnv<T>>(),
    pure: <T = EmptyConfig>(): Command<T, CommandEnv<T>> => IOPromise.require<CommandEnv<T>>(),
    fail: <T>(cause: T) => IOPromise.fail(cause) as Command<unknown,never>,
    succeed: <T>(value: T) => IOPromise.succeed(value) as Command<unknown,T>,
}
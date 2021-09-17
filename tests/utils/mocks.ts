import type { ProcessRunner, FileIO, ConsoleService } from "../../core/services.mod.ts"
import { Spy } from "./spy.ts"

// deno-lint-ignore no-explicit-any
type AnyFn = (...args: any[]) => any

type Mockeable = Record<string, AnyFn>

type Mocked<T extends Mockeable> = {
    [P in keyof T]: Spy<Parameters<T[P]>,ReturnType<T[P]>>
}

type MockContainer = {
    [P: string]: Mocked<Mockeable>
}

type MockedEnv = {
    runner: Mocked<ProcessRunner>,
    console: Mocked<ConsoleService>,
    fileIO: Mocked<FileIO>
}

export const resetMock = <T extends Mockeable>(mocked: Mocked<T>): void => {
    Object.keys(mocked).forEach(key => mocked[key].reset())
}

export const resetMockContainer = (cont: MockContainer): void => {
    Object.keys(cont).forEach(c => resetMock(cont[c]))
}

export const Mock = {
    resetMock,
    resetMockContainer
}

export const createMockRunner = (): Mocked<ProcessRunner> => ({
    run: Spy((_: string[]) => Promise.resolve(""))
})

export const createMockFileIO = (): Mocked<FileIO> => ({
    read: Spy((_path: string) => Promise.resolve(new Uint8Array())),
    write: Spy((_path: string, _data: string) => Promise.resolve())
})

export const createMockConsole = (): Mocked<ConsoleService> => ({
    log: Spy((..._) => {}),
    prompt: Spy((_: string) => "")
})

export const createMockEnv = (): MockedEnv => ({
    runner: createMockRunner(),
    console: createMockConsole(),
    fileIO: createMockFileIO(),
})
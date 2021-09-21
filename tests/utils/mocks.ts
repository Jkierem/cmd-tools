import { AssertionError } from "https://deno.land/std@0.106.0/testing/asserts.ts";
import { Spy } from "./spy.ts"
import type { ProcessRunner, FileIO, ConsoleService, OSService } from "../../core/services.mod.ts"

// deno-lint-ignore no-explicit-any
type AnyFn = (...args: any[]) => any

type Mockeable = Record<string, AnyFn>

type Mocked<T extends Mockeable = Mockeable> = {
    [P in keyof T]: Spy<Parameters<T[P]>,ReturnType<T[P]>>
}

type MockContainer = {
    [P: string]: Mocked<Mockeable>
}

type MockedEnv = {
    runner: Mocked<ProcessRunner>,
    console: Mocked<ConsoleService>,
    fileIO: Mocked<FileIO>,
    os: Mocked<OSService>,
}

const values = <T,U extends string>(obj: Record<U,T>): T[] => Object.keys(obj).map((key) => obj[key as U])
const callReset = (obj: { reset: () => void }) => obj.reset()
export const traverseMock = (fn: (sp: Spy<unknown[],unknown>) => void, mock: Mocked<Mockeable>) => values(mock).forEach(fn)
export const traverseMockContainer = (fn: (sp: Spy<unknown[],unknown>) => void, cont: MockContainer) => values(cont).forEach(m => traverseMock(fn,m))
export const resetMock = <T extends Mockeable>(mocked: Mocked<T>): void => traverseMock(callReset, mocked)
export const resetMockContainer = (cont: MockContainer): void => traverseMockContainer(callReset, cont)
export const assertNoneWasCalled = (mock: Mocked, msg?: string) => {
    try {
        traverseMock((sp) => sp.assert.wasNotCalled() ,mock)
    } catch {
        throw new AssertionError(msg ?? `Expected every function in mock to have not been called`)
    }
}
export const assertEveryWasCalled = (mock: Mocked, msg?: string) => {
    try {
        traverseMock((sp) => sp.assert.wasCalled() ,mock)
    } catch {
        throw new AssertionError(msg ?? `Expected every function in mock to have been called`)
    }
}

export const Mock = {
    resetMock,
    resetMockContainer,
    traverseMock,
    traverseMockContainer,
    assertNoneWasCalled,
    assertEveryWasCalled,
}

export const createMockedRunner = (): Mocked<ProcessRunner> => ({
    run: Spy((_: string[]) => Promise.resolve(""))
})

export const createMockedFileIO = (): Mocked<FileIO> => ({
    read: Spy((_path: string) => Promise.resolve(new Uint8Array())),
    write: Spy(async (_path: string, _data: string) => {})
})

export const createMockedConsole = (): Mocked<ConsoleService> => ({
    log: Spy((..._) => {}),
    prompt: Spy((_: string) => "")
})

export const createMockedOS = (): Mocked<OSService> => ({
    chmod: Spy(async (_path: string, _mode: number) => {}),
    create: Spy(async (_path: string) => {}),
    exists: Spy((_path: string) => Promise.resolve(true)),
    mkDir: Spy(async (_path: string) => {}),
    rmDir: Spy(async (_path: string) => {})
})

export const createMockedEnv = (): MockedEnv => ({
    runner: createMockedRunner(),
    console: createMockedConsole(),
    fileIO: createMockedFileIO(),
    os: createMockedOS()
})
import AutoCommit from "../../commands/auto-commit.ts"
import { fromArray } from "../utils/script.ts"
import { attempt } from "../utils/try.ts"
import { 
    createMockedEnv, 
    resetMockContainer, 
    assertServiceWasNotUsed,
    createSimpleSandbox,
    wrapInAsync
} from "../utils/mocks.ts"

const MockedEnv = createMockedEnv()
const {
    runner: MockRunner,
    fileIO: MockFileIO,
    console: MockConsole,
    os: MockOS,
} = MockedEnv

const cleanup = wrapInAsync(() => resetMockContainer(MockedEnv))
const sandbox = createSimpleSandbox({ cleanup })

Deno.test("AutoCommit -> Happy Path -> With feature branch detection", sandbox(async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch J-42"),
        Promise.resolve("Test complete"),
    ]))

    const result = await attempt(() => AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: "J" },
        ...MockedEnv
    }))

    result.expect.toReturn("Test complete")
    assertServiceWasNotUsed(MockOS)
    assertServiceWasNotUsed(MockFileIO)
    MockConsole.prompt.assert.wasNotCalled()
    MockConsole.log.assert.wasCalledOnce()
    MockConsole.log.assert.wasCalledWith('About to run "git commit -m J-42: commit message"')
    MockRunner.run.assert.wasCalledTwice()
    MockRunner.run.assert.wasCalledWith(["git","status"])
    MockRunner.run.assert.wasCalledWith(["git","commit","-m","J-42: commit message"])
}))

Deno.test("AutoCommit -> Happy Path -> Without feature branch detection", sandbox(async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch main"),
        Promise.resolve("Test complete"),
    ]))

    const result = await attempt(() => AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: null as unknown as string },
        ...MockedEnv
    }))

    result.expect.toReturn("Test complete")
    assertServiceWasNotUsed(MockOS)
    assertServiceWasNotUsed(MockFileIO)
    MockConsole.prompt.assert.wasNotCalled()
    MockConsole.log.assert.wasCalledTwice()
    MockConsole.log.assert.wasCalledWith('Feature branch detection is off. Proceeding...')
    MockConsole.log.assert.wasCalledWith('About to run "git commit -m main: commit message"')
    MockRunner.run.assert.wasCalledTwice()
    MockRunner.run.assert.wasCalledWith(["git","status"])
    MockRunner.run.assert.wasCalledWith(["git","commit","-m","main: commit message"])
}))

Deno.test("AutoCommit -> Failure Path -> Branch must have numbers", sandbox(async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch J-")
    ]))

    const result = await attempt(() => AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: "J" },
        ...MockedEnv
    }))

    result.expect.toThrow("Branch is not a feature branch")
}))

Deno.test("AutoCommit -> Failure Path -> Branch is not feature branch", sandbox(async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch Not-feature-branch")
    ]))

    const result = await attempt(() => AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: "J" },
        ...MockedEnv
    }))

    result.expect.toThrow("Branch is not a feature branch")
}))

Deno.test("AutoCommit -> Failure Path -> No message provided", sandbox(async () => {
    const result = await attempt(() => AutoCommit.run({
        args: [],
        config: { ticketToken: "J" },
        ...MockedEnv
    }))

    result.expect.toThrow("No message provided")
}))

Deno.test("AutoCommit -> Failure Path -> Empty message", sandbox(async () => {
    const result = await attempt(() => AutoCommit.run({
        args: ["     "],
        config: { ticketToken: "J" },
        ...MockedEnv
    }))

    result.expect.toThrow("Message is empty")
}))
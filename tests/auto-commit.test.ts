import { assert, assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";
import AutoCommit from "../commands/auto-commit.mod.ts"
import { createMockEnv, resetMockContainer } from "./utils/mocks.ts"
import { fromArray } from "./utils/script.ts"

const MockedEnv = createMockEnv()
const {
    runner: MockRunner,
    fileIO: MockFileIO,
    console: MockConsole
} = MockedEnv

const cleanup = () => resetMockContainer(MockedEnv)

Deno.test("AutoCommit -> Happy path", async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch J-42"),
        Promise.resolve("Test complete"),
    ]))

    const res = await AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: "J" },
        ...MockedEnv
    })

    assertEquals(res, "Test complete")
    MockFileIO.read.assert.wasNotCalled()
    MockFileIO.write.assert.wasNotCalled()
    MockConsole.prompt.assert.wasNotCalled()
    MockConsole.log.assert.wasCalledOnce()
    MockConsole.log.assert.wasCalledWith('About to run "git commit -m J-42: commit message"')
    MockRunner.run.assert.wasCalledTwice()
    MockRunner.run.assert.wasCalledWith(["git","status"])
    MockRunner.run.assert.wasCalledWith(["git","commit","-m","J-42: commit message"])
    cleanup()
})

Deno.test("AutoCommit -> Branch is not feature branch", async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch Not-feature-branch")
    ]))
    try {
        await AutoCommit.run({
            args: ["commit message"],
            config: { ticketToken: "J" },
            ...MockedEnv
        })
        assert(false, "Should have thrown")
    } catch(e: unknown) {
        assertEquals(e, "Branch is not a feature branch")
    }
    cleanup()
})

Deno.test("AutoCommit -> Without feature branch detection", async () => {
    MockRunner.run.setImplementation(fromArray([
        Promise.resolve("On branch main"),
        Promise.resolve("Test complete"),
    ]))

    const res = await AutoCommit.run({
        args: ["commit message"],
        config: { ticketToken: null as unknown as string },
        ...MockedEnv
    })

    assertEquals(res, "Test complete")
    MockFileIO.read.assert.wasNotCalled()
    MockFileIO.write.assert.wasNotCalled()
    MockConsole.prompt.assert.wasNotCalled()
    MockConsole.log.assert.wasCalledTwice()
    MockConsole.log.assert.wasCalledWith('Feature branch detection is off. Proceeding...')
    MockConsole.log.assert.wasCalledWith('About to run "git commit -m main: commit message"')
    MockRunner.run.assert.wasCalledTwice()
    MockRunner.run.assert.wasCalledWith(["git","status"])
    MockRunner.run.assert.wasCalledWith(["git","commit","-m","main: commit message"])
    cleanup()
})
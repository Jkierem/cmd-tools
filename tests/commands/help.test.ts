import HelpCommand from "../../commands/help.ts"
import { attempt } from "../utils/try.ts"
import { createSandboxedEnv, assertServiceWasNotUsed } from "../utils/mocks.ts"
import { resolveFolder, relativePathTo } from "../../core/resolve.ts"
import { fromArray } from "../utils/script.ts"

const fileText = "Hey there"
const fileUint = new TextEncoder().encode(fileText)
const sandboxed = createSandboxedEnv()

Deno.test("HelpCommand -> Happy Path", sandboxed(async (MockedEnv) => {
    MockedEnv.fileIO.read.setImplementation(fromArray([
        Promise.resolve(fileUint)
    ]))

    const fileUrl = "file:///folder/index.ts"
    const helpPath = relativePathTo("resources/help.txt")(resolveFolder(fileUrl))

    const result = await attempt(() => HelpCommand.run({
        args: [],
        config: { fileUrl },
        ...MockedEnv
    }))

    result.expect.toReturn(fileText)
    MockedEnv.fileIO.read.assert.wasCalledOnce()
    MockedEnv.fileIO.read.assert.wasCalledWith(helpPath)
    MockedEnv.fileIO.write.assert.wasNotCalled()
    assertServiceWasNotUsed(MockedEnv.console)
    assertServiceWasNotUsed(MockedEnv.os)
    assertServiceWasNotUsed(MockedEnv.runner)
}))
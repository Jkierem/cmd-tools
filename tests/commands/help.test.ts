import HelpCommand from "../../commands/help.ts"
import { attempt } from "../utils/try.ts"
import { createSandboxedEnv, assertServiceWasNotUsed } from "../utils/mocks.ts"
import { fromArray } from "../utils/script.ts"

const encoder = new TextEncoder()
const fileText = "Hey there"
const fileUint = encoder.encode(fileText)
const sandboxed = createSandboxedEnv()

Deno.test("HelpCommand -> Happy Path", sandboxed(async (MockedEnv) => {
    MockedEnv.fileIO.read.setImplementation(fromArray([
        Promise.resolve(fileUint)
    ]))

    const fileUrl = "file:///folder/index.ts"
    const helpPath = "/folder/resources/help.txt"

    const result = await attempt(() => HelpCommand.run({
        args: [],
        config: {
            fileUrl,
        },
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
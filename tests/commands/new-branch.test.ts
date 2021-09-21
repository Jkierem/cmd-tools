import NewBranch from "../../commands/new-branch.ts"
import { fromArray } from "../utils/script.ts"
import { attempt } from "../utils/try.ts"
import { createSandboxedEnv, assertServiceWasNotUsed } from "../utils/mocks.ts"

const sandboxed = createSandboxedEnv()

Deno.test("NewBranch -> Happy Path -> With Branch Prefix", sandboxed(async (Env) => {
    const args = ["some","new","branch"]
    const branchPrefix = "Test"
    const joinChar = "-"
    const expectedBranch = [branchPrefix, ...args].join(joinChar)
    const cmdMessage = "git has some message for branch creation"

    Env.console.prompt.setImplementation(fromArray(["yes"]))

    Env.runner.run.setImplementation(fromArray([
        Promise.resolve(cmdMessage)
    ]))

    const result = await attempt(() => NewBranch.run({
        args,
        config: { 
            joinChar,
            branchPrefix,
        },
        ...Env,
    }))

    result.expect.toReturn(cmdMessage);
    Env.console.prompt.assert.wasCalledOnce()
    Env.console.log.assert.wasCalledOnce()
    Env.console.log.assert.wasCalledWith(`About to run "git checkout -b ${expectedBranch}"`)
    Env.runner.run.assert.wasCalledOnce()
    Env.runner.run.assert.wasCalledWith(["git","checkout","-b",expectedBranch])
    assertServiceWasNotUsed(Env.fileIO)
    assertServiceWasNotUsed(Env.os)
}))

Deno.test("NewBranch -> Happy Path -> Without Branch Prefix", sandboxed(async (Env) => {
    const args = ["some","new","branch"]
    const branchPrefix = null as unknown as string
    const joinChar = "-"
    const expectedBranch = args.join(joinChar)
    const cmdMessage = "git has some message for branch creation"

    Env.console.prompt.setImplementation(fromArray(["yes"]))

    Env.runner.run.setImplementation(fromArray([
        Promise.resolve(cmdMessage)
    ]))

    const result = await attempt(() => NewBranch.run({
        args,
        config: { 
            joinChar,
            branchPrefix, 
        },
        ...Env,
    }))

    result.expect.toReturn(cmdMessage);
    Env.console.prompt.assert.wasCalledOnce()
    Env.console.log.assert.wasCalledTwice()
    Env.console.log.assert.wasCalledWith("Branch prefixing is disabled. Proceeding without prefix...")
    Env.console.log.assert.wasCalledWith(`About to run "git checkout -b ${expectedBranch}"`)
    Env.runner.run.assert.wasCalledOnce()
    Env.runner.run.assert.wasCalledWith(["git","checkout","-b",expectedBranch])
    assertServiceWasNotUsed(Env.fileIO)
    assertServiceWasNotUsed(Env.os)
}))
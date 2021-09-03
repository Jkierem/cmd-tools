import AutoCommit from "./commands/auto-commit.mod.ts"
import NewBranch from "./commands/auto-new-branch.mod.ts"
import { Command } from "./shared/command.mod.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.of<never>(() => {
    return Promise.reject(`No "${cmdName}" command found`)
})

const Debug = Command.pure().map(env => env.then(x => JSON.stringify(x)))

const pickCommand = (cmdName: string): Command<string> => {
    return {
        commit: AutoCommit,
        debug: Debug,
        branch: NewBranch,
    }[cmdName] ?? NoOp(cmdName)
}

const onConsole = (method: "log" | "error") => (pre: string) => (x: string) => {
    console[method](pre)
    console[method](x)
}
const logSuccess = onConsole("log")
const logError = onConsole("error")

pickCommand(command)
.run({ args: commandArgs })
.then(logSuccess("Command was succesful"))
.catch(logError("Command failed"))
import AutoCommit from "./commands/auto-commit.mod.ts"
import SmartMove from "./commands/smart-move.mod.ts"
import NewBranch from "./commands/new-branch.mod.ts"
import AutoUpdate from "./commands/auto-update.mod.ts"
import { Command } from "./core/command.mod.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.fail(`No "${cmdName}" command found`)

const Debug = Command.ask().map(JSON.stringify)

const pickCommand = (cmdName: string): Command<string> => {
    return {
        commit: AutoCommit,
        debug: Debug,
        branch: NewBranch,
        move: SmartMove,
        update: AutoUpdate,
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
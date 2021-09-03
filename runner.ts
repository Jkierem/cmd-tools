import AutoCommit from "./auto-commit.mod.ts"
import { Command } from "./shared.mod.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.of<never>(() => {
    return Promise.reject(`No "${cmdName}" command found`)
})

const Debug = Command.pure()

const pickCommand = (cmdName: string) => {
    return {
        commit: AutoCommit,
        debug: Debug
    }[cmdName] ?? NoOp(cmdName)
}

pickCommand(command).run({
    args: commandArgs
})
.then(res => {
    console.log("Command was succesful")
    console.log(res)
})
.catch(err => {
    console.error("Command failed")
    console.error(err)
})
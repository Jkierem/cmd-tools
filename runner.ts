import AutoCommit from "./commands/auto-commit.mod.ts"
import AutoUpdate from "./commands/auto-update.mod.ts"
import ConfigCommand from "./commands/config-command.mod.ts"
import HelpCommand from "./commands/help.mod.ts"
import NewBranch from "./commands/new-branch.mod.ts"
import SmartMove from "./commands/smart-move.mod.ts"
import SelfCommands from "./commands/self-commands.mod.ts"
import IOPromise  from "./core/io-promise.mod.ts"
import { Command, CommandEnv } from "./core/command.mod.ts"
import { getConfig, Config } from "./core/configuration.mod.ts"
import { LiveProcess, LiveFileIO, LiveConsole, LiveOS } from "./core/services.live.mod.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.fail(`No "${cmdName}" command found`)

function specialStringify<T>(key: string, value: T){
    if( typeof value === "function" ){
        return `[Function ${key}]`
    }
    return value
}
const Debug = Command.ask().map((x: CommandEnv) => JSON.stringify(x,specialStringify,3))

const pickCommand = IOPromise
    .require<{ command: string, args: string[], config: Config }>()
    .chain(({ command, config, args }) => {
        const cmd = {
            branch: NewBranch,
            commit: AutoCommit,
            config: ConfigCommand,
            debug: Debug,
            help: HelpCommand,
            move: SmartMove,
            update: AutoUpdate,
            self: SelfCommands
        }[command] ?? NoOp(command)
        return cmd.supply({ args, config, command })
    })

const onConsole = (method: "log" | "error") => (msg: string) => (x: string) => {
    console[method](x)
    console[method](msg)
}
const logSuccess = onConsole("log")
const logError = onConsole("error")

getConfig
.accessChain("config",(config) => pickCommand.supply({ config }))
.run({
    command,
    fileUrl: import.meta.url, 
    args: commandArgs,
    runner: LiveProcess,
    fileIO: LiveFileIO,
    console: LiveConsole,
    os: LiveOS
})
.then(logSuccess("Command was succesful"))
.catch(logError("Command failed"))
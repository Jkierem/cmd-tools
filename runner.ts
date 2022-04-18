import AutoAdd from "./commands/auto-add.ts"
import AutoCommit from "./commands/auto-commit.ts"
import AutoUpdate from "./commands/auto-update.ts"
import ConfigCommand from "./commands/config-command.ts"
import HelpCommand from "./commands/help.ts"
import NewBranch from "./commands/new-branch.ts"
import SmartMove from "./commands/smart-move.ts"
import SelfCommands from "./commands/self-commands.ts"
import { Async } from "./core/jazzi/mod.ts"
import { Command, CommandEnv } from "./core/command.ts"
import { getConfig, Config } from "./core/configuration.ts"
import { LiveProcess, LiveFileIO, LiveConsole, LiveOS } from "./core/services.live.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.fail(`No "${cmdName}" command found`)

function specialStringify<T>(key: string, value: T){
    if( typeof value === "function" ){
        return `[Function ${key}]`
    }
    return value
}
const Debug = Command.ask().map((x: CommandEnv) => JSON.stringify(x,specialStringify,3))

const pickCommand = Async
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
            self: SelfCommands,
            add: AutoAdd
        }[command] ?? NoOp(command)
        return cmd.provide({ 
            args, 
            command,
            config, 
        // deno-lint-ignore no-explicit-any
        } as any)
    })

const onConsole = (method: "log" | "error") => (msg: string) => (x: string) => {
    console[method](x)
    console[method](msg)
}
const logSuccess = onConsole("log")
const logError = onConsole("error")

getConfig
// deno-lint-ignore no-explicit-any
.chain(({ config }) => pickCommand.providePartial({ config: config as any }))
.run({
    command,
    fileUrl: import.meta.url, 
    args: commandArgs,
    runner: LiveProcess,
    fileIO: LiveFileIO,
    console: LiveConsole,
    os: LiveOS
// deno-lint-ignore no-explicit-any
} as any)
.then(logSuccess("Command was succesful"))
.catch(logError("Command failed"))
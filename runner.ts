import AutoCommit from "./commands/auto-commit.mod.ts"
import AutoUpdate from "./commands/auto-update.mod.ts"
import Build from "./commands/build.mod.ts"
import ConfigCommand from "./commands/config-command.mod.ts"
import InitConfig from "./commands/init-config.mod.ts"
import NewBranch from "./commands/new-branch.mod.ts"
import SmartMove from "./commands/smart-move.mod.ts"
import IOPromise  from "./core/io-promise.mod.ts"
import { Command } from "./core/command.mod.ts"
import { getConfig, Config } from "./core/configuration.mod.ts"
import { LiveProcess, LiveFileIO, LiveConsole } from "./core/services.live.mod.ts"

const [command, ...commandArgs] = Deno.args

const NoOp = (cmdName: string) => Command.fail(`No "${cmdName}" command found`)

const Debug = Command.ask().map(JSON.stringify)

const pickCommand = IOPromise
    .require<{ command: string, args: string[], config: Config }>()
    .supply({ command })
    .chain(({ command, config, args }) => {
        const cmd = {
            commit: AutoCommit,
            debug: Debug,
            branch: NewBranch,
            move: SmartMove,
            update: AutoUpdate,
            config: ConfigCommand,
            build: Build,
            init: InitConfig,
        }[command] ?? NoOp(command)
        return cmd.supply({ args, config })
    })

const onConsole = (method: "log" | "error") => (pre: string) => (x: string) => {
    console[method](x)
    console[method](pre)
}
const logSuccess = onConsole("log")
const logError = onConsole("error")

getConfig
.accessChain("config",(config) => pickCommand.supply({ config }))
.run({ 
    command, 
    fileUrl: import.meta.url, 
    args: commandArgs ,
    runner: LiveProcess,
    fileIO: LiveFileIO,
    console: LiveConsole,
})
.then(logSuccess("Command was succesful"))
.catch(logError("Command failed"))
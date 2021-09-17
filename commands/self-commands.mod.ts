import IOPromise from "../core/io-promise.mod.ts"
import { Command } from "../core/command.mod.ts"
import BuildCommand from "./self-commands/build.mod.ts"
import InitCommand from "./self-commands/init-config.mod.ts"
import UpdateSelf from "./self-commands/update-self.mod.ts"

const SelfCommands = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .map(({ fileUrl, args }) => ({ fileUrl, action: args[0] }))
    .chain(({ action }) => {
        return {
            init: InitCommand,
            build: BuildCommand,
            update: UpdateSelf
        }[action] ?? IOPromise.fail(`Self action "${action}" is not available`)
    })

export default SelfCommands
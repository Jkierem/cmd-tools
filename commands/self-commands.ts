import IOPromise from "../core/io-promise.ts"
import { Command } from "../core/command.ts"
import BuildCommand from "./self-commands/build.ts"
import InitCommand from "./self-commands/init-config.ts"
import UpdateSelf from "./self-commands/update-self.ts"

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
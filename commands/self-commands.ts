import A from "../core/jazzi/async/mod.ts"
import { Async } from "../core/jazzi/async/types.ts"
import { openDependency } from '../core/jazzi/ext.ts'
import { Command, CommandEnv } from "../core/command.ts"
import BuildCommand from "./self-commands/build.ts"
import InitCommand from "./self-commands/init-config.ts"
import UpdateSelf from "./self-commands/update-self.ts"

const SelfCommands = Command
    .ask<{ fileUrl: string }>()
    .pipe(openDependency("config"))
    .map(({ fileUrl, args }) => ({ fileUrl, action: args[0] }))
    .chain(({ action }) => {
        return {
            init: InitCommand,
            build: BuildCommand,
            update: UpdateSelf
        }[action] ?? A.Fail(`Self action "${action}" is not available`) as Async<CommandEnv<{
            fileUrl: string;
        }>, unknown, string>
    })

export default SelfCommands
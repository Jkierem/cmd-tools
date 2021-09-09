import { 
    getCurrentBranch, 
    switchBranch, 
    pullBranch, 
    rebaseBranch, 
    stashBranch,
    hasChanges,
} from '../core/git-helpers.mod.ts'
import { Command } from '../core/command.mod.ts'
import { printLn } from "../core/io-helpers.mod.ts"
import { UpdateConfig } from "../core/configuration.mod.ts"

const AutoUpdate: Command<UpdateConfig,string> = Command
    .ask<UpdateConfig>()
    .openDependency("config")
    .supplyChain("hasChanges", hasChanges)
    .effect(({ autoStashEnabled, hasChanges, runner }) => {
        return autoStashEnabled === "true" 
            ? hasChanges 
                ? stashBranch.supply({ runner }).chain(printLn)
                : printLn("Branch has no changes")
            : printLn("Autostash is disabled")
    })
    .supplyChain("currentBranch", getCurrentBranch)
    .effect(({ runner, baseBranch }) => switchBranch(baseBranch).supply({ runner }))
    .effect(({ runner, pullOptions }) => pullBranch(...(pullOptions === "default" ? [] : ["--rebase"])).supply({ runner }))
    .effect(({ runner, currentBranch }) => switchBranch(currentBranch).supply({ runner }))
    .accessChain("baseBranch", rebaseBranch)

export default AutoUpdate
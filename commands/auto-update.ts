import { 
    getCurrentBranch, 
    switchBranch, 
    pullBranch, 
    rebaseBranch, 
    stashBranch,
    hasChanges,
} from '../core/git-helpers.ts'
import { Command } from '../core/command.ts'
import { printLn } from "../core/io-helpers.ts"
import { UpdateConfig } from "../core/configuration.ts"

const AutoUpdate: Command<UpdateConfig,string> = Command
    .ask<UpdateConfig>()
    .openDependency("config")
    .supplyChain("hasChanges", hasChanges)
    .effect(({ autoStashEnabled, hasChanges }) => {
        return autoStashEnabled === "true" 
            ? hasChanges 
                ? stashBranch.chain(printLn)
                : printLn("Branch has no changes")
            : printLn("Autostash is disabled")
    })
    .supplyChain("currentBranch", getCurrentBranch)
    .effect(({ baseBranch }) => switchBranch(baseBranch))
    .effect(({ pullOptions }) => pullBranch(...(pullOptions === "default" ? [] : ["--rebase"])))
    .effect(({ currentBranch }) => switchBranch(currentBranch))
    .accessChain("baseBranch", rebaseBranch)

export default AutoUpdate
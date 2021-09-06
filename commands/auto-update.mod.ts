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
    .expandDependency("config")
    .supplyChain("hasChanges", hasChanges)
    .effect(({ autoStashEnabled, hasChanges }) => {
        return autoStashEnabled === "true" 
            ? hasChanges 
                ? stashBranch.chain(printLn)
                : printLn("Branch has no changes")
            : printLn("Autostash is disabled")
    })
    .supplyChain("currentBranch", getCurrentBranch)
    .accessEffect("baseBranch", switchBranch)
    .effect(({ pullOptions }) => pullBranch(...(pullOptions === "default" ? [] : ["--rebase"])))
    .accessEffect("currentBranch", switchBranch)
    .accessChain("baseBranch", rebaseBranch)

export default AutoUpdate
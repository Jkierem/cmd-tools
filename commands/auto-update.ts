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
import { openDependency, supplyChain } from '../core/jazzi/ext.ts'

const AutoUpdate: Command<UpdateConfig,string> = Command
    .ask<UpdateConfig>()
    .pipe(openDependency("config"))
    .pipe(supplyChain("hasChanges", hasChanges))
    .tapEffect(({ autoStashEnabled, hasChanges }) => {
        return autoStashEnabled === "true" 
            ? hasChanges 
                ? stashBranch.chain(printLn)
                : printLn("Branch has no changes")
            : printLn("Autostash is disabled")
    })
    .pipe(supplyChain("currentBranch", getCurrentBranch))
    .tapEffect(({ baseBranch }) => switchBranch(baseBranch))
    .tapEffect(({ pullOptions }) => pullBranch(...(pullOptions === "default" ? [] : ["--rebase"])))
    .tapEffect(({ currentBranch }) => switchBranch(currentBranch))
    .access("baseBranch")
    .chain(rebaseBranch)

export default AutoUpdate
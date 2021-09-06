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
    .sequence(hasChanges)
    .chain(shouldStash => shouldStash 
        ? stashBranch.chain(printLn) 
        : printLn("Branch has no changes"))
    .sequence(getCurrentBranch)
    .zipLeft(switchBranch("development"))
    .zipLeft(pullBranch)
    .chain(switchBranch)
    .zipRight(rebaseBranch("development"))

export default AutoUpdate
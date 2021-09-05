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

const AutoUpdate = Command
    .ask()
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
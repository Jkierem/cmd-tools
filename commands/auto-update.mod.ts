import { getCurrentBranch, switchBranch, pullBranch, rebaseBranch } from '../core/git-helpers.mod.ts'
import { Command } from '../core/command.mod.ts'

const AutoUpdate = Command
    .ask()
    .sequence(getCurrentBranch)
    .zipLeft(switchBranch("development"))
    .zipLeft(pullBranch)
    .chain(switchBranch)
    .zipRight(rebaseBranch("development"))

export default AutoUpdate
import { gitCmd } from "../core/git-helpers.mod.ts"
import { Command, IOProcess } from '../core/command.mod.ts'

const allBranchesCmd = gitCmd("branch", "-a")

const SmartMove = Command
    .ask()
    .mapTo(allBranchesCmd)
    .chain(IOProcess.decoded)

export default SmartMove
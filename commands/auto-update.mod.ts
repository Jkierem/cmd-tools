import { getCurrentBranch } from '../core/git-helpers.mod.ts'
import { Command } from '../core/command.mod.ts'

const AutoUpdate = Command.ask().sequence(getCurrentBranch)

export default AutoUpdate
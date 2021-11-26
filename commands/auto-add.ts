import { Command, CommandOf } from "../core/command.ts"
import { gitStatus, gitAddAll } from "../core/git-helpers.ts"

const AutoAdd: CommandOf<string> = Command
    .ask()
    .zipRight(gitAddAll)
    .zipRight(gitStatus)

export default AutoAdd
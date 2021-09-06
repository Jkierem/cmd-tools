import { IOProcess, Command } from '../core/command.mod.ts'
import { doDefaultConfirm, printRunMessage } from '../core/io-helpers.mod.ts'
import { BranchConfig } from "../core/configuration.mod.ts"

const branchCmd = (name: string) => ["git","checkout","-b",name]

const NewBranch: Command<BranchConfig,string> = Command
    .ask<BranchConfig>()
    .map(({ args, config }) => [
        config.branchPrefix,
        args.join(config.joinChar)
    ].join("-"))
    .map(branchCmd)
    .effect(printRunMessage)
    .zipLeft(doDefaultConfirm)
    .chain(IOProcess.of)

export default NewBranch
import { ifDo } from "../core/io-promise.ts"
import IOProcess from "../core/io-process.ts"
import { Command } from '../core/command.ts'
import { doDefaultConfirm, printRunMessage, printLn } from '../core/io-helpers.ts'
import { BranchConfig } from "../core/configuration.ts"

const branchCmd = (name: string) => ["git","checkout","-b",name]

const NewBranch: Command<BranchConfig,string> = Command
    .ask<BranchConfig>()
    .openDependency("config")
    .effect(({ prefix }) => ifDo(
        !prefix,
        printLn("Branch prefixing is disabled. Proceeding without prefix...")
    ))
    .map(({ args, prefix, joinChar, separator }) => [
        prefix,
        args.join(joinChar)
    ].filter(Boolean).join(separator))
    .map(branchCmd)
    .effect(printRunMessage)
    .zipLeft(doDefaultConfirm)
    .chain(IOProcess.of)

export default NewBranch
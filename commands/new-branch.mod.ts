import { IOProcess, Command } from '../core/command.mod.ts'
import { doDefaultConfirm, printRunMessage } from '../core/io-helpers.mod.ts'

const branchCmd = (name: string) => ["git","checkout","-b",name]

const NewBranch: Command<string> = Command
    .ask()
    .map(({ args }) => args.join("-"))
    .map(str => `DITYS-${str}`)
    .map(branchCmd)
    .effect(printRunMessage)
    .zipLeft(doDefaultConfirm)
    .chain(IOProcess.decoded)

export default NewBranch
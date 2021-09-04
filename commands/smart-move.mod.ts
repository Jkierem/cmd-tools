import { Command, IOProcess } from '../core/command.mod.ts'

const allBranches = ["git","branch","-a"]

const SmartMove = Command
    .ask()
    .map(() => allBranches)
    .chain(IOProcess.decoded)

export default SmartMove
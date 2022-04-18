import { Either } from '../core/jazzi/mod.ts'
import { Command, CommandEnv } from '../core/command.ts'
import { getAllBranches, switchBranch } from "../core/git-helpers.ts"

const getHint = ({ args }: CommandEnv) =>  Either.of(args[0]).mapLeft(() => "No branch hint passed").toAsync()

const cleanBranches = ([hint, branches]: readonly [string,string[]]) => 
    [hint, branches.map(b => b.replaceAll("*","").trim())] as const

const filterByHint = ([hint, branches]: readonly [string,string[]]) => {
    return Either
        .fromCondition(strs => Boolean(strs.length), branches.filter(x => x.includes(hint)))
        .mapLeft(() => "No branch matches hint")
        .toAsync()
}

const validateUnique = (branches: string[]) => {
    return Either
        .fromCondition(x => x.length === 1, branches)
        .map(x => x[0])
        .mapLeft(() => `Branch is not unique. Branches that match hint are:\n> ${branches.join("\n> ")}`)
        .toAsync()
}

const SmartMove = Command
    .ask()
    .chain(getHint)
    .zip(getAllBranches)
    .map(cleanBranches)
    .chain(filterByHint)
    .chain(validateUnique)
    .chain(switchBranch)

export default SmartMove
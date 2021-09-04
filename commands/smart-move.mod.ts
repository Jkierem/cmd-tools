import { getAllBranches, switchBranch } from "../core/git-helpers.mod.ts"
import { Command, CommandEnv } from '../core/command.mod.ts'
import Either from '../core/either.mod.ts'

const getHint = ({ args }: CommandEnv) =>  Either.of(args[0]).mapLeftTo("No branch hint passed").toIOPromise()

const cleanBranches = ([hint, branches]: readonly [string,string[]]) => 
    [hint, branches.map(b => b.replaceAll("*","").trim())] as const

const filterByHint = ([hint, branches]: readonly [string,string[]]) => {
    return Either
        .fromPredicate(strs => Boolean(strs.length), branches.filter(x => x.includes(hint)))
        .mapLeftTo("No branch matches hint")
        .toIOPromise()
}

const validateUnique = (branches: string[]) => {
    return Either
        .fromPredicate(x => x.length === 1, branches)
        .map(x => x[0])
        .mapLeft(() => `Branch is not unique. Branches that match hint are:\n> ${branches.join("\n> ")}`)
        .toIOPromise()
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
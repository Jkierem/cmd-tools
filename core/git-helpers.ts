import IOProcess from './io-process.ts'
import { Either, Async } from './jazzi/mod.ts'
import { printRunMessage, printLn } from "./io-helpers.ts"
import type { ConsoleService } from "./services.ts"

export const gitCmd = (...args: string[]) => ["git",...args]

export const gitStatus = IOProcess.of(gitCmd("status"))

export const gitAddAll = IOProcess.of(gitCmd("add","-A"))

const noChangesStr = "nothing to commit, working tree clean"
export const hasChanges = gitStatus.map(statusMsg => !statusMsg.includes(noChangesStr))

export const getCurrentBranch = gitStatus
    .map((str) => str.split(/[\n\r]/))
    .map((str) => str.find(s => s.includes("On branch")))
    .chain((str) => Either.of(str)
        .mapLeft(() => "No branch found")
        .toAsync()
    ).map((str) => str.replace("On branch","").trim())

export const getAllBranches = IOProcess
    .of(gitCmd("branch"))
    .map(str => str.split(/[\n\r]/)
        .map(x => x.trim())
        .filter(Boolean)
    )

export const switchBranch = (branch: string) => {
    return Async
        .require<{ console: ConsoleService }>()
        .mapTo(gitCmd("switch",branch))
        .tapEffect(printRunMessage)
        .chain(IOProcess.of)
}

export const pullBranch = (...pullOpts: string[]) => Async
    .require<{ console: ConsoleService }>()
    .mapTo(gitCmd("pull",...pullOpts))
    .tapEffect(printRunMessage)
    .chain(IOProcess.of)
    .tapEffect(printLn)

export const rebaseBranch = (base: string) => {
    return Async
        .require<{ console: ConsoleService }>()
        .mapTo(gitCmd("rebase",base))
        .tapEffect(printRunMessage)
        .chain(IOProcess.of)
}

export const stashBranch = Async
    .require<{ console: ConsoleService }>()
    .mapTo(gitCmd("stash","push","-m",'"auto-stashing current branch"'))
    .tapEffect(printRunMessage)
    .chain(IOProcess.of)

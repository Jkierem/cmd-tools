import IOProcess from './io-process.ts'
import IOPromise from "./io-promise.ts"
import Either from './either.ts'
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
        .toIOPromise()
    ).map((str) => str.replace("On branch","").trim())

export const getAllBranches = IOProcess
    .of(gitCmd("branch","-a"))
    .map(str => str.split(/[\n\r]/)
        .map(x => x.trim())
        .filter(Boolean)
    )

export const switchBranch = (branch: string) => {
    return IOPromise
        .require<{ console: ConsoleService }>()
        .mapTo(gitCmd("switch",branch))
        .effect(printRunMessage)
        .chain(IOProcess.of)
}

export const pullBranch = (...pullOpts: string[]) => IOPromise
    .require<{ console: ConsoleService }>()
    .mapTo(gitCmd("pull",...pullOpts))
    .effect(printRunMessage)
    .chain(IOProcess.of)
    .effect(printLn)

export const rebaseBranch = (base: string) => {
    return IOPromise
        .require<{ console: ConsoleService }>()
        .mapTo(gitCmd("rebase",base))
        .effect(printRunMessage)
        .chain(IOProcess.of)
}

export const stashBranch = IOPromise
    .require<{ console: ConsoleService }>()
    .mapTo(gitCmd("stash","push","-m",'"auto-stashing current branch"'))
    .effect(printRunMessage)
    .chain(IOProcess.of)

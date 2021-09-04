import { IOProcess } from './command.mod.ts'
import IOPromise from "./io-promise.mod.ts"
import Either from './either.mod.ts'
import { printRunMessage, printLn } from "./io-helpers.mod.ts"

export const gitCmd = (...args: string[]) => ["git",...args]

export const getCurrentBranch = IOProcess
    .of(gitCmd("status"))
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
        .succeed(gitCmd("switch",branch))
        .effect(printRunMessage)
        .chain(IOProcess.of)
}

export const pullBranch = IOPromise
    .succeed(gitCmd("pull"))
    .effect(printRunMessage)
    .chain(IOProcess.of)
    .effect(printLn)

export const rebaseBranch = (base: string) => {
    return IOPromise
        .succeed(gitCmd("rebase",base))
        .effect(printRunMessage)
        .chain(IOProcess.of)
}
import { IOProcess } from './command.mod.ts'
import Either from './either.mod.ts'

export const gitCmd = (...args: string[]) => ["git",...args]

export const getCurrentBranch = IOProcess
    .decoded(gitCmd("status"))
    .map((str) => str.split(/[\n\r]/))
    .map((str) => str.find(s => s.includes("On branch")))
    .chain((str) => Either.of(str)
        .mapLeft(() => "No branch found")
        .toIOPromise()
    ).map((str) => str.replace("On branch","").trim())
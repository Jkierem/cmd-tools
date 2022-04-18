import IOProcess from "../../core/io-process.ts"
import { Async } from "../../core/jazzi/mod.ts"
import { openDependency, supplyChain, accessMap } from "../../core/jazzi/ext.ts"
import { Command } from "../../core/command.ts"
import { resolveFolder } from "../../core/resolve.ts"
import { pullBranch } from "../../core/git-helpers.ts"
import type { OSService } from "../../core/services.ts"

const pwd = IOProcess.of(["pwd"]).map(x => x.trim())
const cd = (to: string) => Async.require<{ os: OSService }>().tapEffect(({ os }) => Async.of(() => os.chDir(to)))

const UpdateSelf = Command
    .ask<{ fileUrl: string }>()
    .pipe(openDependency("config"))
    .pipe(supplyChain("savedPath",pwd))
    .pipe(accessMap("fileUrl", resolveFolder))
    .alias("fileUrl","autoRoot")
    .tapEffect(({ autoRoot }) => cd(autoRoot))
    .zipLeft(pullBranch())
    .tapEffect(({ savedPath }) => cd(savedPath))
    .mapTo("Updated auto cmd tools")

export default UpdateSelf
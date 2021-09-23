import IOProcess from "../../core/io-process.ts"
import IOPromise from "../../core/io-promise.ts"
import { Command } from "../../core/command.ts"
import { resolveFolder } from "../../core/resolve.ts"
import { pullBranch } from "../../core/git-helpers.ts"
import type { OSService } from "../../core/services.ts"

const pwd = IOProcess.of(["pwd"]).map(x => x.trim())
const cd = (to: string) => IOPromise.require<{ os: OSService }>().effect(({ os }) => IOPromise.of(() => os.chDir(to)))

const UpdateSelf = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .supplyChain("savedPath",pwd)
    .accessMap("fileUrl", resolveFolder)
    .alias("fileUrl","autoRoot")
    .accessEffect("autoRoot", cd)
    .zipLeft(pullBranch())
    .accessEffect("savedPath", cd)
    .mapTo("Updated auto cmd tools")

export default UpdateSelf
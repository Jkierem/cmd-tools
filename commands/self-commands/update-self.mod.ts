import IOProcess from "../../core/io-process.mod.ts"
import IOPromise from "../../core/io-promise.mod.ts"
import { Command } from "../../core/command.mod.ts"
import { resolveFolder } from "../../core/resolve.mod.ts"
import { pullBranch } from "../../core/git-helpers.mod.ts"

const pwd = IOProcess.of(["pwd"]).map(x => x.trim())
const cd = (to: string) => IOPromise.from(() => Deno.chdir(to))

const UpdateSelf = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .supplyChain("savedPath",pwd)
    .accessMap("fileUrl",resolveFolder)
    .alias("fileUrl","autoRoot")
    .accessEffect("autoRoot",cd)
    .zipLeft(pullBranch())
    .accessEffect("savedPath",cd)
    .mapTo("Updated auto cmd tools")

export default UpdateSelf
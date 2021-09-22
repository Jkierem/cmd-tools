import IOProcess from "../../core/io-process.ts"
import IOPromise from "../../core/io-promise.ts"
import { Command } from "../../core/command.ts"
import { resolveFolder } from "../../core/resolve.ts"
import { pullBranch } from "../../core/git-helpers.ts"

const pwd = IOProcess.of(["pwd"]).map(x => x.trim())
const cd = (to: string) => IOPromise.from(() => Deno.chdir(to))

const UpdateSelf = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .supplyChain("savedPath",pwd)
    .accessMap("fileUrl",resolveFolder)
    .alias("fileUrl","autoRoot")
    .accessEffect("autoRoot",cd)
    .effect(() => pullBranch())
    .accessEffect("savedPath",cd)
    .mapTo("Updated auto cmd tools")

export default UpdateSelf
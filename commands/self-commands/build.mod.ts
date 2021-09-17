import IOPromise from "../../core/io-promise.mod.ts"
import { Command } from "../../core/command.mod.ts"
import { resolveFolder, relativePathTo } from "../../core/resolve.mod.ts";
import { doDefaultConfirm, printLn, writeFile } from "../../core/io-helpers.mod.ts"

const rmrec = IOPromise.require<{ path: string }>().tap(({ path }) => Deno.remove(path,{ recursive: true }))
const mkDir = IOPromise.require<{ name: string }>().tap(({ name }) => Deno.mkdir(name))
const touch = IOPromise.require<{ file: string }>().tap(({ file }) => Deno.create(file))
const chmod = IOPromise.require<{ file: string }>().tap(({ file }) => Deno.chmod(file,0o754))
const buildContent = `#!/bin/sh\ndeno run --allow-read --allow-write --allow-run $CUSTOM_CMD_TOOLS/runner.ts "$@"`

const Build = Command
    .ask<{ fileUrl: string }>()
    .zipLeft(printLn("You are about to delete the bin folder and create a new build."))
    .zipLeft(doDefaultConfirm)
    .openDependency("config")
    .access("fileUrl")
    .map(resolveFolder)
    .map(relativePathTo("bin"))
    .effect((path) => rmrec
        .supply({ path })
        .mapTo("Deleted bin folder")
        .catchError<string>()
        .map(x => x.trim())
        .chain(printLn)
    )
    .effect((name) => mkDir.supply({ name }).zip(printLn("Created bin folder")))
    .map(relativePathTo("runner"))
    .effect((file) => touch.supply({ file }).zip(printLn("Created runner file")))
    .effect((file) => writeFile(file,buildContent).zip(printLn("Added file content")))
    .chain((file) => chmod.supply({ file }).zip(printLn("Added run permissions")))
    .mapTo("Build finished")

export default Build
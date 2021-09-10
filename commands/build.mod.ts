import { resolveFolder } from "../core/resolve.mod.ts";
import IOPromise from "../core/io-promise.mod.ts"
import IOProcess from "../core/io-process.mod.ts"
import { Command } from "../core/command.mod.ts"
import { doDefaultConfirm, printLn, writeFile } from "../core/io-helpers.mod.ts"

const rmrf = IOPromise.require<{ path: string }>().map(({ path }) => ["rm","-r",path]).chain(IOProcess.of)
const mkDir = IOPromise.require<{ name: string }>().map(({ name }) => ["mkdir",name]).chain(IOProcess.of)
const touch = IOPromise.require<{ file: string }>().map(({ file }) => ["touch",file]).chain(IOProcess.of)
const chmod = IOPromise.require<{ file: string }>().map(({ file }) => ["chmod","754",file]).chain(IOProcess.of)
const buildContent = `#!/bin/sh\ndeno run --allow-read --allow-write --allow-run $CUSTOM_CMD_TOOLS/runner.ts "$@"`

const Build = Command
    .ask<{ fileUrl: string }>()
    .zipLeft(printLn("You are about to delete the bin folder and create a new build."))
    .zipLeft(doDefaultConfirm)
    .openDependency("config")
    .access("fileUrl")
    .map(resolveFolder)
    .map(folder => `${folder}/bin`)
    .effect((path) => rmrf
        .supply({ path })
        .mapTo("Deleted bin folder")
        .catchError()
        .map(x => x.trim())
        .chain(printLn)
    )
    .effect((name) => mkDir.supply({ name }).zip(printLn("Created bin folder")))
    .map(folder => `${folder}/runner`)
    .effect((file) => touch.supply({ file }).zip(printLn("Created runner file")))
    .effect((file) => writeFile(file,buildContent).zip(printLn("Added file contents")))
    .chain((file) => chmod.supply({ file }).zip(printLn("Added run permissions")))
    .mapTo("Build finished")

export default Build
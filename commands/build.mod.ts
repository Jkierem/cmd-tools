import { normalize, dirname, fromFileUrl } from "https://deno.land/std@0.106.0/path/mod.ts";
import IOPromise from "../core/io-promise.mod.ts"
import { IOProcess, Command } from "../core/command.mod.ts"
import { doDefaultConfirm, printLn, writeFile } from "../core/io-helpers.mod.ts"

const resolveFolder = (fileUrl: string) => normalize(dirname(fromFileUrl(fileUrl)));
const rmrf = IOPromise.require<{ path: string }>().map(({ path }) => ["rm","-r",path]).chain(IOProcess.of)
const mkDir = IOPromise.require<{ name: string }>().map(({ name }) => ["mkdir",name]).chain(IOProcess.of)
const touch = IOPromise.require<{ file: string }>().map(({ file }) => ["touch",file]).chain(IOProcess.of)
const chmod = IOPromise.require<{ file: string }>().map(({ file }) => ["chmod","754",file]).chain(IOProcess.of)
const buildContent = `#!/bin/sh\ndeno run --allow-read --allow-write --allow-run $CUSTOM_CMD_TOOLS/runner.ts "$@"`

const Build = Command
    .ask<{ fileUrl: string }>()
    .zipLeft(printLn("You are about to delete the bin folder and create a new build."))
    .zipLeft(doDefaultConfirm)
    .expandDependency("config")
    .access("fileUrl")
    .map(resolveFolder)
    .map(folder => `${folder}/bin`)
    .effect((f) => rmrf
        .supply({ path: f })
        .mapTo("Deleted bin folder")
        .catchError()
        .map(x => x.trim())
        .chain(printLn)
    )
    .effect((name) => mkDir.supply({ name }).sequence(printLn("Created bin folder")))
    .map(folder => `${folder}/runner`)
    .effect((file) => touch.supply({ file }).sequence(printLn("Created runner file")))
    .effect((file) => writeFile(file,buildContent).sequence(printLn("Added file contents")))
    .chain((file) => chmod.supply({ file }).sequence(printLn("Added run permissions")))
    .mapTo("Build finished")

export default Build
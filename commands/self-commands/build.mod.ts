import IOPromise from "../../core/io-promise.mod.ts"
import { Command } from "../../core/command.mod.ts"
import { resolveFolder, relativePathTo } from "../../core/resolve.mod.ts";
import { doDefaultConfirm, printLn, writeFile, exists } from "../../core/io-helpers.mod.ts"
import type { OSService } from "../../core/services.mod.ts"

const reDir = IOPromise.from<{ os: OSService, path: string }, void>(({ os, path }) => os.rmDir(path).finally(() => os.mkDir(path)))
const mkDir = IOPromise.from<{ os: OSService, path: string }, void>(({ os, path }) => os.mkDir(path))
const touch = IOPromise.from<{ os: OSService, path: string }, void>(({ os, path }) => os.create(path))
const chmod = IOPromise.from<{ os: OSService, path: string }, void>(({ os, path }) => os.chmod(path, 0o754))
const buildContent = `#!/bin/sh\ndeno run --allow-read --allow-write --allow-run $CUSTOM_CMD_TOOLS/runner.ts "$@"`

const Build = Command
    .ask<{ fileUrl: string }>()
    .zipLeft(printLn("You are about to delete the bin folder and create a new build."))
    .zipLeft(doDefaultConfirm)
    .openDependency("config")
    .alias("fileUrl","path")
    .accessMap("path", resolveFolder)
    .accessMap("path", relativePathTo("bin"))
    .effect(({ path }) => 
        exists(path)
        .chain((isFolderPresent) => 
            isFolderPresent 
                ? reDir.supply({ path }).mapTo("Deleted and created bin folder")
                : mkDir.supply({ path }).mapTo("Created bin folder")
        )
        .chain(printLn)
    )
    .access("path")
    .map(relativePathTo("runner"))
    .effect((path) => touch.supply({ path }).zipLeft(printLn("Created runner file")))
    .effect((path) => writeFile(path,buildContent).zipLeft(printLn("Added file content")))
    .chain((path) => chmod.supply({ path }).zipLeft(printLn("Added run permissions")))
    .mapTo("Build finished")

export default Build
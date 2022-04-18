import { Async } from '../../core/jazzi/mod.ts'
import { openDependency, accessMap } from '../../core/jazzi/ext.ts'
import { Command } from "../../core/command.ts"
import { resolveFolder, relativePathTo } from "../../core/resolve.ts";
import { doDefaultConfirm, printLn, writeFile, exists } from "../../core/io-helpers.ts"
import type { OSService } from "../../core/services.ts"

type OSEnv = { os: OSService, path: string }

const reDir = Async.from<OSEnv, unknown, void>(({ os, path }) => os.rmDir(path).finally(() => os.mkDir(path)))
const mkDir = Async.from<OSEnv, unknown, void>(({ os, path }) => os.mkDir(path))
const touch = Async.from<OSEnv, unknown, void>(({ os, path }) => os.create(path))
const chmod = Async.from<OSEnv, unknown, void>(({ os, path }) => os.chmod(path, 0o754))
const buildContent = `#!/bin/sh\ndeno run --allow-read --allow-write --allow-run $CUSTOM_CMD_TOOLS/runner.ts "$@"`

const Build = Command
    .ask<{ fileUrl: string }>()
    .zipLeft(printLn("You are about to delete the bin folder and create a new build."))
    .zipLeft(doDefaultConfirm)
    .pipe(openDependency("config"))
    .alias("fileUrl","path")
    .pipe(accessMap("path", resolveFolder))
    .pipe(accessMap("path", relativePathTo("bin")))
    .tapEffect(({ path, os }) => 
        exists(path)
        .chain((isFolderPresent) => 
            isFolderPresent 
                ? reDir.provide({ os, path }).mapTo("Deleted and created bin folder")
                : mkDir.provide({ os, path }).mapTo("Created bin folder")
        )
        .chain(printLn)
    )
    .pipe(accessMap("path", relativePathTo("runner")))
    .tapEffect(({ os, path }) => touch.provide({ os, path }).zipLeft(printLn("Created runner file")))
    .tapEffect(({ path }) => writeFile(path,buildContent).zipLeft(printLn("Added file content")))
    .chain(({ os, path }) => chmod.provide({ os, path }).zipLeft(printLn("Added run permissions")))
    .mapTo("Build finished")

export default Build
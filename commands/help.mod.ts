import { Command } from "../core/command.mod.ts"
import { readFile } from "../core/io-helpers.mod.ts"
import { resolveFolder } from "../core/resolve.mod.ts"
import { decode } from "../core/codec.mod.ts"

const HelpCommand = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .access("fileUrl")
    .map(resolveFolder)
    .map(root => `${root}/resources/help.txt`)
    .chain(readFile)
    .map(decode)

export default HelpCommand
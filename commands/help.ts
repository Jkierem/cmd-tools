import { Command } from "../core/command.ts"
import { readFile } from "../core/io-helpers.ts"
import { resolveFolder, relativePathTo } from "../core/resolve.ts"
import { decode } from "../core/codec.ts"
import { openDependency } from '../core/jazzi/ext.ts'

const HelpCommand = Command
    .ask<{ fileUrl: string }>()
    .pipe(openDependency("config"))
    .access("fileUrl")
    .map(resolveFolder)
    .map(relativePathTo(`resources/help.txt`))
    .chain(readFile)
    .map(decode)

export default HelpCommand

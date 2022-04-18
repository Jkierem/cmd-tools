import { Either, Async } from './jazzi/mod.ts'
import type { ConsoleService, FileIO, OSService } from "./services.ts"

export const doPrompt = (message: string) => Async
    .require<{ console: ConsoleService }>()
    .access("console")
    .chain((c) => Async.of(() => c.prompt(message)))

export const doPromptOr = (msg: string, def: string) => 
    doPrompt(`${msg} (${def})`)
    .map(x => x?.trim())
    .map(x => x ? x : def)

export type Bias = { 
    answers: readonly [string, string], 
    suffix: string, 
    default: "yes" | "no",
    normalize: "yes" | "no"
}

export const Bias: Record<"Yes"|"No",Bias> = {
    No: { answers: ["y", "yes"] as const, suffix: "[y|N]", default: "no", normalize: "yes" },
    Yes: { answers: ["n", "no"] as const, suffix: "[Y|n]", default: "yes", normalize: "no" }
}

const toLowerCase = <T extends string>(str: T): Lowercase<T> => str.toLowerCase() as Lowercase<T>

export const doBiasConfirm = (msg: string, bias=Bias.Yes) =>
    doPrompt(`${msg} ${bias.suffix}`)
        .map(str => str?.trim() ?? "")
        .map(toLowerCase)
        .map(str => str || bias.default)
        .map(str => bias.answers.includes(str) ? bias.normalize : bias.default)

export const doBooleanConfirm = (msg: string, bias=Bias.Yes) => doBiasConfirm(msg, bias).map(x => x === "yes")

export const doConfirm = (msg: string) => 
    doBiasConfirm(msg, Bias.No).chain((str) => {
        return Either.fromPredicate((x): x is "yes" => x === "yes", str)
            .mapLeft(() => "Responded negative to confirmation")
            .toAsync()
    })

export const doDefaultConfirm = doConfirm("Are you sure?")

export const printLn = <T>(...args: T[]) => Async
    .require<{ console: ConsoleService }>()
    .access("console")
    .access("log")
    .chain((log) => Async.through(log)(...args))

export const printRunMessage = (cmd: string[]) => printLn(`About to run "${cmd.join(" ")}"`)

export const readFile = (path: string) => Async
    .require<{ fileIO: FileIO }>()
    .access("fileIO")
    .access("read")
    .chain((read) => Async.from(() => read(path)))

export const writeFile = (path: string, data: string) => Async
    .require<{ fileIO: FileIO }>()
    .access("fileIO")
    .access("write")
    .chain((write) => Async.from(() => write(path,data)))

export const exists = (path: string) => Async
    .require<{ os: OSService }>()
    .access("os")
    .access("exists")
    .chain((exists) => Async.from(() => exists(path)))
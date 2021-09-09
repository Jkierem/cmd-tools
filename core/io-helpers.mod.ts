import IOPromise from './io-promise.mod.ts'
import Either from './either.mod.ts'

export const doPrompt = IOPromise.unary(prompt)

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

export const doBiasConfirm = (msg: string, bias=Bias.Yes) =>
    doPrompt(`${msg} ${bias.suffix}`)
        .map(str => str?.trim() ?? "")
        .map(toLowerCase)
        .map(str => str || bias.default)
        .map(str => bias.answers.includes(str) ? bias.normalize : bias.default)

export const doBooleanConfirm = (msg: string, bias=Bias.Yes) => doBiasConfirm(msg, bias).map(x => x === "yes")

const toLowerCase = <T extends string>(str: T): Lowercase<T> => str.toLowerCase() as Lowercase<T>
export const doConfirm = (msg: string) => 
    doBiasConfirm(msg, Bias.No).chain((str) => {
        return Either.of(str)
            .chain(Either.ofPredicate<"no","yes">((s: "yes" | "no"): s is "yes" => s === "yes"))
            .mapLeft(() => "Responded negative to confirmation")
            .toIOPromise()
    })

export const doDefaultConfirm = doConfirm("Are you sure?")

export const printLn = IOPromise.through(console.log);

export const printRunMessage = (cmd: string[]) => printLn(`About to run "${cmd.join(" ")}"`)

export const readFile = (path: string) => IOPromise.of(() => Deno.readFile(path))

export const writeFile = (path: string, data: string) => IOPromise.of(() => Deno.writeTextFile(path, data))
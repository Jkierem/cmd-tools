import IOPromise from './io-promise.mod.ts'
import Either from './either.mod.ts'

export const doPrompt = IOPromise.unary(prompt)

export const doConfirm = (msg: string) => 
    doPrompt(`${msg} [y|N]`).chain((str) => {
        return Either.of(str)
            .map(str => str.toLowerCase())
            .chain(Either.ofPredicate(s => s === "y" || s === "yes"))
            .mapLeft(() => "Responded negative to confirmation")
            .toIOPromise()
    })

export const doDefaultConfirm = doConfirm("Are you sure?")

export const printLn = IOPromise.through(console.log);

export const printRunMessage = (cmd: string[]) => printLn(`About to run "${cmd.join(" ")}"`)

export const readFile = (path: string) => IOPromise.of(() => Deno.readFile(path))

export const writeFile = (path: string, data: string) => IOPromise.of(() => Deno.writeTextFile(path, data))
import IOPromise from './io-promise.mod.ts'
import Either from './either.mod.ts'

export const doPrompt = IOPromise.unary(prompt)

export const doConfirm = (msg: string) => 
    doPrompt(`${msg} [y|N]`).chain((str) => {
        return Either.of(str === "y")
            .map(() => str)
            .mapLeft(() => "Responded negative to confirmation")
            .toIOPromise()
    })

export const printLn = IOPromise.unary(console.log);
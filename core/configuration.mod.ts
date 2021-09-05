import IOPromise from "./io-promise.mod.ts"
import { decode } from "./decode.mod.ts"

export const getAllConfig = IOPromise
    .of(() => Deno.readFile("./config.json"))
    .map(decode)
    .map(JSON.parse)

export const getConfig = IOPromise
    .from((cmdName: string) => cmdName)
    .zip(getAllConfig)
    .map(([name, config]) => config[name] ?? {})

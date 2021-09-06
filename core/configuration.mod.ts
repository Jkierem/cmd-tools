import * as path from "https://deno.land/std@0.106.0/path/mod.ts";
import IOPromise from "./io-promise.mod.ts"
import { decode } from "./decode.mod.ts"

export type UpdateConfig = {
    base: string,
    pullStrategy: "default" | "rebase",
    autoStashEnabled: boolean
}

export type CommitConfig = {
    ticketToken: string
}

export type BranchConfig = {
    branchPrefix: string,
    joinChar: string
}

export type Commands = ""

export type Config = {
    update: UpdateConfig,
    commit: CommitConfig,
    branch: BranchConfig,
}

export type EmptyConfig = Record<string,never>

const readFile = (path: string) => IOPromise.of(() => Deno.readFile(path))

export const getAllConfig = IOPromise
    .require<{ base: string }>()
    .access("base")
    .map(path.dirname)
    .map(baseFolder => `${baseFolder}/config.json`)
    .map(path.normalize)
    .map(path.fromFileUrl)
    .chain(readFile)
    .map(decode)
    .map(raw => JSON.parse(raw) as Config)

const getOr = <T,F>(key: string, fallback: F, obj: T) => obj?.[key as keyof T] ?? fallback

export const getConfig = IOPromise
    .require<{ command: string, base: string }>()
    .supplyChain("config", getAllConfig)
    .map(({ command, config }) => ({ config: getOr(command, {}, config) }))

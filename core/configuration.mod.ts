import { normalize, dirname, fromFileUrl } from "https://deno.land/std@0.106.0/path/mod.ts";
import IOPromise from "./io-promise.mod.ts"
import Either from "./either.mod.ts"
import { decode } from "./decode.mod.ts"
import { readFile, writeFile } from "./io-helpers.mod.ts"

export type UpdateConfig = {
    baseBranch: string,
    pullOptions: "default" | "rebase",
    autoStashEnabled: "true" | "false"
}

export type CommitConfig = {
    ticketToken: string
}

export type BranchConfig = {
    branchPrefix: string,
    joinChar: string
}

export type ConfigFile = {
    update: UpdateConfig,
    commit: CommitConfig,
    branch: BranchConfig,
}

type ValueOf<T> = T extends Record<infer _, infer Value> ? Value : never
export type Config = ValueOf<ConfigFile>

export type EmptyConfig = Record<string,never>

const parseConfig = (str: string) => Either
    .attempt(() => JSON.parse(str) as ConfigFile)
    .mapLeftTo("Error parsing config")
    .toIOPromise()

const relativeConfig = (x: string) => `${x}/config.json`
const getConfigPath = (fileUrl: string) => fromFileUrl(normalize(relativeConfig(dirname(fileUrl))))

export const getAllConfig = IOPromise
    .require<{ fileUrl: string }>()
    .access("fileUrl")
    .map(getConfigPath)
    .chain(readFile)
    .map(decode)
    .chain(parseConfig)

const getOr = <T,F>(key: string, fallback: F, obj: T) => obj?.[key as keyof T] ?? fallback

export const getConfig = IOPromise
    .require<{ command: string, fileUrl: string }>()
    .supplyChain("config", getAllConfig)
    .map(({ command, config }) => ({ config: getOr(command, {}, config) }))

export const setConfig = IOPromise
    .require<{ fileUrl: string, data: ConfigFile }>()
    .map(({ fileUrl, data }) => ({ 
        path: getConfigPath(fileUrl),
        data: JSON.stringify(data)
    }))
    .chain(({ path, data }) => writeFile(path, data))
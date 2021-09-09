import { normalize, dirname, fromFileUrl } from "https://deno.land/std@0.106.0/path/mod.ts";
import IOPromise from "./io-promise.mod.ts"
import Either from "./either.mod.ts"
import { decode, encode } from "./codec.mod.ts"
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
const exists = (path: string) => IOPromise.of(() => Deno.lstat(path)).mapTo(true).mapErrorTo(false)

export const getAllConfig = IOPromise
    .require<{ fileUrl: string }>()
    .access("fileUrl")
    .map(getConfigPath)
    .chain(path => readFile(path).mapErrorTo(encode("{}")))
    .map(decode)
    .chain(parseConfig)

const getOr = <T,F>(key: string, fallback: F, obj: T) => obj?.[key as keyof T] ?? fallback

export const getConfig = IOPromise
    .require<{ command: string, fileUrl: string }>()
    .effect(({ fileUrl, command }) => {
        return Either
        .of(command === "init")
        .fold(
            () => exists(getConfigPath(fileUrl)).chain(
                available => available 
                    ? IOPromise.unit
                    : IOPromise.fail("Config file is not available. Try running 'auto init'")
            ),
            () => IOPromise.unit
        )
    })
    .supplyChain("config", getAllConfig)
    .map(({ command, config }) => ({ config: getOr(command, {}, config) }))

export const setConfig = IOPromise
    .require<{ fileUrl: string, data: ConfigFile }>()
    .map(({ fileUrl, data }) => ({ 
        path: getConfigPath(fileUrl),
        data: JSON.stringify(data)
    }))
    .chain(({ path, data }) => writeFile(path, data))
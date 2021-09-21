import { resolveFolder } from "./resolve.ts"
import IOPromise from "./io-promise.ts"
import Either from "./either.ts"
import { decode, encode } from "./codec.ts"
import { readFile, writeFile, exists } from "./io-helpers.ts"
import type { FileIO, OSService } from "./services.ts"

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
    .mapLeftTo("Error parsing config. Try running 'auto self init' to create a new config file")
    .toIOPromise()

const relativeConfig = (x: string) => `${x}/config.json`
const getConfigPath = (fileUrl: string) => relativeConfig(resolveFolder(fileUrl))
const shouldSkipConfig = (str: string) => str === "self" || str === "help"

export const getAllConfig = IOPromise
    .require<{ fileUrl: string, skip?: boolean }>()
    .accessMap("fileUrl", getConfigPath)
    .alias("fileUrl","path")
    .chain(({ path, skip }) => skip ? IOPromise.succeed(encode("{}")) : readFile(path))
    .map(decode)
    .chain(parseConfig)

const getOr = <T,F>(key: string, fallback: F, obj: T) => obj?.[key as keyof T] ?? fallback

export const getConfig = IOPromise
    .require<{ command: string, fileUrl: string, fileIO: FileIO, os: OSService }>()
    .map((data) => ({ ...data, skip: shouldSkipConfig(data.command)}))
    .effect(({ fileUrl, skip }) => {
        return Either
        .of(skip)
        .fold(
            () => exists(getConfigPath(fileUrl)).chain(
                available => available 
                    ? IOPromise.unit
                    : IOPromise.fail("Config file is not available. Try running 'auto self init'")
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
        data: JSON.stringify(data, null, "\t")
    }))
    .chain(({ path, data }) => writeFile(path, data))
import { resolveFolder } from "./resolve.ts"
import { Either, Async } from "./jazzi/mod.ts"
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
    prefix: string,
    joinChar: string,
    separator: string,
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
    .mapLeft(() => "Error parsing config. Try running 'auto self init' to create a new config file")
    .toAsync()

const relativeConfig = (x: string) => `${x}/config.json`
const getConfigPath = (fileUrl: string) => relativeConfig(resolveFolder(fileUrl))
const shouldSkipConfig = (str: string) => str === "self" || str === "help"

export const getAllConfig = Async
    .require<{ fileUrl: string, skip?: boolean }>()
    .map(x => {
        return {
            ...x,
            fileUrl: getConfigPath(x.fileUrl)
        }
    })
    .alias("fileUrl","path")
    .chain(({ path, skip }) => skip 
        ? Async.require<{ fileIO: FileIO }>().mapTo(encode("{}")) 
        : readFile(path)
    )
    .map(decode)
    .chain(parseConfig)

const getOr = <T,F>(key: string, fallback: F, obj: T) => obj?.[key as keyof T] ?? fallback

export const getConfig = Async
    .require<{ command: string, fileUrl: string, fileIO: FileIO, os: OSService }>()
    .map((data) => ({ ...data, skip: shouldSkipConfig(data.command)}))
    .tapEffect(({ fileUrl, skip }) => {
        return Either
        .of(skip)
        .fold(
            () => exists(getConfigPath(fileUrl)).chain(
                available => available 
                    ? Async.unit()
                    : Async.Fail("Config file is not available. Try running 'auto self init'")
            ),
            () => Async.require<{ os: OSService }>().mapTo(undefined)
        )
    })
    .chain(x => getAllConfig.provide(x).map((config) => ({ ...x, config })))
    .map(({ command, config }) => ({ config: getOr(command, {}, config) }))

export const setConfig = Async
    .require<{ fileUrl: string, data: ConfigFile }>()
    .map(({ fileUrl, data }) => ({ 
        path: getConfigPath(fileUrl),
        data: JSON.stringify(data, null, "\t")
    }))
    .chain(({ path, data }) => writeFile(path, data))
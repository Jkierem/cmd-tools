import IOPromise, { ifDo } from "../core/io-promise.mod.ts"
import Either from "../core/either.mod.ts"
import { Command } from "../core/command.mod.ts"
import { getAllConfig, ConfigFile, setConfig } from "../core/configuration.mod.ts"
import { printLn } from "../core/io-helpers.mod.ts"
import type { FileIO, ConsoleService } from "../core/services.mod.ts"

const actions = ["get", "set"]
const validateAction = (action: string) => {
    return Either
        .fromPredicate((a: string) => actions.includes(a), action)
        .mapLeftTo("Unknown action passed to config command")
        .toIOPromise()
}

const specialStringify = <T>(data: T) => JSON.stringify(data, null, 3)

const validateDefined = <T>(x: T) => Either.of(x)
    .map(specialStringify)
    .mapLeftTo(`Key does not exist in config`)
    .toIOPromise()

type PathType<Obj, Path> = Path extends `${infer Left}.${infer Right}` 
    ? Left extends keyof Obj 
        ? PathType<Obj[Left], Right> 
        : undefined
    : Path extends keyof Obj 
        ? Obj[Path] 
        : undefined

const getPath = <T,K extends string>(path: K, obj: T): PathType<T,K> => {
    return path.split(".").reduce(
        // deno-lint-ignore no-explicit-any
        (value: any, key: string) => value?.[key], obj
    )
}

const GetAction = IOPromise
    .require<{ key: string, configData: ConfigFile }>()
    .map(({ key, configData }) => {
        return Either.fromPredicate(() => key === ".", key)
            .fold(
                () => getPath(key, configData),
                () => configData
            )
    })
    .chain(validateDefined)

const setPath = <T,K extends string>(path: K, value: PathType<T,K>, obj: T): void => {
    const [head, ...tail] = path.split(".").map(x => x.trim()).filter(x => x.length)
    if( head && tail.length === 0 ){
        // deno-lint-ignore no-explicit-any
        if( (obj as any)?.[head] !== undefined ){
            // deno-lint-ignore no-explicit-any
            (obj as any)[head] = value
        }
    } else if( tail.length > 0 ){
        // deno-lint-ignore no-explicit-any
        setPath(tail.join("."), value, (obj as any)?.[head])
    }
}

type LeafValue = string | null
type SetEnv = { key: string, value: string, configData: ConfigFile, fileUrl: string, fileIO: FileIO, console: ConsoleService }
const validateSet = ({ key, value, configData }: SetEnv) => {
    const fromUndefined = Either.ofPredicate(<T>(x: T): x is T  => x !== undefined)
    const fromNullish = Either.ofPredicate(<T>(x: T): x is T  => x !== null && x !== undefined)
    const fromEmpty = Either.ofPredicate((x: string): x is string => x.length !== 0)
    const fromLeafValue = Either.ofPredicate((x: string | null | undefined): x is LeafValue => x === null || typeof x === "string" )
    return fromUndefined(getPath(key,configData))
        .mapLeftTo(`"${key}" is not a config option`)
        .chain((p) => fromLeafValue(p).mapLeftTo("Value being set must be a leaf value"))
        .chain(() => fromNullish(value).mapLeftTo("Value being set cannot be empty"))
        .chain(() => fromEmpty(value.trim()).mapLeftTo("Value being set cannot be empty"))
        .toIOPromise()
}

const nullify = (val: string): string | null => val === "null" ? null : val 

const SetAction = IOPromise
    .require<SetEnv>()
    .effect(validateSet)
    .effect(({ key, value }) => ifDo(
        value === "null",
        printLn(`Turning "${key}" config off. Some commands may fail.`) 
    ))
    .map(({ key, value, configData, fileUrl, fileIO }) => {
        setPath(key, (nullify(value) as unknown) as undefined, configData)
        return {
            fileUrl,
            data: configData,
            fileIO
        }
    })
    .provideTo(setConfig)
    .mapTo("Updated Configuration")

const pickAction = (action: string) => action === "get" ? GetAction : SetAction

const ConfigCommand = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .map(({ args, fileUrl, runner, fileIO, console }) => ({ 
        action: args[0], 
        key:    args[1], 
        value:  args[2],
        fileUrl,
        runner,
        fileIO,
        console,
    }))
    .accessEffect("action", validateAction)
    .supplyChain("configData", getAllConfig)
    .chain(({ action, ...rest }) => pickAction(action).supply(rest))

export default ConfigCommand
    
    
import IOPromise from "../core/io-promise.mod.ts"
import Either from "../core/either.mod.ts"
import { Command } from "../core/command.mod.ts"
import { getAllConfig, ConfigFile, setConfig } from "../core/configuration.mod.ts"

const actions = ["get", "set"]
const validateAction = (action: string) => {
    return Either
        .fromPredicate((a: string) => actions.includes(a), action)
        .mapLeftTo("Unknown action passed to config command")
        .toIOPromise()
}

const validateDefined = <T>(x: T) => Either.of(x)
    .map(JSON.stringify)
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
    .map(({ key, configData }) => getPath(key, configData))
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

type SetEnv = { key: string, value: string, configData: ConfigFile, fileUrl: string }
const validateSet = ({ key, value, configData }: SetEnv) => {
    const fromNullish = Either.ofPredicate(<T>(x: T): x is T  => x !== null && x !== undefined)
    const fromEmpty = Either.ofPredicate((x: string): x is string => x.length !== 0)
    const fromString = Either.ofPredicate((x: string | undefined): x is string => typeof x === "string")
    return fromNullish(getPath(key,configData))
        .mapLeftTo(`"${key}" is not a config option`)
        .chain((p) => fromString(p).mapLeftTo("Value being set must be a leaf value"))
        .chain(() => fromNullish(value).mapLeftTo("Value being set cannot be empty"))
        .chain(() => fromEmpty(value.trim()).mapLeftTo("Value being set cannot be empty"))
        .toIOPromise()
}

const SetAction = IOPromise
    .require<SetEnv>()
    .effect(validateSet)
    .map(({ key, value, configData, fileUrl }) => {
        setPath(key, (value as unknown) as undefined, configData)
        return {
            fileUrl,
            data: configData
        }
    })
    .provideTo(setConfig)
    .mapTo("Updated Configuration")

const pickAction = (action: string) => action === "get" ? GetAction : SetAction

const ConfigCommand = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .map(({ args, fileUrl, runner }) => ({ 
        action: args[0], 
        key:    args[1], 
        value:  args[2],
        fileUrl,
        runner
    }))
    .accessEffect("action", validateAction)
    .supplyChain("configData", getAllConfig)
    .chain(({ action, key, value, configData, fileUrl }) => pickAction(action).supply({ key, value, configData, fileUrl }))

export default ConfigCommand
    
    
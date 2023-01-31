import { Either, Async } from '../core/jazzi/mod.ts'
import { Command } from "../core/command.ts"
import { getAllConfig, ConfigFile, setConfig } from "../core/configuration.ts"
import { printLn } from "../core/io-helpers.ts"
import { ifDo, openDependency, validateAttr } from '../core/jazzi/ext.ts'
import type { FileIO, ConsoleService } from "../core/services.ts"

const actions = ["get", "set"]
const validateAction = (action: string) => {
    return Either
        .fromCondition((a: string) => actions.includes(a), action)
        .mapLeft(() => "Unknown action passed to config command")
        .toAsync()
}

const specialStringify = <T>(data: T) => JSON.stringify(data, null, 3)

const validateDefined = <T>(x: T) => Either.of(x)
    .map(specialStringify)
    .mapLeft(() => `Key does not exist in config`)
    .toAsync()

const validateKey = (key: string) => Either.of(key)
    .mapLeft(() => "Key cannot be empty")
    .toAsync()
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

const GetAction = Async
    .require<{ key: string, configData: ConfigFile }>()
    .map(({ key, configData }) => {
        return Either.fromCondition(() => key === ".", key)
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
type Nullable<T> = T | null | undefined
const validateSet = ({ key, value, configData }: SetEnv) => {
    const fromUndefined = <T>(a: T | undefined) => Either.fromPredicate((x: T | undefined): x is T => x !== undefined, a)
    const fromNullish = (a?: string) => Either.fromPredicate(<T>(x: T): x is T  => x !== null && x !== undefined, a)
    const fromEmpty = (a: string) => Either.fromPredicate((x: string): x is string => x.length !== 0, a)
    const fromLeafValue = (a: Nullable<string>) => 
        Either.fromPredicate((x: Nullable<string>): x is LeafValue => x === null || typeof x === "string" , a)
    return fromUndefined(getPath(key,configData))
        .mapLeft(() => `"${key}" is not a config option`)
        .chain((p) => fromLeafValue(p).mapLeft(() => "Value being set must be a leaf value"))
        .chain(() => fromNullish(value).mapLeft(() => "Value being set cannot be empty"))
        .chain(() => fromEmpty(value.trim()).mapLeft(() => "Value being set cannot be empty"))
        .toAsync()
}

const nullify = (val: string): string | null => val === "null" ? null : val 

const SetAction = Async
    .require<SetEnv>()
    .tapEffect(validateSet)
    .tapEffect(({ key, value }) => ifDo(
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
    .pipe(openDependency("config"))
    .map(({ args, fileUrl, runner, fileIO, console }) => ({ 
        action: args[0], 
        key:    args[1], 
        value:  args[2],
        fileUrl,
        runner,
        fileIO,
        console,
    }))
    .pipe(validateAttr("action", validateAction))
    .pipe(validateAttr("key", validateKey))
    .chain(data => {
        return getAllConfig
            .provide(data)
            .map((configData) => ({ ...data, configData }))
    })
    .chain(({ action, ...rest }) => pickAction(action).provide(rest))

export default ConfigCommand
    
    
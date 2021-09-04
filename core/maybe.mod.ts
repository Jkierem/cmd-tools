import IOPromise from './io-promise.mod.ts'

type Extractable<T> = T | (() => T)
const extract = <T>(t: Extractable<T>): T => t instanceof Function ? t() : t

type Maybe<A> = {
    tag: "Just" | "None",
    map: <B>(fn: (a: A) => B) => Maybe<B>,
    chain: <B>(fn: (a: A) => Maybe<B>) => Maybe<B>,
    onNone: <T>(t: Extractable<T>) => A | T,
    toIOPromise: () => IOPromise<unknown,A | never>
}

const Just = <A>(x: A): Maybe<A> => {
    return {
        tag: "Just",
        map: (fn) => Just(fn(x)),
        chain: (fn) => fn(x),
        onNone: (_t) => x,
        toIOPromise: () => IOPromise.succeed(x) as IOPromise<unknown,A>
    }
}

const None: Maybe<unknown> = {
    tag: "None",
    map: <B>(_fn: (a: unknown) => B) => None as Maybe<B>,
    chain: <B>(_fn: (a: unknown) => Maybe<B>) => None as Maybe<B>,
    onNone: <T>(t: Extractable<T>) => extract(t),
    toIOPromise: () => IOPromise.fail(undefined)
}

type Nil = undefined | null;
const isNil = <T>(x: T | Nil): x is Nil => x === null || x === undefined 

const Maybe = {
    of: <T>(x: T) => Maybe.fromNullish(x),
    fromNullish: <T>(x: T): Maybe<T> => (isNil(x) ? None : Just(x)) as Maybe<T>,
    fromFalsy: <T>(x: T): Maybe<T> => (x ? None : Just(x)) as Maybe<T>,
    fromEmpty: <U,T extends ArrayLike<U>>(x: T) => (x.length ? Just(x) : None) as Maybe<T>,
    None: () => None,
    Just,
}

export default Maybe
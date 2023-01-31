import A from './async/mod.ts'
import { Async } from './async/types.ts'

type Fn<A,B> = (a: A) => B
// deno-lint-ignore no-explicit-any
type AnyAsync = Async<any,any,any>

export const expandDependency = <R,E,A, K extends keyof A>(key: K) => (ma: Async<R,E,A>): Async<R,E, A & A[K]> => ma.map(a => ({ ...a, ...a[key] }))
export const dropDependency = <R,E,A, K extends keyof A>(key: K) => (ma: Async<R,E,A>): Async<R,E, Omit<A,K>> => ma.map(a => {
    delete a[key]
    return a
})

export const openDependency = <R,E,A, K extends keyof A>(key: K) => (ma: Async<R,E,A>): Async<R,E,Omit<A & A[K],K>> => ma
    ['|>'](expandDependency(key))
    ['|>'](dropDependency(key))

export const ifDo = <Env, A>(condition: boolean, task: Async<Env,unknown,A>) => condition ? task : A.unit() as unknown as Async<Env,unknown,A>

export const accessMap = <R,E,A,K extends keyof A,B>(key: K, fn: Fn<A[K],B>) => (self: Async<R,E,A>): Async<R,E,Omit<A,K> & { [P in K]: B }> => {
    return self.map(data => ({ ...data, [key]: fn(data[key]) }))
}

export const supplyChain = <K extends string,A extends R1,R1,E1,B>(key: K, io: Async<R1,E1,B>) => <R,E>(self: Async<R,E,A>) => {
    return self.chain(data => io.provide(data).map(a => ({ ...data, [key]: a }))) as Async<R, E | E1, A & { [P in K]: B }>
}

export const bind = <K extends string,A,R0,E0,A0>(key: K, fnIO: (a: A) => Async<R0,E0,A0>) => <R,E>(self: Async<R,E,A>) => {
    return self.chain(data => fnIO(data).map(all => ({ ...data, [key]: all }))) as Async<R & R0, E0 | E, A & {
        [P in K]: A0;
    }>
}

export const toAsync = <A>(a: A) => A.unit().mapTo(a)

export const validateAttr = <R,E,A, K extends keyof A>(key: K, fn: (val: A[K]) => AnyAsync) => (self: Async<R,E,A>) => {
    return self.tapEffect(({ [key]: data }) => fn(data))
}
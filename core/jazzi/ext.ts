import A from './async/mod.ts'
import { Async } from './async/types.ts'

type Fn<A,B> = (a: A) => B

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
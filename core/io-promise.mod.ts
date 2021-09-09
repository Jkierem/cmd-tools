type UnwrapPromise<A> = A extends Promise<infer B> ? B : A
type InferUndefined<T> = T extends Record<string,never> ? undefined : T 
type Remove<Key extends string | number | symbol, T> = InferUndefined<Omit<T,Key>>
type Key = string | number | symbol
const prop = <T,K extends keyof T>(key: K) => (obj: T): T[K] => obj[key]

type Reason<T> = { reason: T, error: true }

type IOPromise<Env,A> = {
    map: <B>(fn: (a: A) => B) => IOPromise<Env,B>,
    mapTo: <B>(b: B) => IOPromise<Env,B>,
    effect: <B>(fn: (a: A) => IOPromise<Env,B>) => IOPromise<Env,A>,
    tap: (fn: (a: A) => void) => IOPromise<Env,A>,
    chain: <Env0,B>(fn: (a: A) => IOPromise<Env0,B>) => IOPromise<Env & Env0,B>,
    sequence: <B>(io: IOPromise<Env,B>) => IOPromise<Env,B>,
    zipWith: <Env0,B,C>(io: IOPromise<Env0,B>, fn: (a: A, b: B) => C) => IOPromise<Env & Env0, C>,
    zip: <Env0,B>(io: IOPromise<Env0,B>) => IOPromise<Env & Env0, readonly [A,B]>,
    zipLeft: <Env0,B>(io: IOPromise<Env0,B>) => IOPromise<Env & Env0,A>,
    zipRight: <Env0,B>(io: IOPromise<Env0,B>) => IOPromise<Env & Env0,B>,
    access: <K extends keyof A>(key: K) => IOPromise<Env,A[K]>,
    supplyOne: <K extends keyof Env>(key: K, value: Env[K]) => IOPromise<Omit<Env,K>, A>,
    supply: <T>(reqs: T) => IOPromise<Omit<Env,keyof T>,A>,
    supplyChain: <B, K extends Key>(key: K, io: IOPromise<A,B>) => IOPromise<Env, A & { [P in typeof key]: B }>,
    expandDependency: <K extends keyof A>(key: K) => IOPromise<Env, A & A[K]>,
    accessEffect: <K extends keyof A,B>(key: K, io: (a: A[K]) => IOPromise<unknown,B>) => IOPromise<Env,A>,
    accessChain: <K extends keyof A,Env0,B>(key: K, io: (a: A[K]) => IOPromise<Env0,B>) => IOPromise<Env & Env0,B>,
    provideTo: <B>(io: IOPromise<A,B>) => IOPromise<Env,B>,
    // deno-lint-ignore no-explicit-any
    catchError: () => IOPromise<Env, any>,
    onError: <B>(fn: () => B) => IOPromise<Env, A|B>,
    mapErrorTo: <B>(a: B) => IOPromise<Env, A | B>,
    ignore: () => IOPromise<Env,undefined>,
    recover: <B>(onErr: (err: any) => IOPromise<unknown, B>) => IOPromise<Env,A | B>,
    run: (env: Env) => Promise<A>
}

const succeed = <Env,A>(run: (env: Env) => Promise<A>): IOPromise<Env,A> => {
    return {
        run: (env: Env): Promise<A> => run(env),
        map: <B>(fn: (a: A) => B): IOPromise<Env, B> => succeed((env) => {
            return run(env).then(fn)
        }),
        mapTo<B>(b: B){ return this.map(() => b) as IOPromise<Env,B> },
        chain: (fn) => succeed((env) => run(env).then(x => fn(x).run(env))),
        sequence(io){ return this.chain(() => io)},
        zipWith<Env0,B,C>(io: IOPromise<Env0,B>, fn: (a: A, b: B) => C){ 
            return this.chain(a => io.map(b => fn(a,b)))
        },
        zip(io){ return this.zipWith(io, (a,b) => ([a,b] as const)) },
        zipLeft<Env0,B>(io: IOPromise<Env0,B>){ return this.zipWith(io, a => a) as IOPromise<Env & Env0, A> },
        zipRight<Env0,B>(io: IOPromise<Env0,B>){ return this.zipWith(io, (_,b) => b) as IOPromise<Env & Env0,B> },
        effect(fn): IOPromise<Env, A>{ return this.chain(a => fn(a).mapTo(a)) as IOPromise<Env,A> },
        tap(fn): IOPromise<Env, A>{ return this.map(a => { fn(a); return a }) as IOPromise<Env,A> },
        access<K extends keyof A>(key: K){ return this.map(prop(key)) as IOPromise<Env,A[K]> },
        supplyOne<K extends keyof Env>(key: K, data: Env[K]){
            return succeed((a: Omit<Env,K>) => run(({ ...a, [key]: data } as unknown) as Env))
        },
        supply: (data) => succeed(env => run(({ ...env, ...data} as unknown) as Env)),
        supplyChain<B, K extends Key>(key: K, io: IOPromise<A,B>): IOPromise<Env, A & { [P in typeof key]: B }>{ 
            return this.chain((a) => io.supply(a).map(b => ({ ...a, [key]: b }))) as IOPromise<Env, A & { [P in typeof key]: B }>
        },
        expandDependency(key){
            return this.map((x) => ({...x, ...x[key]}))
        },
        accessEffect<K extends keyof A, B>(key: K, io: (a: A[K]) => IOPromise<unknown, B>){
            return this.chain(data => this.access(key).effect(io).mapTo(data))
        },
        accessChain<K extends keyof A, Env0, B>(key: K, io: (a: A[K]) => IOPromise<Env0, B>){
            return this.access(key).chain(io)
        },
        provideTo<B>(io: IOPromise<A,B>){
            return this.chain(a => io.supply(a) as IOPromise<unknown,B>)
        },
        catchError: () => {
            return succeed(async (e) => {
                try { return await run(e) } 
                catch(err) { return err }
            })
        },
        onError: (fn) => {
            return succeed(async (e) => {
                try { return await run(e) } 
                catch { return fn() }
            })
        },
        mapErrorTo: (a) => {
            return succeed(async (e) => {
                try { return await run(e) } 
                catch { return a }
            })
        },
        ignore(){
            return this.catchError().mapTo(undefined)
        },
        recover(fn){
            return succeed(async (e) => {
                try { return await run(e) } 
                catch(err) { return await fn(err).run(e) }
            })
        }
    }
}

const IOPromise = {
    of: <Env,A>(fn: (env: Env) => Promise<A>): IOPromise<Env,A> => succeed(fn),
    from: <Env,A>(fn: (env: Env) => A) => succeed((env) => Promise.resolve().then(() => fn(env))) as IOPromise<Env,UnwrapPromise<A>>,
    unary: <A,B>(fn: (a: A) => B) => (arg: A) => IOPromise.from(() => fn(arg)),
    through: <A,B>(fn: (...a: A[]) => B) => (...arg: A[]) => IOPromise.from(() => fn(...arg)),
    succeed: <A>(a: A) => IOPromise.from(() => a),
    fail: <A>(err: A) => IOPromise.of(() => Promise.reject(err)),
    require: <Env>() => IOPromise.from((env: Env) => env),
    unit: succeed(() => Promise.resolve(undefined))
}

export default IOPromise
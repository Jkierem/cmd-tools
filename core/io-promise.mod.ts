type UnwrapPromise<A> = A extends Promise<infer B> ? B : A 

type IOPromise<Env,A> = {
    map: <B>(fn: (a: A) => B) => IOPromise<Env,UnwrapPromise<B>>,
    mapTo: <B>(b: B) => IOPromise<Env,B>,
    effect: <B>(fn: (a: A) => IOPromise<Env,B>) => IOPromise<Env,A>,
    tap: (fn: (a: A) => void) => IOPromise<Env,A>,
    chain: <B>(fn: (a: A) => IOPromise<Env,B>) => IOPromise<Env,B>,
    sequence: <B>(io: IOPromise<Env,B>) => IOPromise<Env,B>,
    zipWith: <B,C>(io: IOPromise<Env,B>, fn: (a: A, b: B) => C) => IOPromise<Env, UnwrapPromise<C>>,
    zip: <B>(io: IOPromise<Env,B>) => IOPromise<Env, readonly [A,B]>,
    zipLeft: <B>(io: IOPromise<Env,B>) => IOPromise<Env,A>,
    zipRight: <B>(io: IOPromise<Env,B>) => IOPromise<Env,B>,
    run: (env: Env) => Promise<A>
}

const succeed = <Env,A>(run: (env: Env) => Promise<A>): IOPromise<Env,A> => {
    return {
        run: (env: Env): Promise<A> => run(env),
        map: <B>(fn: (a: A) => B): IOPromise<Env, UnwrapPromise<B>> => succeed((env) => {
            return run(env).then(fn) as Promise<UnwrapPromise<B>>
        }),
        mapTo<B>(b: B){ return this.map(() => b) as IOPromise<Env,B> },
        chain: (fn) => succeed((env) => run(env).then(x => fn(x).run(env))),
        sequence(io){ return this.chain(() => io)},
        zipWith<B,C>(io: IOPromise<Env,B>, fn: (a: A, b: B) => C){ 
            return this.chain(a => io.map(b => fn(a,b)))
        },
        zip(io){ return this.zipWith(io, (a,b) => ([a,b] as const)) },
        zipLeft(io){ return this.zipWith(io, a => a) as IOPromise<Env,A> },
        zipRight<B>(io: IOPromise<Env,B>){ return this.zipWith(io, (_,b) => b) as IOPromise<Env,B> },
        effect(fn): IOPromise<Env, A>{ return this.chain(a => fn(a).map(() => a)) as IOPromise<Env,A> },
        tap(fn): IOPromise<Env, A>{ return this.map(a => { fn(a); return a }) as IOPromise<Env,A> },
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
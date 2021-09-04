type UnwrapPromise<A> = A extends Promise<infer B> ? B : A 

type IOPromise<Env,A> = {
    map: <B>(fn: (a: A) => B) => IOPromise<Env,UnwrapPromise<B>>,
    mapTo: <B>(b: B) => IOPromise<Env,B>,
    effect: <B>(fn: (a: A) => IOPromise<Env,B>) => IOPromise<Env,A>,
    chain: <B>(fn: (a: A) => IOPromise<Env,B>) => IOPromise<Env,B>,
    sequence: <B>(io: IOPromise<Env,B>) => IOPromise<Env,B>,
    zip: <B>(io: IOPromise<Env,B>) => IOPromise<Env,[A,B]>,
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
        zip(io){ return this.chain((a) => io.map(b => [a,b]))},
        zipLeft(io){ return this.zip(io).map(([a]) => a) as IOPromise<Env,A> },
        zipRight(io){ return this.chain(() => io) },
        effect(fn): IOPromise<Env, A>{ return this.chain(a => fn(a).map(() => a)) as IOPromise<Env,A> },
    }
}

const IOPromise = {
    of: <Env,A>(fn: (env: Env) => Promise<A>): IOPromise<Env,A> => succeed(fn),
    from: <Env,A>(fn: (env: Env) => A) => succeed((env) => Promise.resolve().then(() => fn(env))) as IOPromise<Env,UnwrapPromise<A>>,
    unary: <A,B>(fn: (a: A) => B) => (arg: A) => IOPromise.from(() => fn(arg)),
    through: <A,B>(fn: (...a: A[]) => B) => (...arg: A[]) => IOPromise.from(() => fn(...arg)),
    succeed: <A>(a: A) => IOPromise.from(() => a),
    fail: <A>(err: A) => IOPromise.of(() => Promise.reject(err)),
}

export default IOPromise
type Reader<Env,A> = {
    map<B>(fn: (a: A) => B): Reader<Env,B>,
    chain<B>(fn: (a: A) => Reader<Env,B>): Reader<Env,B>,
    run(env: Env): A,
}

const reader = <Env,A>(run: (env: Env) => A ): Reader<Env,A> => {
    return {
        map<B>(fn: (a: A) => B): Reader<Env,B> {
            return reader((env) => fn(run(env)))
        },
        chain<B>(fn: (a: A) => Reader<Env,B>): Reader<Env,B>{
            return reader((env) => fn(run(env)).run(env))
        },
        run(env: Env): A {
            return run(env)
        },
    }
}

const Reader = {
    of: <Env,A>(fn: (env: Env) => A) => reader(fn)
}

export default Reader
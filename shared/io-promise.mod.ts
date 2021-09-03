type UnwrapPromise<A> = A extends Promise<infer B> ? B : A 

type IOPromise<A> = {
    map: <B>(fn: (a: A) => B) => IOPromise<B extends Promise<infer C> ? C : B>,
    effect: (fn: (a: A) => void) => IOPromise<A>,
    chain: <B>(fn: (a: A) => IOPromise<B>) => IOPromise<B>,
    sequence: <B>(io: IOPromise<B>) => IOPromise<B>,
    zip: <B>(io: IOPromise<B>) => IOPromise<[A,B]>,
    zipLeft: <B>(io: IOPromise<B>) => IOPromise<A>,
    zipRight: <B>(io: IOPromise<B>) => IOPromise<B>,
    run: () => Promise<A>
}

const succeed = <A>(run: () => Promise<A>): IOPromise<A> => {
    return {
        run: () => run(),
        map: <B>(fn: (a: A) => B) => succeed(() => run().then(fn)) as IOPromise<B extends Promise<infer C> ? C : B>,
        chain: (fn) => succeed(() => run().then(x => fn(x).run())),
        sequence(io){ return this.chain(() => io)},
        zip(io){ return this.chain((a) => io.map(b => [a,b]))},
        zipLeft(io){ return this.zip(io).map(([a]) => a) as IOPromise<A> },
        zipRight(io){ return this.chain(() => io)},
        effect: (fn) => succeed(() => run().then(x => {
            fn(x)
            return x
        }))
    }
}

const IOPromise = {
    of: <A>(fn: () => Promise<A>): IOPromise<A> => succeed(fn),
    fromSync: <A>(fn: () => A): IOPromise<A> => succeed(() => Promise.resolve().then(fn)),
    fromAny: <A>(fn: () => A): IOPromise<UnwrapPromise<A>> => succeed(() => Promise.resolve().then(fn)) as IOPromise<UnwrapPromise<A>>,
    unary: <A,B>(fn: (a: A) => B) => (arg: A) => IOPromise.fromAny(() => fn(arg)),
    succeed: <A>(a: A) => IOPromise.fromSync(() => a),
    fail: <A>(err: A) => IOPromise.of(() => Promise.reject(err)),
}

export default IOPromise
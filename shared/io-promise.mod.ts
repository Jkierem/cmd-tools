type IOPromise<A> = {
    map: <B>(fn: (a: A) => B) => IOPromise<B>,
    effect: (fn: (a: A) => void) => IOPromise<A>,
    chain: <B>(fn: (a: A) => IOPromise<B>) => IOPromise<B>,
    run: () => Promise<A>
}

const succeed = <A>(run: () => Promise<A>): IOPromise<A> => {
    return {
        run: () => run(),
        map: (fn) => succeed(() => run().then(fn)),
        chain: (fn) => succeed(() => run().then(x => fn(x).run())),
        effect: (fn) => succeed(() => run().then(x => {
            fn(x)
            return x
        }))
    }
}

const IOPromise = {
    of: <A>(fn: () => Promise<A>): IOPromise<A> => succeed(fn)
}

export default IOPromise
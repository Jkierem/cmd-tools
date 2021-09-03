import IOPromise from './io-promise.mod.ts'

type IO<A> = {
    map: <B>(fn: (a: A) => B) => IO<B>,
    chain: <B>(fn: (a: A) => IO<B>) => IO<B>,
    effect: (fn: (a: A) => void) => IO<A>,
    run: () => A,
    toIOPromise: () => IOPromise<A>
}

const succeed = <A>(run: () => A): IO<A> => {
    return {
        run: () => run(),
        map: <B>(outer: (a: A) => B) => succeed(() => outer(run())),
        chain: <B>(fn: (a: A) => IO<B>) => succeed(() => fn(run()).run()),
        effect(fn: (a: A) => void) {
            return this.map((a: A) => {
                fn(a)
                return a
            })
        },
        toIOPromise: () => IOPromise.fromSync(run)
    }
}

const IO = {
    of: <A>(fn: () => A) => succeed(fn),
    constant: <A>(a: A) => IO.of(() => a)
}

export default IO
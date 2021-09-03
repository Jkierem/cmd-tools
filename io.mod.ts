type UnwrapPromise<A> = A extends Promise<infer PA> ? PA : A 

type IO<A> = {
    map: <B>(fn: (a: A) => B) => IO<B>,
    chain: <B>(fn: (a: A) => IO<B>) => IO<B>,
    effect: (fn: (a: A) => void) => IO<A>,
    mapPromise: <B>(fn: (a: UnwrapPromise<A>) => B) => IO<A extends Promise<unknown> ? B extends Promise<unknown> ? B : Promise<B> : never >,
    effectPromise: <B>(fn: (a: UnwrapPromise<A>) => B) => IO<A>,
    run: () => A,
}

const succeed = <A>(run: () => A): IO<A> => {
    return {
        run: () => run(),
        map: <B>(outer: (a: A) => B) => succeed(() => outer(run())),
        chain: <B>(fn: (a: A) => IO<B>) => succeed(() => fn(run()).run()),
        mapPromise<B>(fn: (a: UnwrapPromise<A>) => B){
            return this.map((p) => {
                if( p instanceof Promise ){
                    return p.then(fn)
                } 
            }) as IO<A extends Promise<unknown> ? B extends Promise<unknown> ? B : Promise<B> : never >
        },
        effectPromise <B>(fn: (a: UnwrapPromise<A>) => B): IO<A> {
            return this.map(a => {
                if( a instanceof Promise ){
                    return a.then(x => {
                        fn(x)
                        return x
                    })
                } else {
                    fn(a as UnwrapPromise<A>)
                    return a
                }
            }) as IO<A>
        },
        effect(fn: (a: A) => void) {
            return this.map((a: A) => {
                fn(a)
                return a
            })
        }
    }
}

const IO = {
    of: <A>(fn: () => A) => succeed(fn),
    succeed,
}

export default IO
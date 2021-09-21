import { AssertionError, assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

type Try<A> = {
    expect: {
        toHaveThrown: (msg?: string) => void,
        toHaveReturned: (msg?: string) => void,
        toThrow: (err: unknown, msg?: string) => void,
        toReturn: (ret: A, msg?: string) => void,
    }
}

const Success = <T>(a: T): Try<T> => {
    return {
        expect: {
            toHaveThrown: (msg?: string) => {
                throw new AssertionError(msg ?? "Expected to throw but returned instead")
            },
            toHaveReturned: (_msg?: string) => {},
            toReturn: (ret: T, msg?: string) => {
                assertEquals(ret, a, msg ??`Expected to return "${ret}" but returned "${a}" instead`)
            },
            toThrow: (err: unknown, msg?: string) => {
                throw new AssertionError(msg ?? `Expected to throw "${err}" but returned "${a}" instead.`)
            } 
        }
    }
}

const Failure = <T>(a: T): Try<T> => {
    return {
        expect: {
            toHaveThrown: (_msg?: string) => {},
            toHaveReturned: (msg?: string) => {
                throw new AssertionError(msg ?? "Expected to return but threw an error instead")
            },
            toReturn: (ret: T, msg?: string) => {
                throw new AssertionError(msg ?? `Expected to return "${ret}" but threw "${a}" instead.`)
            },
            toThrow: (err: unknown, msg?: string) => {
                assertEquals(err, a, msg ??`Expected to throw "${err}" but threw "${a}" instead`)
            } 
        }
    }
}

export const of = async <T>(fn: () => Promise<T>) => {
    try {
        return Success(await fn())
    } catch(e) {
        return Failure(e)
    }
}

export const attempt = of;

export const Try = { of, attempt }
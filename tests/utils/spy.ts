// deno-lint-ignore-file
import { AssertionError } from "https://deno.land/std@0.106.0/testing/asserts.ts";

type Call<Args extends any[], Ret> = {
    args: Args,
    result: Ret,
    callTime: number,
    calledBefore(other: Call<any,any>): boolean,
    calledAfter(other: Call<any,any>): boolean,
}

const mkCall = <Args extends any[],Ret>(data: { args: Args, result: Ret }): Call<Args,Ret> => {
    return {
        ...data,
        callTime: Date.now(),
        calledBefore(otherCall){
            return this.callTime - otherCall.callTime < 0
        },
        calledAfter(otherCall){
            return this.callTime - otherCall.callTime >= 0
        }
    }
}

export type Spy<Args extends any[], Ret> = {
    (...args: Args): Ret, 
    readonly calls: Call<Args,Ret>[],
    readonly callCount: number,
    readonly called: boolean,
    readonly calledOnce: boolean,
    readonly calledTwice: boolean,
    readonly calledThrice: boolean,
    calledWith(...args: Args): boolean,
    getNthCall(n: number): Call<Args,Ret>,
    findCall(fn: (call: Call<Args,Ret>) => boolean): Call<Args,Ret> | undefined,
    setImplementation(impl: (...args: Args[]) => Ret): Spy<Args,Ret>,
    reset(): Spy<Args,Ret>,
    assert: {
        wasNotCalled(): void,
        wasCalled(): void,
        wasCalledOnce(): void,
        wasCalledTwice(): void,
        wasCalledThrice(): void,
        hasCallCountOf(n: number): void,
        wasCalledWith(...args: Args): void,
    }
}

const defineReadonly = <T,U>(obj: T, prop: string, get: () => U): T => {
    return Object.defineProperty(obj, prop, { get })
}

const equals = (a: any, b: any): boolean => {
    const typeA = typeof a
    const typeB = typeof b
    if( typeA !== typeB || typeA === "function" ){
        return false
    }
    if( typeA === "object" ){
        if( a === b ){
            return true
        }
        if( Array.isArray(a) && Array.isArray(b) ){
            return a.every((_a, idx) => equals(_a, b[idx]))
        }
        if( 
            (Array.isArray(a) && !Array.isArray(b)) ||
            (!Array.isArray(a) && Array.isArray(b)) 
        ){
            return false
        }
        const setAB = new Set([...Object.keys(a), ...Object.keys(b)])
        return Array.from(setAB).every(key => equals(a[key], b[key]))
    }
    return a === b
}

type Extractable<T,Args extends any[]> = T | ((...args: Args) => T)

const extract = <T,Args extends any[]>(x: Extractable<T,Args>, ...args: Args) => {
    if( x instanceof Function ){
        return x(...args)
    }
    return x
}

const mkAssert = <T extends any[]>(pred: (...args: T) => boolean, msg: Extractable<string,T>) => (...args: T) => {
    if( !pred(...args) ){
        throw new AssertionError(extract(msg,...args))
    }
}

export const Spy = <Args extends any[],Ret>(fn: (...args: Args) => Ret): Spy<Args,Ret> => {
    let calls: Call<Args,Ret>[] = []
    let impl = fn

    function sp(...args: Args): Ret {
        const result = impl(...args)
        calls.push(mkCall<Args,Ret>({ 
            args, 
            result
        }))
        return result
    }

    defineReadonly(sp, "calls", () => calls)
    defineReadonly(sp, "callCount", () => calls.length)
    defineReadonly(sp, "called", () => calls.length > 0)
    defineReadonly(sp, "calledOnce", () => calls.length === 1)
    defineReadonly(sp, "calledTwice", () => calls.length === 2)
    defineReadonly(sp, "calledThrice", () => calls.length === 3)

    sp.calledWith = (...args: Args) => calls.some(call => call.args.every((a,idx) => equals(a,args[idx])))
    sp.getNthCall = (n: number) => calls[n]
    sp.setImplementation = (fn: (...args: Args) => Ret) => {
        impl = fn
        return sp
    }
    sp.reset = () => {
        calls = []
        impl = fn
        return sp;
    }

    sp.assert = {
        wasCalled: mkAssert(
            () => (sp as any).called, 
            `Expected function to have been called`
        ),
        wasNotCalled: mkAssert(
            () => !(sp as any).called, 
            `Expected function to not have been called`
        ),
        hasCallCountOf: mkAssert<[number]>(
            (n: number) => (sp as any).callCount === n, 
            (n: number) => `Expected function to have a call count of ${n} but has a call count of ${(sp as any).callCount}`
        ),
        wasCalledWith: mkAssert(
            (...args: Args) => sp.calledWith(...args),
            (...args: Args) => `Expected function to have been called with ${args}`
        ),
        wasCalledOnce(){
            this.hasCallCountOf(1)
        },
        wasCalledTwice(){
            this.hasCallCountOf(2)
        },
        wasCalledThrice(){
            this.hasCallCountOf(3)
        },
    }

    return sp as unknown as Spy<Args,Ret>
}
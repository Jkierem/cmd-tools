import IOPromise from './io-promise.ts'

type Either<Left,Right> = {
    tag: "Left" | "Right",
    map: <B>(fn: (a: Right) => B) => Either<Left,B>,
    mapTo: <B>(n: B) => Either<Left,B>,
    mapLeft: <L>(fn: (l: Left) => L) => Either<L,Right>,
    mapLeftTo: <L>(left: L) => Either<L,Right>,
    chain: <L,R>(fn: (a: Right) => Either<L,R>) => Either<L,R>,
    fold: <L,R>(onLeft: (a: Left) => L, onRight: (b: Right) => R) => L | R,
    toIOPromise: () => IOPromise<unknown,Right>
}

type Right<R> = Either<never,R>
type Left<L> = Either<L,never>

const Right = <Left,Right>(x: Right): Either<Left,Right> => {
    return {
        tag: "Right",
        map: <B>(fn: (a: Right) => B) => Right(fn(x)),
        mapTo: <B>(b: B) => Right(b),
        mapLeft: <L>(_fn: (a: Left) => L) => (Right(x) as unknown) as Either<L, Right>,
        mapLeftTo: <L>(_l: L) => (Right(x) as unknown) as Either<L, Right>,
        chain: <L,R>(fn: (a: Right) => Either<L,R>) => fn(x),
        fold: <L,R>(_onLeft: (a: Left) => L, onRight: (b: Right) => R) => onRight(x),
        toIOPromise: () => IOPromise.succeed(x) as IOPromise<unknown, Right>
    }
}

const Left = <Left,Right>(x: Left): Either<Left,Right> => {
    return {
        tag: "Left",
        map: <B>(_fn: (a: Right) => B) => Left(x) as Either<Left,B>,
        mapTo: <B>(_b: B) => Left(x) as Either<Left,B>,
        mapLeft: <L>(fn: (l: Left) => L) => Left(fn(x)),
        mapLeftTo: <L>(l: L) => Left(l),
        chain: <L,R>(_fn: (a: Right) => Either<L,R>) => (Left(x) as unknown) as Either<L,R>,
        fold: <L,R>(onLeft: (a: Left) => L, _onRight: (b: Right) => R) => onLeft(x),
        toIOPromise: () => IOPromise.fail(x)
    }
}

const Either = {
    of: <T>(x: T) => (x ? Right(x) : Left(x)) as Either<T,NonNullable<T>>,
    fromPredicate: <T>(pred: (x: T) => boolean, x: T) => Either.of(pred(x)).mapTo(x).mapLeftTo(x),
    ofPredicate: <L,R>(pred: (x: L | R) => x is R) => (x: L | R) => pred(x) ? Right<L,R>(x) : Left<L,R>(x),
    Left,
    Right,
    attempt: <T>(fn: () => T) => {
        try {
            return Right(fn()) as Right<T>
        } catch(e) {
            return Left(e) as Left<unknown>
        }
    }
}

export type EitherCons<Arg,Left,Right> = (x: Arg) => Either<Left,Right> 

export default Either
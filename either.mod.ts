type Either<Left,Right> = {
    x: Left | Right,
    tag: "Left" | "Right",
    map: <B>(fn: (a: Right) => B) => Either<Left,B>,
    mapLeft: <L>(fn: (l: Left) => L) => Either<L,Right>,
    chain: <L,R>(fn: (a: Right) => Either<L,R>) => Either<L,R>,
    fold: <L,R>(onLeft: (a: Left) => L, onRight: (b: Right) => R) => L | R
}

const Right = <Left,Right>(x: Right): Either<Left,Right> => {
    return {
        x,
        tag: "Right",
        map: <B>(fn: (a: Right) => B) => Right(fn(x)),
        mapLeft: <L>(_fn: (a: Left) => L) => (Right(x) as unknown) as Either<L, Right>,
        chain: <L,R>(fn: (a: Right) => Either<L,R>) => fn(x),
        fold: <L,R>(_onLeft: (a: Left) => L, onRight: (b: Right) => R) => onRight(x)
    }
}

const Left = <Left,Right>(x: Left): Either<Left,Right> => {
    return {
        x,
        tag: "Left",
        map: <B>(_fn: (a: Right) => B) => Left(x) as Either<Left,B>,
        mapLeft: <L>(fn: (l: Left) => L) => Left(fn(x)),
        chain: <L,R>(_fn: (a: Right) => Either<L,R>) => (Left(x) as unknown) as Either<L,R>,
        fold: <L,R>(onLeft: (a: Left) => L, _onRight: (b: Right) => R) => onLeft(x)
    }
}

const Either = {
    of: <T>(x: T): Either<T,T> => x ? Right(x) : Left(x),
    Left,
    Right
}

export default Either
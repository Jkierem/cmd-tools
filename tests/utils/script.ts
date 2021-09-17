type Script<T> = {
    <U>(...args: U[]): T,
    addNext: (n: T) => Script<T>
}

export const Script = <T>(): Script<T> => {
    let queue: T[] = []

    const fn = () => {
        const [head, ...tail] = queue;
        queue = tail
        return head
    }

    fn.addNext = (n: T) => {
        queue.push(n)
        return fn
    }

    return fn
}

export const fromArray = <T>(arr: T[]) => {
    const sc = Script<T>()
    arr.forEach(r => sc.addNext(r))
    return sc;
}
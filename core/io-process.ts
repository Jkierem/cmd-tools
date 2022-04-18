import Async from './jazzi/async/mod.ts'
import type { ProcessRunner } from "./services.ts"

const IOProcess = {
    of: (cmd: string[]) => {
        return Async
            .require<{ runner: ProcessRunner }>()
            .access("runner")
            .chain(runner => Async.from(() => runner.run(cmd)))
    },
    ask: <Reqs>() => Async.require<Reqs>(),
    build: <T>(buildFn: (a: T) => string[]) => Async
        .require<T>()
        .map(buildFn)
        .chain(x => Async.of(() => x))
}

export default IOProcess
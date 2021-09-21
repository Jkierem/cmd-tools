import IOPromise from "./io-promise.ts"
import type { ProcessRunner } from "./services.ts"

const IOProcess = {
    of: (cmd: string[]) => {
        return IOPromise
            .require<{ runner: ProcessRunner }>()
            .access("runner")
            .chain(runner => IOPromise.of(() => runner.run(cmd)))
    },
    ask: <Reqs>() => IOPromise.require<Reqs>(),
    build: <T>(buildFn: (a: T) => string[]) => IOPromise
        .require<T>()
        .map(buildFn)
        .chain(IOProcess.of)
}

export default IOProcess
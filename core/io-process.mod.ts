import IOPromise from "./io-promise.mod.ts"
import type { ProcessRunner } from "./services.mod.ts"

const IOProcess = {
    of: (cmd: string[]) => {
        return IOPromise
            .require<{ runner: ProcessRunner }>()
            .access("runner")
            .chain(runner => IOPromise.of(() => runner.run(cmd)))
    },
}

export default IOProcess
import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";
// import IOPromise from "../core/io-promise.mod.ts"
import AutoCommit from "../commands/auto-commit.mod.ts"
import type { FileIO, ConsoleService } from "../core/io-helpers.mod.ts"
import { encode } from "../core/codec.mod.ts"

const MockRunner = {
    run: (cmd: string[]) => {
        console.log(cmd)
        if( cmd.includes("status") ){
            return Promise.resolve("On branch J-42")
        }
        if( cmd.includes("commit") ){
            return Promise.resolve("Test complete")
        }
        return Promise.reject("Only two calls expected")
    }
}

const MockFileIO: FileIO = {
    read: (path: string) => {
        console.log(path)
        return Promise.resolve(encode("{}"))
    },
    write: (path, data) => {
        console.log(path,data)
        return Promise.resolve()
    }
}

const MockConsole: ConsoleService = {
    log: (...args) => { console.log("Received: ") },
    prompt: (msg: string) => {
        console.log("Prompt: ",msg)
        return "no"
    }
}

Deno.test("AutoCommit", async () => {
    const res = await AutoCommit
        .run({
            args: ["hey ho"],
            config: { ticketToken: "J" },
            runner: MockRunner,
            fileIO: MockFileIO,
            console: MockConsole,
        })
    console.log(res)
    assertEquals(res, "Test complete")
})
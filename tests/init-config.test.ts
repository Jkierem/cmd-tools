import { assert, assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";
import { Runner } from "../core/io-process.mod.ts"
import IOPromise from "../core/io-promise.mod.ts"
import AutoCommit from "../commands/auto-commit.mod.ts"

Runner.setRun(() => { throw new Error("What")})

Deno.test("Lets try", async () => {
    const res = await AutoCommit
        .recover(err => IOPromise.succeed(err))
        .run({
            args: [],
            config: { ticketToken: "J" }
        })
    console.log(res)
    assertEquals(res, "What 2")
})
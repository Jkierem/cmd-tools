import IOPromise from '../shared/io-promise.mod.ts'
import { IOCommand, Command } from '../shared/command.mod.ts'
import { doConfirm, printLn } from '../shared/io-helpers.mod.ts'

const branch = (name: string) => ["git","checkout","-b",name]

const NewBranch: Command<string> = Command
    .ask()
    .map(({ args }) => args.join("-"))
    .map(name => {
        return printLn(`About to run "${branch(name).join(" ")}"`)
            .zipRight(doConfirm("Are you sure?"))
            .map((answer) => console.log("You answered: ",answer))
            .zipRight(IOCommand.decoded(["echo","hey"]))
            .run()
    })

export default NewBranch
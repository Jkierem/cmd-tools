import Either from '../shared/either.mod.ts'
import { printLn } from '../shared/io-helpers.mod.ts'
import { IOProcess, Command, CommandEnv } from '../shared/command.mod.ts'

const gitCmdArgs = (...cmd: string[]) => ["git",...cmd]
const statusCmd = gitCmdArgs("status")
const commitCmd = (msg: string) => gitCmdArgs("commit", "-m", msg)

const validateMessage = (message: string) => {
    return Either.of(message)
        .mapLeft(() => "No message provided")
        .map(str => str.trim())
        .chain((str) => Either
            .fromPredicate(x => x.length !== 0, str)
            .mapLeft(() => "Message is empty")
        ).toIOPromise()
}

const validateBranch = (branch: string | undefined) => {
    return Either.of(branch)
        .mapLeft(() => "No branch found")
        .chain(b => Either
            .fromPredicate(x => /DITYS-[0-9]*/.test(x), b)
            .mapLeft(() => "Branch is not a feature branch")
        ).toIOPromise()
}

const findTicketName = (str: string) => {
    return Either.of(str.match(/DITYS-[0-9]*/))
        .chain(matches => Either.of(matches[0]))
        .mapLeft(() => "Couldn't get ticket name")
        .toIOPromise()
}

const prepare = ({ args }: CommandEnv) => ({ message: args.join(" ") })

const printRunMessage = (cmd: string[]) => printLn(`About to run "${cmd.join(" ")}"`)

const AutoCommit: Command<string> = Command.ask().map(prepare).map(({ message }) => {
    return validateMessage(message)
        .sequence(IOProcess.decoded(statusCmd))
        .map((str) => str.split(/[\n\r]/))
        .map((str) => str.find(s => s.includes("On branch")))
        .chain(validateBranch)
        .chain(findTicketName)
        .map((ticket) => commitCmd(`${ticket}: ${message}`))
        .effect(printRunMessage)
        .chain(IOProcess.decoded)
        .run()
})

export default AutoCommit;
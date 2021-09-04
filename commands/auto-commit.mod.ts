import Either from '../core/either.mod.ts'
import { printRunMessage } from '../core/io-helpers.mod.ts'
import { getCurrentBranch, gitCmd } from "../core/git-helpers.mod.ts"
import { IOProcess, Command, CommandEnv } from '../core/command.mod.ts'

const commitCmd = (msg: string) => gitCmd("commit", "-m", msg)

const validateMessage = (message: string) => {
    return Either.of(message)
        .mapLeft(() => "No message provided")
        .map(str => str.trim())
        .chain((str) => Either
            .fromPredicate(x => x.length !== 0, str)
            .mapLeft(() => "Message is empty")
        ).toIOPromise()
}

const validateBranch = (branch: string) => {
    return Either
        .fromPredicate(x => /DITYS-[0-9]*/.test(x), branch)
        .mapLeft(() => "Branch is not a feature branch")
        .toIOPromise()
}

const findTicketName = (str: string) => {
    return Either.of(str.match(/DITYS-[0-9]*/))
        .chain(matches => Either.of(matches[0]))
        .mapLeft(() => "Couldn't get ticket name")
        .toIOPromise()
}

const prepare = ({ args }: CommandEnv) => ({ message: args.join(" ") })

const AutoCommit: Command<string> = Command.ask().map(prepare).chain(({ message }) => {
    return validateMessage(message)
        .sequence(getCurrentBranch)
        .chain(validateBranch)
        .chain(findTicketName)
        .map((ticket) => commitCmd(`${ticket}: ${message}`))
        .effect(printRunMessage)
        .chain(IOProcess.decoded)
})

export default AutoCommit;
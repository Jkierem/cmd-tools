import Either from '../core/either.mod.ts'
import { printRunMessage } from '../core/io-helpers.mod.ts'
import { getCurrentBranch, gitCmd } from "../core/git-helpers.mod.ts"
import { IOProcess, Command, CommandEnv } from '../core/command.mod.ts'
import { CommitConfig } from "../core/configuration.mod.ts"

const TicketRegExp = (ticketToken: string) => new RegExp(`${ticketToken}-[0-9]*`)

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

const validateBranch = (ticketToken: string) => (branch: string) => {
    return Either
        .fromPredicate(x => TicketRegExp(ticketToken).test(x), branch)
        .mapLeft(() => "Branch is not a feature branch")
        .toIOPromise()
}

const findTicketName = (ticketToken: string) => (str: string) => {
    return Either.of(str.match(TicketRegExp(ticketToken)))
        .chain(matches => Either.of(matches[0]))
        .mapLeft(() => "Couldn't get ticket name")
        .toIOPromise()
}


const AutoCommit: Command<CommitConfig,string> = Command
    .ask<CommitConfig>()
    .map(({ args, config }) => ({ 
        message: args.join(" "),
        ...config,
    }))
    .chain(({ message, ticketToken }) => {
    return validateMessage(message)
        .sequence(getCurrentBranch)
        .chain(validateBranch(ticketToken))
        .chain(findTicketName(ticketToken))
        .map((ticket) => commitCmd(`${ticket}: ${message}`))
        .effect(printRunMessage)
        .chain(IOProcess.of)
})

export default AutoCommit;
import Either from '../core/either.mod.ts'
import IOProcess from "../core/io-process.mod.ts"
import { printRunMessage } from '../core/io-helpers.mod.ts'
import { getCurrentBranch, gitCmd } from "../core/git-helpers.mod.ts"
import { Command } from '../core/command.mod.ts'
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
    .openDependency("config")
    .map(({ args, ticketToken, runner }) => ({ 
        message: args.join(" "),
        ticketToken,
        runner,
    }))
    .chain(({ message, ticketToken, runner }) => {
        return validateMessage(message)
            .zipRight(getCurrentBranch.supply({ runner }))
            .chain(validateBranch(ticketToken))
            .chain(findTicketName(ticketToken))
            .map((ticket) => commitCmd(`${ticket}: ${message}`))
            .effect(printRunMessage)
            .chain(cmd => IOProcess.of(cmd).supply({ runner }))
    })

export default AutoCommit;
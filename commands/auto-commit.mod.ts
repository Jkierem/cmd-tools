import Either from '../core/either.mod.ts'
import Maybe from '../core/maybe.mod.ts'
import IOProcess from "../core/io-process.mod.ts"
import IOPromise from "../core/io-promise.mod.ts"
import { printRunMessage, printLn } from '../core/io-helpers.mod.ts'
import { getCurrentBranch, gitCmd } from "../core/git-helpers.mod.ts"
import { Command } from '../core/command.mod.ts'
import { CommitConfig } from "../core/configuration.mod.ts"
import type { ConsoleService } from "../core/services.mod.ts"

const TicketRegExp = (ticketToken: string) => new RegExp(`${ticketToken}-[0-9]+`)

const commitCmd = (msg: string) => gitCmd("commit", "-m", msg)

const validateMessage = (message: string) => {
    return Either.of(message)
        .mapLeftTo("No message provided")
        .map(str => str.trim())
        .chain((str) => Either
            .fromPredicate(x => x.length !== 0, str)
            .mapLeftTo("Message is empty")
        ).toIOPromise()
}

const validateBranch = (ticketToken: string | null) => (branch: string) => {
    return Maybe
        .fromNullish(ticketToken)
        .map(tt => TicketRegExp(tt).test(branch))
        .map(pass => pass 
            ? IOPromise.succeed(branch) 
            : IOPromise.fail("Branch is not a feature branch")
        )
        .onNone(IOPromise.unit.mapTo(branch))
}

const findTicketName = (ticketToken: string | null) => (branch: string) => {
    return Maybe
        .fromNullish(ticketToken)
        .map(tt => branch.match(TicketRegExp(tt)))
        .map(matches => matches?.[0])
        .map(match => IOPromise.succeed(match!))
        .onNone(() => IOPromise.succeed(branch))
}


const AutoCommit: Command<CommitConfig,string> = Command
    .ask<CommitConfig>()
    .openDependency("config")
    .map(({ args, ticketToken, runner, console }) => ({ 
        message: args.join(" "),
        ticketToken,
        runner,
        console,
    }))
    .chain(({ message, ticketToken, runner, console }) => {
        const branchEnabledMsg = ticketToken 
            ? IOPromise.require<{ console: ConsoleService }>().map(() => {})
            : printLn("Feature branch detection is off. Proceeding...")

        return branchEnabledMsg
            .supply({ console })
            .zipRight(validateMessage(message))
            .zipRight(getCurrentBranch.supply({ runner }))
            .chain(validateBranch(ticketToken))
            .chain(findTicketName(ticketToken))
            .map((ticket) => commitCmd(`${ticket}: ${message}`))
            .effect(msg => printRunMessage(msg).supply({ console }))
            .chain(cmd => IOProcess.of(cmd).supply({ runner }))
    })

export default AutoCommit;
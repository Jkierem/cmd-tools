import IOProcess from "../core/io-process.ts"
import { Maybe, Either, Async } from '../core/jazzi/mod.ts'
import { AsyncIO } from '../core/jazzi/async/types.ts'
import { openDependency } from '../core/jazzi/ext.ts'
import { printRunMessage, printLn } from '../core/io-helpers.ts'
import { getCurrentBranch, gitCmd } from "../core/git-helpers.ts"
import { Command } from '../core/command.ts'
import { CommitConfig } from "../core/configuration.ts"
import type { ConsoleService } from "../core/services.ts"

const TicketRegExp = (ticketToken: string) => new RegExp(`${ticketToken}-[0-9]+`)

const commitCmd = (msg: string) => gitCmd("commit", "-m", msg)

const validateMessage = (message: string) => {
    return Either.fromCondition(msg => msg.length > 0, message)
        .mapLeft(() => "No message provided")
        .map(str => str.trim())
        .chain((str) => Either
            .fromCondition(x => x.length !== 0, str)
            .mapLeft(() => "Message is empty")
        ).toAsync()
}

const validateBranch = (ticketToken: string | null) => (branch: string) => {
    return Maybe
        .fromNullish(ticketToken)
        .map(tt => TicketRegExp(tt).test(branch))
        .map(pass => (pass 
            ? Async.Success(branch) 
            : Async.Fail("Branch is not a feature branch")) as AsyncIO<string,string>
        )
        .onNone(Async.unit().mapTo(branch) as AsyncIO<string,string>)
}

const findTicketName = (ticketToken: string | null) => (branch: string) => {
    return Maybe
        .fromNullish(ticketToken)
        .map(tt => branch.match(TicketRegExp(tt)))
        .map(matches => matches?.[0])
        .map(match => Async.Success(match!))
        .onNone(() => Async.Success(branch))
}


const AutoCommit: Command<CommitConfig,string> = Command
    .ask<CommitConfig>()
    .pipe(openDependency("config"))
    .map(({ args, ticketToken, runner, console }) => ({ 
        message: args.join(" "),
        ticketToken,
        runner,
        console,
    }))
    .chain(({ message, ticketToken, runner, console }) => {
        const branchEnabledMsg = ticketToken 
            ? Async.require<{ console: ConsoleService }>().map(() => {})
            : printLn("Feature branch detection is off. Proceeding...")

        return branchEnabledMsg
            .provide({ console })
            .zipRight(validateMessage(message))
            .zipRight(getCurrentBranch.provide({ runner }))
            .chain(validateBranch(ticketToken))
            .chain(findTicketName(ticketToken))
            .map((ticket) => commitCmd(`${ticket}: ${message}`))
            .tapEffect(msg => printRunMessage(msg).provide({ console }))
            .chain(cmd => IOProcess.of(cmd).provide({ runner }))
    })

export default AutoCommit;
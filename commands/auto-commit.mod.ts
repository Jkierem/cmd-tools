import Either from '../shared/either.mod.ts'
import { IOCommand, Command, CommandEnv } from '../shared/command.mod.ts'

const gitCmdArgs = (...cmd: string[]) => ["git",...cmd]
const status = gitCmdArgs("status")
const commit = (msg: string) => gitCmdArgs("commit", "-m", msg)

const validateBranch = (branch: string) => {
    return Either.of(branch)
        .mapLeft(() => "No branch found")
        .chain(b => Either.of(/DITYS-[0-9]*/.test(b))
            .map(() => b)
            .mapLeft(() => "Branch is not a feature branch")
        ).toIOPromise()
}

const findTicketName = (str: string) => {
    return Either.of(str.match(/DITYS-[0-9]*/))
        .chain(matches => Either.of(matches[0]))
        .mapLeft(() => "Couldn't get ticket name")
        .toIOPromise()
}

const coerceEither = <L,R>(e: Either<unknown,unknown>) => e as Either<L,R>

const prepare = ({ args }: CommandEnv) => ({message: args.join(" ") })

const AutoCommit: Command<string> = Command.ask().map(prepare).map(({ message }) => {
    return Either.of(message)
        .mapLeft(() => "No message provided")
        .map((msg) => msg.trim())
        .chain((msg) => coerceEither<string,string>(msg.length === 0 ? Either.Left("Message is empty") : Either.Right(msg)))
        .map((message) => {
            return IOCommand.decoded(status)
                .map((str) => str.split(/[\n\r]/))
                .map((str) => str.find(s => s.includes("On branch")) ?? "")
                .chain(validateBranch)
                .chain(findTicketName)
                .map((ticket) => commit(`${ticket}: ${message}`))
                .effect((cmd) => console.log(`About to run "${cmd.join(' ')}"`))
                .chain((gitCommit) => IOCommand.decoded(gitCommit))
                .run()
        }).fold(
            (err) => Promise.reject(err),
            (pa) => pa 
        )
})

export default AutoCommit;
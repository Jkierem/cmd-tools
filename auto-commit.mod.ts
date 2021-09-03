import Either from './either.mod.ts'
import { IOCommand, Command, decode, CommandEnv } from './shared.mod.ts'

const gitCmd = (...cmd: string[]) => ["git",...cmd]
const status = gitCmd("status")
const commit = (msg: string) => gitCmd("commit", "-m", msg)

type GitProcess = Deno.Process<{
    cmd: string[];
    stdout: "piped";
    stderr: "piped";
}>

const validateProc = async (proc: GitProcess) => {
    const status = await proc.status()
    if( status.code === 0 ){
        return proc.output()
    } else {
        const err = await proc.stderrOutput();
        return Promise.reject(`${decode(err)} \nProcess exited with non-zero code ${status.code}`)
    }
}

const validateBranch = (branch: string) => {
    return Either.of(branch)
        .mapLeft(() => "No branch found")
        .chain(b => Either.of(/DITYS-[0-9]*/.test(b))
            .map(() => b)
            .mapLeft(() => "Branch is not a feature branch")
        ).fold(
            left => Promise.reject(left),
            right => Promise.resolve(right)
        ) 
}

const coerceEither = <L,R>(e: Either<unknown,unknown>) => e as Either<L,R>

const prepare = ({ args }: CommandEnv) => ({message: args.join(" ") })

const AutoCommit: Command<string> = Command.ask().map(prepare).map(({ message }) => {
    return Either.of(message)
        .mapLeft(() => "No message provided")
        .map((msg) => msg.trim())
        .chain((msg) => coerceEither<string,string>(msg.length === 0 ? Either.Left("Message is empty") : Either.Right(msg)))
        .map((message) => {
            return IOCommand(status)
                .map(validateProc)
                .mapPromise(decode)
                .mapPromise((str) => str.split(/[\n\r]/))
                .mapPromise((str) => str.find(s => s.includes("On branch")) ?? "")
                .mapPromise((str) => str.replace("On branch","").trim())
                .mapPromise(validateBranch)
                .mapPromise((str) => str.match(/DITYS-[0-9]*/)?.[0]!)
                .mapPromise((ticket) => commit(`${ticket}: ${message}`))
                .effectPromise((cmd) => console.log(`About to run "${cmd.join(' ')}"`))
                .mapPromise((gitCommit) => IOCommand(gitCommit).run())
                .mapPromise(validateProc)
                .mapPromise(decode)
                .run()
        }).fold(
            (err) => Promise.reject(err),
            (pa) => pa 
        )
})

export default AutoCommit;
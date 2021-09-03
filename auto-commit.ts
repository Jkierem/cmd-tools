import IO from './io.mod.ts'
import Either from './either.mod.ts'

const message = Deno.args.join(' ').trim()

const gitCmd = (...cmd: string[]) => ["git",...cmd]
const status = gitCmd("status")
const commit = (msg: string) => gitCmd("commit", "-m", msg)
const Decoder = new TextDecoder()
const decode = (x: Uint8Array) => Decoder.decode(x)
const Command = (cmd: string[]) => IO.of(() => Deno.run({ cmd, stdout: "piped", stderr: "piped" }))

if(message.length === 0){ 
    console.error("No message provided.") 
} else {
    const ioStatus = Command(status)
    
    const validateBranch = (branch: string) => {
        return Either.of(branch)
            .mapLeft(() => "No branch found")
            .chain(b => Either.of(/DITYS-[0-9]*/.test(b as string))
                .map(() => b)
                .mapLeft(() => "Branch is not a feature branch")
            ).fold(
                left => Promise.reject(left),
                right => Promise.resolve(right)
            ) 
    }
    
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
            console.log(decode(err))
            return Promise.reject(`Process exited with non-zero code ${status.code}`)
        }
    }
    
    ioStatus
        .map(validateProc)
        .mapPromise(decode)
        .mapPromise((str) => str.split(/[\n\r]/))
        .mapPromise((str) => str.find(s => s.includes("On branch")) ?? "")
        .mapPromise((str) => str.replace("On branch","").trim())
        .mapPromise(validateBranch)
        .mapPromise((str) => str.match(/DITYS-[0-9]*/)?.[0]!)
        .mapPromise((ticket) => commit(`${ticket}: ${message}`))
        .effectPromise((cmd) => console.log(`About to run "${cmd.join(' ')}"`))
        .mapPromise((args) => Command(args).run())
        .mapPromise(validateProc)
        .mapPromise(decode)
        .effectPromise(console.log)
        .run()
}
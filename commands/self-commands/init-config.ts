import { Command } from "../../core/command.ts"
import { doPrompt, doPromptOr, doBooleanConfirm } from "../../core/io-helpers.ts"
import { setConfig, ConfigFile } from "../../core/configuration.ts"

const InitConfig = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .supplyChain("ticketToken", doPrompt("What branch token are you using?"))
    .supplyChain("prefix", doPrompt("What is the prefix for commits?"))
    .supplyChain("baseBranch", doPromptOr("What is the base branch?","development"))
    .supplyChain("autoStashEnabled", doBooleanConfirm("Enable autostashing?").map(x => x ? "true" : "false"))
    .map(({ 
        autoStashEnabled, 
        prefix,
        baseBranch,
        ticketToken,
        fileUrl,
        fileIO,
    }) => ({
        data: {
            branch: {
                prefix,
                joinChar: "-",
                separator: "/",
            },
            commit: { ticketToken },
            update: {
                autoStashEnabled,
                baseBranch,
                pullOptions: "default",
            },
        } as ConfigFile,
        fileUrl,
        fileIO
    }))
    .provideTo(setConfig)
    .mapTo("Generated config")

export default InitConfig
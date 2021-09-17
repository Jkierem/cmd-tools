import { Command } from "../../core/command.mod.ts"
import { doPrompt, doPromptOr, doBooleanConfirm } from "../../core/io-helpers.mod.ts"
import { setConfig, ConfigFile } from "../../core/configuration.mod.ts"

const InitConfig = Command
    .ask<{ fileUrl: string }>()
    .openDependency("config")
    .supplyChain("ticketToken", doPrompt("What branch token are you using?"))
    .supplyChain("branchPrefix", doPrompt("What is the prefix for commits?"))
    .supplyChain("baseBranch", doPromptOr("What is the base branch?","development"))
    .supplyChain("autoStashEnabled", doBooleanConfirm("Enable autostashing?").map(x => x ? "true" : "false"))
    .map(({ 
        autoStashEnabled, 
        branchPrefix,
        baseBranch,
        ticketToken,
        fileUrl,
        fileIO,
    }) => ({
        data: {
            branch: {
                branchPrefix,
                joinChar: "-",
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
RES_HOME=$(cd ~; pwd)
echo "Remember to run this command from the root of the repo..."
CUSTOM_CMD_TOOLS=$(pwd)
read -p "Provide the path to the root of the cloned repo of cmd-tools ($CUSTOM_CMD_TOOLS):" CMD_TOOLS_ANS
if [ "$CMD_TOOLS_ANS" ]
then
    CUSTOM_CMD_TOOLS="$CMD_TOOLS_ANS"
fi
BASH_FILE="$RES_HOME/.bashrc"
read -p "Provide the path to .bashrc or similar file ($BASH_FILE):" BASH_FILE_ANS
if [ "$BASH_FILE_ANS" ]
then
    BASH_FILE="$BASH_FILE_ANS"
fi
echo "export CUSTOM_CMD_TOOLS=$CUSTOM_CMD_TOOLS" | tee -a $BASH_FILE
echo "alias auto=\"\$CUSTOM_CMD_TOOLS/bin/runner\"" | tee -a $BASH_FILE
echo "Added definitions to $BASH_FILE"
echo "Restart console to use cmd-tools"
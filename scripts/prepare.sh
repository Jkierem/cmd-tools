CUSTOM_CMD_TOOLS=$(pwd)
mkdir ./sandbox
cd ./sandbox
git init
git commit --allow-empty -m "initial commit"
git checkout -b "development"
git commit --allow-empty -m "Test commit"
echo '{"update":{"baseBranch":"development","pullOptions":"default","autoStashEnabled":"true"},"commit":{"ticketToken":"DITYS"},"branch":{"branchPrefix":"DITYS","joinChar":"-"}}'> config.json
echo "deno run --allow-run ../runner.ts \"\$@\"" >> ./run.sh
cd ..
echo "Test repo created in ./sandbox"
echo "To install globaly run install.sh or add these lines to ~/.bashrc"
echo "export CUSTOM_CMD_TOOLS=$CUSTOM_CMD_TOOLS"
echo "alias auto=\"\$CUSTOM_CMD_TOOLS/bin/runner\""
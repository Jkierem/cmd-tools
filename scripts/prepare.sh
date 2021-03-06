CUSTOM_CMD_TOOLS=$(pwd)
mkdir ./sandbox
cd ./sandbox
git init
read -p "Provide a git user.name:" UNAME
read -p "Provide a git user.email:" UEMAIL
git config user.name $UNAME
git config user.email $UEMAIL
git commit --allow-empty -m "initial commit"
git checkout -b "development"
git commit --allow-empty -m "Test commit"
echo "deno run --allow-run --allow-read --allow-write ../runner.ts \"\$@\"" >> ./run.sh
cd ..
echo "Test repo created in ./sandbox"
echo "To install globaly run install.sh or add these lines to ~/.bashrc"
echo "export CUSTOM_CMD_TOOLS=$CUSTOM_CMD_TOOLS"
echo "alias auto=\"\$CUSTOM_CMD_TOOLS/bin/runner\""
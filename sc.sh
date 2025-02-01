cd /Users/chrisherre/Downloads/RivCoDelivery-main
rm -rf node_modules
npm install
git remote add origin https://github.com/ChristopherHerre/RivCoDelivery.git
git config --global user.email "cherre@student.rcc.edu"
git reset
git add .
echo "git commit -m: "
read user_input
git commit -m $user_input
echo "name of branch: "
git checkout -b $user_input
git push -u origin $user_input

cd /Users/chrisherre/Downloads/RivCo-Delivery-master
rm -rf node_modules
npm run build
git config --global user.email "cherre@student.rcc.edu"
git reset
git add .
echo "git commit -m: "
read user_input
git commit -m $user_input
echo "name of branch: "
git push -u origin https://github.com/ChristopherHerre/RivCoDelivery.git

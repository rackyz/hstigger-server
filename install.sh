echo "pull latest version server from git"
# git clone https://github.com/rackyz/hstigger-server
git pull --force
docker-compose build
docker-compose up -d

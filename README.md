# OAE-model-loader

## Install

* git clone git://github.com/sakaiproject/OAE-model-loader.git
* brew install node
* npm install canvas

## Add files

Add create the following folders & add image files to 

* `./data/pictures/users`
* `./data/pictures/worlds`

## Run

* node generate.js
* node loaddata.js <number of batches to load> <Sakai OAE Url> <admin password> <number of concurrent batches to load> <0 for no suites/interval for running the suites>
* node main.js
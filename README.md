# OAE-model-loader

## Install

* git clone git://github.com/sakaiproject/OAE-model-loader.git
* brew install node

## Add files

Create the following folders & add image files to 

* `./data/pictures/users`
* `./data/pictures/worlds`

## Run

* node generate.js -t <tenantId> -u <number of users to generate> -g <number of groups to generate> -c <number of content items to generate>
* node loaddata.js <number of batches to load> <Sakai OAE Url> <admin password> <number of concurrent batches to load> <0 for no suites/interval for running the suites>
* node main.js

The recommended batch size is:

* 1000 users
* 2000 groups
* 10000 content items
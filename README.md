# Open Academic Environment (OAE) Model Loader

## Install

* git clone git://github.com/oaeproject/OAE-model-loader.git
* brew install node

## Add files

Create the following folders & add image files to 

* `./data/pictures/users`
* `./data/pictures/worlds`

## Run

* node generate.js -b <number of batches> -t <tenant alias> -u <number of users to generate> -g <number of groups to generate> -c <number of content items to generate> -d <number of discussions to generate>
* node loaddata.js -b <last batch to load (exclusive)> -h <OAE url>
* node main.js

The recommended batch size is:

* 1000 users
* 2000 groups
* 10000 content items
* 1000 discussions
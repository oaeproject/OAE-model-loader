# Open Academic Environment (OAE) Model Loader

## Install

* git clone git://github.com/oaeproject/OAE-model-loader.git
* brew install node

## Add files

Create the following folders & add image files to 

* `./data/pictures/users`
* `./data/pictures/groups`
* `./data/content`

or alternatively download some [pre-packaged content](https://s3.amazonaws.com/oae-performance-files/model-loader-data.tar.gz), untar it and place the contents in the `data` directory

## Preparing the environment

* Ensure that you've disabled reCaptcha for the tenant where you're loading in users. It can be disabled in the admin UI under the `Principals` module.

## Run

* node generate.js -b <number of batches> -t <tenant alias> -u <number of users to generate> -g <number of groups to generate> -c <number of content items to generate> -d <number of discussions to generate>
* node loaddata.js -b <last batch to load (exclusive)> -h <OAE url>
* node main.js

Although you're free to choose the batch size, we've found that the following works pretty well:

* 1000 users
* 2000 groups
* 10000 content items
* 1000 discussions

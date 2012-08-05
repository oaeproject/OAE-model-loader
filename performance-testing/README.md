# Performance Testing Scripts

## package.js

The package generated from this script contains all data that is essential for performing re-runnable a performance tests against OAE. The package will have these directories:

### csv/

This directory contains the CSV input data that can be fed into load testing user sessions. JMeter and Tsung should both be able to make use of this data. It will have these files:

**users.csv:** Contains the username and password of all users in the system. It also contains OAE-specific request information for group memberships. If the user session visits the "My Memberships" page, this data is essential to generate an accurate request that is reflected on that page. If in the future the request structure changes for that page, those 2 columns will no longer be needed.

**can_accept.csv:** Contains all combinations of users that will successfully be able to accept a contact information from one another. This will feed into user sessions that accept contact invitations.

**can_invite.csv:** Contains all combinations of users who have no requested or accepted contact invitations. This feeds into user sessions that invite some user to become a contact.

### source/

This contains a snapshot of the `scripts/` and `data/` directory from the model-loader that were used to generate the CSV data in the `csv/` directory. This data completes the package in such a way that the package can be re-used at any time to:

1. Reload the content into an empty OAE server at a later date
2. Perform iterative data-loading into the OAE container (e.g., load one batch at a time over a long period of time using something like `node loaddata.js -s 5 -b 6`)
3. Regenerate the CSV files that will work on different subsets of batches that were loaded into the server (e.g., only batches 0-3. Want to increase the data? Load 2 more and generate for batches 0-5)

While data-sets can be re-loaded, since it takes so long, it is not expected this would be the regular way to load data for all new performance tests. Instead, the servers will be reloaded from back-ups of data that was previously loaded.

### Sample Usage

Here is how `package.js` can be used to package re-usable testing data:

```console
OAE-model-loader$ node generate.js -b 10
Generating Batch 0
Finished Generating Batch 0
=================================
Generating Batch 1
Finished Generating Batch 1
=================================
Generating Batch 2
Finished Generating Batch 2
=================================
Generating Batch 3
Finished Generating Batch 3
=================================
Generating Batch 4
Finished Generating Batch 4
=================================
Generating Batch 5
Finished Generating Batch 5
=================================
Generating Batch 6
Finished Generating Batch 6
=================================
Generating Batch 7
Finished Generating Batch 7
=================================
Generating Batch 8
Finished Generating Batch 8
=================================
Generating Batch 9
Finished Generating Batch 9
=================================


OAE-model-loader$ node performance-testing/package.js -b 10 -s .
Result will be output to: /Users/branden/.oae/mb-data/2012-Aug-05-9-3403
Copying all source scripts to ~/.oae/mb-data/2012-Aug-05-9-3403/source/scripts
Copying all source data to ~/.oae/mb-data/2012-Aug-05-9-3403/source/data
Generating load test input data in ~/.oae/mb-data/2012-Aug-05-9-3403/csv
Processing batch #0
Processing batch #1
Processing batch #2
Processing batch #3
Processing batch #4
Processing batch #5
Processing batch #6
Processing batch #7
Processing batch #8
Processing batch #9
Complete batch processing.
Done.


~/Source/sakai/oae/OAE-model-loader$ ls ~/.oae/mb-data/2012-Aug-05-9-3403/csv
can_accept.csv	can_invite.csv	users.csv


~/Source/sakai/oae/OAE-model-loader$ ls ~/.oae/mb-data/2012-Aug-05-9-3403/source/
data	scripts
```

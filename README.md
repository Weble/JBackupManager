# Backup Manager for Joomla

This NodeJS package is meant to be a quick and easy way to manage the backups of your joomla sites from a single place.
It relies on the awesome AkeebaBackup JSON API for the actual backup process. Take a look at the [features](#features "features") for a list of the amazing things that this software can do for you.

## Installation

Using `npm`:

	npm install jbackupmanager

You can also clone this repository into a directory and start working

## Features

- List all the Backups you want to take from a nice UI.
- Schedule the Backups anytime
- Download any backup file locally, even from Amazon S3
- Know when the next backup will be triggered
- Keep old backups, based on a quota limit

## Ideal Use

We use this package in our company, [Weble](http://www.weble.it), to **mantain the backups of our clients' sites**.
We have a server at our office which runs this package, and every time we build a new website for a client, we
add it to the list using the nice UI of the Backup Manager, and have the server trigger the backup and download a copy locally, 
storing older versions, just to be safe.

We also **integrate AkeebaBackup with Amazon S3**, so for each website we have a on-site copy, an S3 copy and a series of local copies.
This also makes both **testing and recovering of websites much easier**, since we don't ahve to download backups anymore, since we already
have every backup stored locally, without having to lose the advantage and the speed of the S3 cloud storage.
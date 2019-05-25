# PlaidSheets

![PlaidSheets](public/plaidsheets.png)
### A node app using Plaid APIs to get bank transactions into a Google Sheet

Based on [Plaid Quickstart](https://plaid.com/docs/quickstart) and adapted for my needs.

## Set environment variables

Create a .env file with the following contents.  Below I'll explain how to obtain or set these values.

```
PLAID_CLIENT_ID="xxx"
PLAID_SECRET="yyy"
PLAID_PUBLIC_KEY="zzz"
PLAID_ENV="development"

GSHEET_ID="xxxx_yyyyyyyy_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
GSHEET_TAB_NAME="2019 Taxes"

DEFAULT_ACCOUNT="1234"
NUMBER_OF_DAYS="10"
```

#### Plaid values
Obtain your Plaid keys [here](https://dashboard.plaid.com/account/keys).  Development mode is required to use real bank credentials.

#### Google Sheet values
The GSHEET items refer to the spreadsheet you want to write to.  The ID can be found in the URL when you're viewing the sheet in your browser.

Of course, it must be a Google Sheet that you have access to.  If you have several Google accounts, ensure you use the same account consistently throughout this process.

The new row(s) provided will be written (appended) to the spreadsheet, right after the last row of data.


#### Other values
`DEFAULT_ACCOUNT` indicates the last 4 digits of the account you wish to retrieve transactions for.

`NUMBER_OF_DAYS` indicates the number of days of transaction history to retrieve.  Note that processing transactions will not be included.

## Authenticate your bank via Plaid
1. As per usual, install node modules with ```npm install```
1. Run the app with ```node index.js```
1. Go to [http://localhost:8000](http://localhost:8000) and connect your bank account.
1. Upon success, a file called `plaid_token.json` will be created.  You should only have to do this once, unless the token expires, you want to connect a different bank, etc.
1. This was the only reason we needed to run PlaidSheets in the browser.  You can now kill it in the console as well.

## Turn on the Google Sheets API

1. Complete only Step 1 from [these instructions](https://developers.google.com/sheets/api/quickstart/nodejs).  You may have to explicitly set up a Google Cloud account and "product" (even if you only run locally).  If you have more than one Google account, ensure you are logged in as the right one when you do this step!
1. Upon success, a file called `credentials.json` will be downloaded to your machine.  Rename it to `gsheet_credentials.json` and move it to this folder.

## Authenticate the Google Sheets API
1. Now run PlaidSheets as a command-line script with `npm run updateSheet`
1. The first time you do this, it will direct you to a GSheet authentication flow.  Follow the given after "Authorize this app by visiting this url...".
1. Paste the code you get at that URL into the command-line.  This will create a file called `gsheet_token.json`.
1. The script will attempt to proceed.  If everything works, you'll get "Success!" in the console and an exit code of 0.

## Run the job again and again.  Automate all the things!
Now you have everything you need to run the job on a regular schedule.  It's recommended that you run it every x days, where x = NUMBER_OF_DAYS in the .env file.  Otherwise you may end up with duplicate transactions.

Personally, I run the included cronJob.sh every morning.  I'm on a Mac, so I'm using crontab:

1. In the console, type `crontab -e`.  Now you're in vim, and you can type something like this.  You can read more about the cron format [here](http://www.nncron.ru/help/EN/working/cron-format.htm).
```
* 7 * * * /FULL_PATH_TO_THIS_REPO/cronjob.sh /FULL_PATH_TO_THIS_REPO >> /FULL_PATH_TO_THIS_REPO/debug.log 2>&1
```
1. Observe the debug.log file to ensure everything works as planned.  Feel free to disable console logging (either in the code or in the cron job instructions) if desired.

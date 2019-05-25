# PlaidSheets

![PlaidSheets](img/plaidsheets.png)
### A node app using Plaid APIs to get bank transactions into a Google Sheet


Based on [Plaid Quickstart](https://plaid.com/docs/quickstart) and adapted for my needs.


Create a .env file with the following contents.  Obtain your own Plaid keys [here](https://dashboard.plaid.com/account/keys).  The GSHEET items refer to the spreadsheet you want to write to.  Of course, it must be a Google Sheet that you have access to!

```
PLAID_CLIENT_ID="xxx"
PLAID_SECRET="yyy"
PLAID_PUBLIC_KEY="zzz"
PLAID_ENV="development"
PLAID_PRODUCTS="transactions"

GSHEET_ID="xxxx_yyyyyyyy_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
GSHEET_TAB_NAME="2019 Taxes"
GSHEET_RANGE="D1:H1" #the columns matter, not the row
```

As per usual, install node modules:
```
npm install
```
 and run the app with:
```
npm install
```
or... if you have [nodemon](https://nodemon.io/):
```
nodemon ./index.js
```

1. Then go to [http://localhost:8000](http://localhost:8000) and connect your bank account.
1. Upon successfully doing so, a file called `plaid_token.json` will be created.  You should only have to do this once, unless the token expires, you want to connect a different account, etc etc.
1. At this point you can close PlaidSheets in the browser, and kill it in the console.
1. Complete only Step 1 from [these instructions](https://developers.google.com/sheets/api/quickstart/nodejs).  It requires setting up a Google Cloud account and "product" (even if you only run locally).  If you have more than one Google account, ensure you are logged in as the right one when you do it!
1. Upon successfully doing so, a file called `credentials.json` will be downloaded to your machine.  Rename it to `gsheet_credentials.json` and move it to this folder.  You should only have to do this once.
1. Now run PlaidSheets as a command-line script with `npm run updateSheet`
1. The first time you do this, it will direct you to a GSheet authentication flow.  Follow the given after "Authorize this app by visiting this url...".
1. Paste the code you get at that URL into the command-line.  This will create a file called `gsheet_token.json`.  You should only have to do this once, unless, well... you get the idea.

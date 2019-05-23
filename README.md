# PlaidSheets

![PlaidSheets](img/plaidsheets.png)
### A node app using Plaid APIs to get bank transactions into a Google Sheet


Based on [Plaid Quickstart](https://plaid.com/docs/quickstart) and adapted for my needs.


Create a .env file with the following contents.  Obtain your own keys [here](https://dashboard.plaid.com/account/keys).
```
PLAID_CLIENT_ID="CLIENT_ID"
PLAID_SECRET="SECRET"
PLAID_PUBLIC_KEY="PUBLIC_KEY"
PLAID_ENV="sandbox"
PLAID_PRODUCTS="transactions"
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

Then go to [http://localhost:8000](http://localhost:8000).

### Plaid reference material

#### [Quickstart documentation](https://plaid.com/docs/quickstart)
#### [Libraries](https://plaid.com/docs/libraries)

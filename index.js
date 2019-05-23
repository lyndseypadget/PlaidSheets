'use strict';

require('dotenv').config();

var util = require('util');

var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');

var APP_PORT = process.env.APP_PORT || 8000;
var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY;
var PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
var NUMBER_OF_DAYS = process.env.NUMBER_OF_DAYS ? parseInt(process.env.NUMBER_OF_DAYS) : 7;
var DEFAULT_ACCOUNT = process.env.DEFAULT_ACCOUNT;
var DAYS_TO_CACHE_ACCESS_TOKEN = process.env.DAYS_TO_CACHE_ACCESS_TOKEN ? parseInt(process.env.DAYS_TO_CACHE_ACCESS_TOKEN) : 7;

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
var PLAID_PRODUCTS = process.env.PLAID_PRODUCTS || 'transactions';

// We store the access_token in memory - in production, store it in a secure
// persistent data store
var ACCESS_TOKEN = null;
var PUBLIC_TOKEN = null;
var ITEM_ID = null;

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)
var client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV],
  {version: '2018-05-22'}
);

var app = express();
app.use(favicon(path.join(__dirname, 'favicon.png')))
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/', function(request, response, next) {
  response.render('index.ejs', {
    PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
    PLAID_ENV: PLAID_ENV,
    PLAID_PRODUCTS: PLAID_PRODUCTS,
    DAYS_TO_CACHE_ACCESS_TOKEN: DAYS_TO_CACHE_ACCESS_TOKEN
  });
});

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post('/get_access_token', function(request, response, next) {
  PUBLIC_TOKEN = request.body.public_token;
  client.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error,
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;
    prettyPrintResponse(tokenResponse);
    response.json({
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null,
    });
  });
});


// Retrieve Transactions for an Item
// https://plaid.com/docs/#transactions
app.get('/transactions', function(request, response, next) {
  var startDate = moment().subtract(NUMBER_OF_DAYS, 'days').format('YYYY-MM-DD');
  var endDate = moment().format('YYYY-MM-DD');
  client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
    count: 250,
    offset: 0,
  }, function(error, transactionsResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    } else {
      //Success
      var account_id;
      if(DEFAULT_ACCOUNT) {
        var matchingAcct = transactionsResponse.accounts.find((e) => {
          return e.mask === DEFAULT_ACCOUNT;
        });

        if(matchingAcct) {
          account_id = matchingAcct.account_id;
        } else {
          error = 'No account matches the provided mask.  Ensure you have set the last FOUR digits of the desired account correctly with DEFAULT_ACCOUNT="xxxx"';
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
      }

      var filteredTransactions = [];
      transactionsResponse.transactions.forEach((txn, idx) => {

        var dateParts = txn.date.split('-');
        txn.date = dateParts[1] + '/' + dateParts[2] + '/' + dateParts[0];

        txn.quarter = getQuarter(dateParts[1]);

        if((account_id && txn.account_id == account_id) || !account_id) {
          filteredTransactions.push(txn);
        }
      });
      transactionsResponse.transactions = filteredTransactions;
      prettyPrintResponse(transactionsResponse);
      response.json({error: null, transactions: transactionsResponse});
    }
  });
});

function getQuarter(month) {
  switch(month) {
    case '01':
    case '02':
    case '03':
      return '1';
    case '04':
    case '05':
    case '06':
      return '2';
    case '07':
    case '08':
    case '09':
      return '3';
    case '10':
    case '11':
    case '12':
      return '4';
  }
}

var server = app.listen(APP_PORT, function() {
  console.log('PlaidSheets is running on port ' + APP_PORT);
});

var prettyPrintResponse = response => {
  // console.log(util.inspect(response, {colors: true, depth: 4}));
};

app.post('/set_access_token', function(request, response, next) {
  ACCESS_TOKEN = request.body.access_token;
  client.getItem(ACCESS_TOKEN, function(error, itemResponse) {
    response.json({
      item_id: itemResponse.item.item_id,
      error: false,
    });
  });
});

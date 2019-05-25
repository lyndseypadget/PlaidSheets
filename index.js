'use strict';

require('dotenv').config();

const util = require('util');
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment');
const plaid = require('plaid');
const fs = require('fs');

const gSheet = require('./gsheet');

const APP_PORT = process.env.APP_PORT || 8000;
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const NUMBER_OF_DAYS = process.env.NUMBER_OF_DAYS ? parseInt(process.env.NUMBER_OF_DAYS) : 7;
const DEFAULT_ACCOUNT = process.env.DEFAULT_ACCOUNT;

var client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV],
  {version: '2018-05-22'}
);

const app = express();
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
    PLAID_PRODUCTS: 'transactions'
  });
});

app.post('/get_access_token', function(request, response, next) {
  let publicToken = request.body.public_token;
  client.exchangePublicToken(publicToken, function(error, tokenResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error,
      });
    }

    var contents = {
      access_token: tokenResponse.access_token,
      item_id: tokenResponse.item_id
    };

    fs.writeFile('./plaid_token.json', JSON.stringify(contents), function(err) {
      if(err) { return console.log(err); }
      console.log('plaid_token.json was created');
    });

    prettyPrintResponse(tokenResponse);
    response.json({
      access_token: tokenResponse.access_token,
      item_id: tokenResponse.item_id,
      error: null,
    });
  });
});

app.post('/set_access_token', function(request, response, next) {
  let accessToken = request.body.access_token;
  client.getItem(accessToken, function(error, itemResponse) {
    response.json({
      item_id: itemResponse.item.item_id,
      error: false,
    });
  });
});

var server = app.listen(APP_PORT, function() {
  console.log('PlaidSheets is running on port ' + APP_PORT);
});

var prettyPrintResponse = response => {
  // console.log(util.inspect(response, {colors: true, depth: 4}));
};

function getTransactions() {
  fs.readFile('plaid_token.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    let accessTokenObj = JSON.parse(content);

    var startDate = moment().subtract(NUMBER_OF_DAYS, 'days').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    client.getTransactions(accessTokenObj.access_token, startDate, endDate, {
      count: 250,
      offset: 0,
    }, function(error, transactionsResponse) {
      if (error != null) {
        prettyPrintResponse(error);
        process.exit(1);
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
            process.exit(1);
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

        gSheet.writeToSheet(transactionsResponse.transactions);
      }
    });

  });
};

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

module.exports = { getTransactions };

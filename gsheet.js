const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'gsheet_token.json';
const GSHEET_ID = process.env.GSHEET_ID;
const GSHEET_TAB_NAME = process.env.GSHEET_TAB_NAME;

function writeToSheet(transactions) {
  fs.readFile('gsheet_credentials.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file:', err);
      process.exit(1);
    }
    authorize(JSON.parse(content), (auth) => {

      let values = [];

      transactions.reverse(); //txns are ordered newest to oldest, but with append we want newest at bottom

      // ------------------------------------------------
      // Customize your transaction spreadsheet data here
      // ------------------------------------------------
      transactions.forEach((txn, idx) => {
        let row = [];
        let amount = 0 - parseFloat(txn.amount);  //debits should be negative and credits positive

        row.push(txn.quarter);
        row.push(txn.date);
        row.push(txn.name);
        if(amount > 0) {
          //INCOME
          row.push(amount);  //amount goes in column D
          row.push(0);
          row.push(parseFloat(amount*0.65).toFixed(2));
          row.push(parseFloat(amount*0.15).toFixed(2));
          row.push(parseFloat(amount*0.20).toFixed(2));
          values.push(row);
        } else if (amount < 0) {
          //EXPENSE
          if(txn.name.startsWith('Online scheduled transfer to CHK ')) {
            row.push('');
            row.push('');
            row.push(amount); //amount goes in column F
            row.push('');
            row.push('');
          } else {
            row.push('');
            row.push('');
            row.push('');
            row.push('');
            row.push(amount); //amount goes in column H
          }
          values.push(row);
        } else {
          // 0 amounts do not get written to the sheet at all
        }
      });

      const resource = {
        values,
      };

      const sheets = google.sheets({version: 'v4', auth});
      sheets.spreadsheets.values.append({
        spreadsheetId: GSHEET_ID,
        range: GSHEET_TAB_NAME,
        valueInputOption: 'USER_ENTERED',
        resource: resource
      }, (err, res) => {
        if (err) {
          console.log('The API returned an error: ' + err);
          process.exit(1);
        } else {
          console.log('Success!');
          process.exit(0);
        }
      });
    });
  });
}

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oAuth2Client, callback);
    } else {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    }
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error while trying to retrieve access token', err);
        process.exit(1);
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

module.exports = { writeToSheet };

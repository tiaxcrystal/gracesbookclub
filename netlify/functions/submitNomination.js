const { google } = require('googleapis');

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1WFoa1y-byiCyWb09xKifph6Nzs_9iSCx05fgR9edUbE';
const SHEET_NAME = 'Suggested Book List';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, author, genre, link } = JSON.parse(event.body || '{}');

    if (!title || !author || !genre || !link) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // Get current sheet data to calculate next ID
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    });

    const ids = res.data.values ? res.data.values.map(row => parseInt(row[0], 10)) : [];
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;

    // Append new nomination
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[nextId, title, author, genre, link, 0]],
      },
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Error adding nomination:', err);
    return { statusCode: 500, body: 'Error adding nomination' };
  }
};

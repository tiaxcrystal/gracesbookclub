// netlify/functions/getPastBooks.js
const { google } = require('googleapis');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.BOOKLIST_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'BOOKLIST_SPREADSHEET_ID not set' }) };
    }

    // Assumes the tab is named "Book List" and columns are:
    // A: Titles, B: Link, C: Month, D: Picture, E: Picture Link
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Book List!A2:E' // grab everything under headers
    });

    const rows = res.data.values || [];

    // map rows to objects with safe defaults
    const items = rows.map(r => ({
      title: (r[0] || '').toString().trim(),
      link: (r[1] || '').toString().trim(),
      month: (r[2] || '').toString().trim(),
      picture: (r[3] || '').toString().trim(),       // could be image URL or filename
      pictureLink: (r[4] || '').toString().trim()    // optional link target for image
    })).filter(item => item.title); // drop totally blank rows

    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error('getPastBooks error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch past books.' })
    };
  }
};

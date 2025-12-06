const { google } = require('googleapis');

exports.handler = async function(event, context) {
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

    // Read column A from "Book List"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Book List!A:A'
    });

    const rows = response.data.values || [];

    // Remove header row
    const titles = rows.slice(1).map(r => r[0]).filter(Boolean);

    return {
      statusCode: 200,
      body: JSON.stringify(titles)
    };
  } catch (err) {
    console.error('Error fetching book list:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch book list' })
    };
  }
};

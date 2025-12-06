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
    const spreadsheetId = process.env.RATINGS_SPREADSHEET_ID; // Book List spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Book List!A:A' // column A contains titles
    });

    const rows = response.data.values || [];

    // Skip header row and remove any empty rows
    const books = rows.slice(1).map(r => r[0]).filter(Boolean);

    return {
      statusCode: 200,
      body: JSON.stringify(books)
    };
  } catch (err) {
    console.error('Error fetching book list:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch book list' })
    };
  }
};

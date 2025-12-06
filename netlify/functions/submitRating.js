const { google } = require('googleapis');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { book, rating } = JSON.parse(event.body);

    if (!book || !rating) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Book and rating required.' }) };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.RATINGS_SPREADSHEET_ID;

    // Append a new row: Timestamp will auto-fill in Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Ratings!A:C',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[new Date().toISOString(), book, rating]]
      }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not submit rating.' }) };
  }
};

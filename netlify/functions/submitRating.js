const { google } = require('googleapis');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { book, rating } = JSON.parse(event.body);

    if (!book || !rating) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Book and rating are required.' })
      };
    }

    // Load Google service account credentials from environment
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.RATINGS_SPREADSHEET_ID;

    // Append row: timestamp | book | rating
    const timestamp = new Date().toISOString();
    const values = [[timestamp, book, rating]];

    console.log('Appending to spreadsheet:', values);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Ratings!A:C',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Error appending rating:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not submit rating.' })
    };
  }
};

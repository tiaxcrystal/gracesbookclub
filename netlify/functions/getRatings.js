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
    const spreadsheetId = process.env.RATINGS_SPREADSHEET_ID;

    // Get all rows from "Ratings"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Ratings!B:C' // Column B: Book, Column C: Rating
    });

    const rows = response.data.values || [];

    // Map rows to objects { book, rating }
    const ratings = rows.map(r => ({
      book: r[0] || '',
      rating: r[1] ? parseFloat(r[1]) : null
    })).filter(r => r.book && r.rating !== null);

    return {
      statusCode: 200,
      body: JSON.stringify(ratings)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch ratings.' })
    };
  }
};

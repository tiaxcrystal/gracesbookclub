const { google } = require('googleapis');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Authenticate with service account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.RATINGS_SPREADSHEET_ID;

    // Read all rows from 'Form Responses 1'
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Form Responses 1!A:B' // adjust if columns are different
    });

    const rows = response.data.values || [];

    if (rows.length < 2) {
      // No data besides headers
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    // Convert to array of objects, skipping header row
    const [header, ...dataRows] = rows;
    const bookIdx = header.indexOf('Book'); // column header for book
    const ratingIdx = header.indexOf('Rating'); // column header for rating

    const result = dataRows.map(r => ({
      book: r[bookIdx] || '',
      rating: r[ratingIdx] || ''
    }));

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch ratings.' }) };
  }
};

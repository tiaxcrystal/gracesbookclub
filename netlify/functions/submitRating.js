const { google } = require('googleapis');

exports.handler = async function(event, context) {
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

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Rating must be a number between 1 and 5.' })
      };
    }

    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SUGGEST_SPREADSHEET_ID;

    // Append row: [Book title, Rating]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Form Responses 1!A:B',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[book, ratingNum]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not submit rating.' })
    };
  }
};

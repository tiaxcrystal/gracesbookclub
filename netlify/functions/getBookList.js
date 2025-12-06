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
    const spreadsheetId = '1-86BOIuWOeINJVJkNojHo-c1T3Ygxm1AgLyedEplgvY';

    // Get the Title column (B) from the Book List tab
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Book List!B2:B' // skip header row
    });

    const rows = res.data.values || [];
    const titles = rows.map(r => r[0]).filter(Boolean); // only non-empty titles

    return {
      statusCode: 200,
      body: JSON.stringify(titles)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch book list.' })
    };
  }
};

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

    // Read columns B and C (Book and Rating) from "Ratings"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Ratings!B:C'
    });

    const rows = response.data.values || [];

    // Skip header row
    const data = rows.slice(1);

    const totals = {};
    const counts = {};

    data.forEach(row => {
      const [book, rating] = row;
      if (!book || !rating) return;
      const num = parseFloat(rating);
      if (isNaN(num)) return;
      totals[book] = (totals[book] || 0) + num;
      counts[book] = (counts[book] || 0) + 1;
    });

    const averages = Object.keys(totals).map(book => ({
      book,
      avg: totals[book] / counts[book],
      count: counts[book]
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(averages)
    };
  } catch (err) {
    console.error('Error fetching averages:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch averages' })
    };
  }
};

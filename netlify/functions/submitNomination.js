const { google } = require('googleapis');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, link } = JSON.parse(event.body);

    if (!title || !link) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Title and link are required.' })
      };
    }

    // Optional: simple URL validation
    try {
      const url = new URL(link);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid URL.' })
      };
    }

    // Load Google service account credentials from environment
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SUGGEST_SPREADSHEET_ID;

    // Append row: title | author (blank) | genre (blank) | link | votes (0)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Suggested Book List!A:E',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[title, '', '', link, 0]]
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
      body: JSON.stringify({ error: 'Could not submit nomination.' })
    };
  }
};

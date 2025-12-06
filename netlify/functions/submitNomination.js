const { google } = require('googleapis');
const crypto = require('crypto'); // for UUID generation

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

    // Simple URL validation
    try {
      const url = new URL(link);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid URL.' })
      };
    }

    // Generate a unique ID for column A
    const id = crypto.randomUUID();

    // Load Google service account credentials from environment
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SUGGEST_SPREADSHEET_ID;

    // Append row in proper column order:
    // A: ID | B: Title | C: Author (blank) | D: Genre (blank) | E: Link | F: Votes (0)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Suggested Book List!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[id, title, '', '', link, 0]]
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

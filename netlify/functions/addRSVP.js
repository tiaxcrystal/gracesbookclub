const { google } = require('googleapis');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SHEET_ID = '1ojGEBABMUB0-p1vKd0er03PbapHd3ZXWB3KlyrkowmY';
  const RANGE = 'RSVPs!A:B'; // Columns A = Name, B = Bringing

  try {
    const body = JSON.parse(event.body);
    const { name, bringing } = body;

    if (!name || !bringing) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and Bringing required' }) };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, bringing]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'RSVP added' })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add RSVP' })
    };
  }
};

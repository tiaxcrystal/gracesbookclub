const { google } = require('googleapis');

exports.handler = async function(event, context) {
  const SHEET_ID = '1ojGEBABMUB0-p1vKd0er03PbapHd3ZXWB3KlyrkowmY';
  const RANGE = 'RSVPs!A2:B'; // Names in A, Bringing in B

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({version:'v4', auth});
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const values = response.data.values || [];
    const rsvps = values.map(([name, bringing]) => ({ name, bringing }));

    return {
      statusCode: 200,
      body: JSON.stringify(rsvps),
    };

  } catch(err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch RSVPs' }),
    };
  }
};

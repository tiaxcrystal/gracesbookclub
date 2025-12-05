const { google } = require('googleapis');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const data = JSON.parse(event.body);

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    let spreadsheetId;
    if (data.formType === 'rsvp') spreadsheetId = process.env.RSVP_SPREADSHEET_ID;
    else if (data.formType === 'suggest') spreadsheetId = process.env.SUGGEST_SPREADSHEET_ID;
    else if (data.formType === 'rate') spreadsheetId = process.env.RATE_SPREADSHEET_ID;

    const sheetName = 'Sheet1'; // change if your tab is named differently
    const row = Object.values(data);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return { statusCode: 200, body: 'Form submitted successfully!' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error writing to sheet' };
  }
};

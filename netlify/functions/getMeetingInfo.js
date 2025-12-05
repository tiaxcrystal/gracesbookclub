// getMeetingInfo.js
import { google } from 'googleapis';

export async function handler() {
  try {
    // Parse the service account JSON stored in Netlify env variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // TODO: Replace with your actual Sheet ID and range
    const SHEET_ID = '1ojGEBABMUB0-p1vKd0er03PbapHd3ZXWB3KlyrkowmY';
    const RANGE = 'MeetingInfo!A2:B2'; // assumes A = Date, B = Theme

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const values = response.data.values?.[0] || [];
    const date = values[0] || 'TBD';
    const theme = values[1] || 'No theme set';

    return {
      statusCode: 200,
      body: JSON.stringify({ date, theme }),
    };
  } catch (error) {
    console.error('Error fetching meeting info:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch meeting info' }),
    };
  }
}

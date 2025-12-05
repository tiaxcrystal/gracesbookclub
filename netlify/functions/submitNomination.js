import { google } from 'googleapis';

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);

    const { title, author, genre, link } = body;

    if (!title || !author || !genre || !link) {
      return { statusCode: 400, body: 'Missing fields' };
    }

    // Use the environment variable
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const client = new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const gsapi = google.sheets({ version: 'v4', auth: client });

    const SPREADSHEET_ID = process.env.SUGGEST_SPREADSHEET_ID;
    const RANGE = 'Suggested Book List!A:F';

    await gsapi.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          '', // ID, can leave blank or auto-generate
          title,
          author,
          genre,
          link,
          0 // votes start at 0
        ]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Nomination added!' })
    };

  } catch (error) {
    console.error('Error in submitNomination:', error);
    return { statusCode: 500, body: 'Error adding nomination' };
  }
}

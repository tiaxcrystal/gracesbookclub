// getNominations.js
import { google } from 'googleapis';

export async function handler(event, context) {
  try {
    // Load service account credentials from environment variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Spreadsheet info
    const spreadsheetId = '1WFoa1y-byiCyWb09xKifph6Nzs_9iSCx05fgR9edUbE';
    const range = 'Suggested Book List!A2:F'; // skip header row

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    // Convert each row into an object
    const data = rows.map((row) => ({
      id: row[0] || '',
      title: row[1] || '',
      author: row[2] || '',
      genre: row[3] || '',
      link: row[4] || '',
      votes: parseInt(row[5], 10) || 0,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Error fetching nominations:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch nominations' }),
    };
  }
}

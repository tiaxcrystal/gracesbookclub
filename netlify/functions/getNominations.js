// netlify/functions/getNominations.js
// Reads nominations from Google Sheets. Local dev convenience:
// - If process.env.GOOGLE_SERVICE_ACCOUNT exists, it will use that.
// - Otherwise (local dev), it will try to read a file at repository root named "service-account.json".

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function loadServiceAccount() {
  // 1) prefer env var (production)
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    } catch (err) {
      console.warn('GOOGLE_SERVICE_ACCOUNT env var present but JSON parse failed:', err.message);
    }
  }

  // 2) fallback: read service-account.json from repo root (local dev convenience)
  try {
    const candidate = path.resolve(__dirname, '..', 'service-account.json');
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read service-account.json fallback:', err && err.message);
  }

  // nothing found
  return null;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.error('No Google service account credentials found. For local dev, place service-account.json in project root. For production, set GOOGLE_SERVICE_ACCOUNT environment variable.');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Google credentials' }) };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SUGGEST_SPREADSHEET_ID || '1WFoa1y-byiCyWb09xKifph6Nzs_9iSCx05fgR9edUbE';
    const range = 'Suggested Book List!A2:F'; // data rows only

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = (response && response.data && response.data.values) ? response.data.values : [];

    const data = rows.map((row) => ({
      id: row[0] || '',
      title: row[1] || '',
      author: row[2] || '',
      genre: row[3] || '',
      link: row[4] || '',
      votes: Number.isFinite(Number(row[5])) ? parseInt(row[5], 10) : 0
    }));

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('getNominations (Sheets) error:', err && err.stack ? err.stack : err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch nominations' }) };
  }
};

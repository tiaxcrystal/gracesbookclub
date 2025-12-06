// netlify/functions/submitNomination.js
const { google } = require('googleapis');
const crypto = require('crypto');

const SPREADSHEET_ID = process.env.SUGGEST_SPREADSHEET_ID;
/**
 * Expect body: { title, author, genre, link }
 */
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success:false, error:'Method Not Allowed' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode:400, body: JSON.stringify({ success:false, error:'Invalid JSON' }) };
  }

  const title = (body.title || '').toString().trim();
  const author = (body.author || '').toString().trim();
  const genre = (body.genre || '').toString().trim();
  const link = (body.link || '').toString().trim();

  if (!title || !author || !genre || !link) {
    return { statusCode:400, body: JSON.stringify({ success:false, error:'All fields required' }) };
  }

  // Basic URL validation
  try {
    const url = new URL(link);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (e) {
    return { statusCode:400, body: JSON.stringify({ success:false, error:'Link must be a valid URL starting with http:// or https://' }) };
  }

  if (!SPREADSHEET_ID) {
    return { statusCode:500, body: JSON.stringify({ success:false, error:'SUGGEST_SPREADSHEET_ID not configured' }) };
  }

  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const id = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');

    const values = [[ id, title, author, genre, link, 0 ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Suggested Book List!A:F',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });

    return { statusCode:200, body: JSON.stringify({ success:true, id }) };
  } catch (err) {
    console.error('submitNomination error:', err);
    return { statusCode:500, body: JSON.stringify({ success:false, error:'Server error', details: err.message || String(err) }) };
  }
};

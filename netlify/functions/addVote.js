// netlify/functions/addVote.js
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SUGGEST_SPREADSHEET_ID || '1WFoa1y-byiCyWb09xKifph6Nzs_9iSCx05fgR9edUbE';
const SHEET_NAME = 'Suggested Book List'; // tab name

function normalizeTitle(title) {
  if (title === null || title === undefined) return '';
  return String(title)
    .replace(/[\u200B-\u200F\uFEFF]/g, '') // remove zero-width / BOM
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function getAuthClient() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function readAllRows(sheets) {
  const range = `${SHEET_NAME}!A2:F`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows = res.data.values || [];
  // rows are arrays: [ID, Title, Author, Genre, Link, Votes]
  return rows;
}

function sortNominations(arr) {
  // arr items: { id, title, author, genre, link, votes, rowIndex }
  arr.sort((a,b) => {
    const va = Number(a.votes || 0);
    const vb = Number(b.votes || 0);
    if (vb !== va) return vb - va;
    return (a.title || '').localeCompare(b.title || '');
  });
  return arr;
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success:false, error: 'Method Not Allowed' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) { return { statusCode:400, body: JSON.stringify({ success:false, error:'Invalid JSON' }) }; }

  const submitted = (body.submitted === undefined || body.submitted === null) ? '' : String(body.submitted).trim();

  if (!submitted) {
    return { statusCode:400, body: JSON.stringify({ success:false, error: 'No submission provided' }) };
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const rows = await readAllRows(sheets); // 2D array
    // map into objects preserving original sheet row number
    const nominations = rows.map((r, idx) => ({
      id: r[0] ? String(r[0]) : '',
      title: r[1] || '',
      author: r[2] || '',
      genre: r[3] || '',
      link: r[4] || '',
      votes: Number(r[5] || 0),
      rowNumber: idx + 2 // sheet row number for updates (A2 is row 2)
    }));

    // helper to increment votes for a given rowNumber
    async function incrementRowVotes(rowNumber) {
      // read current value to avoid race? We'll just set = old + 1 by reading local nominations array.
      const found = nominations.find(x => x.rowNumber === rowNumber);
      const newVotes = (found ? Number(found.votes || 0) : 0) + 1;
      const range = `${SHEET_NAME}!F${rowNumber}`; // Votes column is F
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newVotes]] }
      });
      return newVotes;
    }

    const normSubmitted = normalizeTitle(submitted);

    // 1) If submitted exactly matches an ID
    if (submitted && submitted.indexOf('-') !== -1) { // heuristic: UUID-like
      const match = nominations.find(n => n.id === submitted);
      if (match) {
        const newVotes = await incrementRowVotes(match.rowNumber);
        return { statusCode:200, body: JSON.stringify({ success:true, method:'id', id: match.id, title: match.title, votes: newVotes }) };
      }
    }

    // 2) If submitted is an integer -> treat as 1-based index into sorted nominations
    if (/^\s*\d+\s*$/.test(submitted)) {
      const idx = parseInt(submitted, 10);
      // sort nominations by votes desc then title
      const sorted = sortNominations([...nominations]);
      if (idx >= 1 && idx <= sorted.length) {
        const chosen = sorted[idx - 1];
        const newVotes = await incrementRowVotes(chosen.rowNumber);
        return { statusCode:200, body: JSON.stringify({ success:true, method:'index', index: idx, id: chosen.id, title: chosen.title, votes: newVotes }) };
      } else {
        return { statusCode:400, body: JSON.stringify({ success:false, error:'Index out of range', max: sorted.length }) };
      }
    }

    // 3) exact normalized title match
    for (let i = 0; i < nominations.length; i++) {
      if (normalizeTitle(nominations[i].title) === normSubmitted) {
        const newVotes = await incrementRowVotes(nominations[i].rowNumber);
        return { statusCode:200, body: JSON.stringify({ success:true, method:'title', id: nominations[i].id, title: nominations[i].title, votes: newVotes }) };
      }
    }

    // 4) startsWith/includes fuzzy matching
    for (let i = 0; i < nominations.length; i++) {
      const key = normalizeTitle(nominations[i].title);
      if (key.startsWith(normSubmitted) || normSubmitted.startsWith(key) || key.indexOf(normSubmitted) !== -1 || normSubmitted.indexOf(key) !== -1) {
        const newVotes = await incrementRowVotes(nominations[i].rowNumber);
        return { statusCode:200, body: JSON.stringify({ success:true, method:'fuzzy', id: nominations[i].id, title: nominations[i].title, votes: newVotes }) };
      }
    }

    // Not found
    return { statusCode:404, body: JSON.stringify({ success:false, error:'Book not found', submitted }) };

  } catch (err) {
    console.error('addVote error:', err);
    return { statusCode:500, body: JSON.stringify({ success:false, error: 'Server error', details: (err && err.message) ? err.message : String(err) }) };
  }
};

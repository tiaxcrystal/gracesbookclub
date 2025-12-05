// netlify/functions/rsvp.js
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  const { name, bringing } = data;

  if (!name || !bringing) {
    return { statusCode: 400, body: 'Missing name or bringing field' };
  }

  // Here you would normally write to a database or spreadsheet
  // For now, just simulate success
  console.log(`RSVP received: ${name} - ${bringing}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'RSVP recorded successfully!' }),
  };
}

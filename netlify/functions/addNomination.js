const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { title, author, genre, link } = JSON.parse(event.body);
  if (!title || !author || !genre || !link) return { statusCode: 400, body: 'Missing fields' };

  const data = JSON.parse(fs.readFileSync(dataPath));
  data.nominations.push({ title, author, genre, link, votes: 0 });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  return { statusCode: 200, body: 'Nomination added!' };
};

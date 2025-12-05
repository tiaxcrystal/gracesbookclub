const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { title } = JSON.parse(event.body);
  if (!title) return { statusCode: 400, body: 'Missing title' };

  const data = JSON.parse(fs.readFileSync(dataPath));
  const nom = data.nominations.find(n => n.title === title);
  if (!nom) return { statusCode: 404, body: 'Nomination not found' };

  nom.votes += 1;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  return { statusCode: 200, body: 'Vote added!' };
};

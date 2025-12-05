const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { book, rating } = JSON.parse(event.body);
  if (!book || !rating) return { statusCode: 400, body: 'Missing fields' };

  const data = JSON.parse(fs.readFileSync(dataPath));
  if (!data.ratings[book]) data.ratings[book] = [];
  data.ratings[book].push(parseInt(rating, 10));

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  return { statusCode: 200, body: 'Rating submitted!' };
};

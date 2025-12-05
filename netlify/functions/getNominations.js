const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

exports.handler = async function() {
  const data = JSON.parse(fs.readFileSync(dataPath));
  return { statusCode: 200, body: JSON.stringify(data.nominations) };
};

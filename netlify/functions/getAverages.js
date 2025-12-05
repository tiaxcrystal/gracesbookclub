const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

exports.handler = async function() {
  const data = JSON.parse(fs.readFileSync(dataPath));
  const averages = Object.entries(data.ratings).map(([book, ratings]) => {
    const sum = ratings.reduce((a,b) => a+b, 0);
    const avg = ratings.length ? sum / ratings.length : 0;
    return { book, avg, count: ratings.length };
  });
  return { statusCode: 200, body: JSON.stringify(averages) };
};

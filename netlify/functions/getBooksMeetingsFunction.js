// netlify/functions/getBooksMeetingsFunction.js
const { getBooksMeetings } = require('../../supabase/getBooksMeetings.js'); // adjust path if needed

exports.handler = async function(event) {
  try {
    const data = await getBooksMeetings();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Netlify function error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to fetch meetings' }) 
    };
  }
};

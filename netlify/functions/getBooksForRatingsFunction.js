// netlify/functions/getBooksForRatingsFunction.js
const { supabase } = require('../../supabase/supabaseClient.js');

exports.handler = async function () {
  try {
    const { data, error } = await supabase
      .from('books_meetings')
      .select('meeting_number, title')
      .order('meeting_number', { ascending: false }); // current book first

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Supabase error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

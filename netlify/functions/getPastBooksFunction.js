// netlify/functions/getPastBooksFunction.js
const { getSupabaseAdmin } = require('../../supabase/supabaseClient.js');

exports.handler = async function () {
  try {
    const supabase = getSupabaseAdmin(); // runtime-safe admin client

    // Fetch all books/meetings ordered by meeting number descending (current first)
    const { data, error } = await supabase
      .from('books_meetings')
      .select('*')
      .order('meeting_number', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch books/meetings' })
      };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected server error' }) };
  }
};

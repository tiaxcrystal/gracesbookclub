const { supabase } = require('../../supabase/supabaseClient.js');

exports.handler = async function(event) {
  try {
    const { data, error } = await supabase
      .from('books_meetings')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error) {
      console.error('Error fetching current meeting:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch current meeting' }) };
    }

    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No active meeting found' }) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
};

// netlify/functions/getBooksFunction.js
const { supabase } = require('../../supabase/supabaseClient.js');

exports.handler = async function () {
  try {
    console.log('getBooksFunction called');

    const { data, error } = await supabase
      .from('books_meetings')
      .select('meeting_number, title')
      .order('meeting_number', { ascending: false });

    if (error) {
      console.error('Supabase error fetching books:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    console.log('Books fetched for ratings dropdown:', data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Unexpected error in getBooksFunction:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error' })
    };
  }
};

// netlify/functions/submitRatingFunction.js
const { supabase } = require('../../supabase/supabaseClient');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { book_number, rating } = JSON.parse(event.body);

    if (!book_number || !rating) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing book_number or rating' })
      };
    }

    const { error } = await supabase
      .from('ratings')
      .insert([
        {
          book_number: Number(book_number),
          rating: Number(rating)
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to insert rating' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('submitRatingFunction error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error' })
    };
  }
};

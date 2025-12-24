const { getSupabaseAdmin } = require('../supabaseClient');

exports.handler = async (event) => {
  try {
    const supabase = getSupabaseAdmin(); // runtime-safe admin client

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { title, goodreads } = JSON.parse(event.body);

    if (!title || !goodreads) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const { error } = await supabase
      .from('vote')
      .insert([
        {
          title: title.trim(),
          goodreads: goodreads.trim()
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database insert failed' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('submitSuggestionFunction error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {
  try {
    const { data, error } = await supabase
      .from('vote')
      .select(`
        uuid,
        title,
        goodreads,
        vote_count:vote_count(count)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching suggestions:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch suggestions' })
      };
    }

    const results = data.map(row => ({
      uuid: row.uuid,
      title: row.title,
      goodreads: row.goodreads,
      votes: row.vote_count?.[0]?.count || 0
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (err) {
    console.error('getSuggestionsFunction error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};

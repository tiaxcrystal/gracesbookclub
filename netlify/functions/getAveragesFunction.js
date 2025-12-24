const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {
  try {
    /**
     * Pull all books, LEFT JOIN ratings
     * so books with zero ratings still appear.
     */
    const { data, error } = await supabase
      .from('books_meetings')
      .select(`
        meeting_number,
        title,
        goodreads,
        ratings (
          rating
        )
      `)
      .order('meeting_number', { ascending: false });

    if (error) throw error;

    const results = data.map(book => {
      const ratings = book.ratings || [];
      const count = ratings.length;

      const avg =
        count > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
          : null;

      return {
        book_number: book.meeting_number, // 👈 Added for carousel
        book: book.title,
        url: book.goodreads,
        avg: avg ? Math.round(avg * 10) / 10 : null, // one decimal
        count
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error('getAveragesFunction error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

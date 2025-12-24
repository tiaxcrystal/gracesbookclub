// netlify/functions/getRatingsFunction.js
const { supabase } = require('../../supabase/supabaseClient.js');

exports.handler = async function() {
  try {
    // Get all books with their average rating and count
    const { data, error } = await supabase
      .from('ratings')
      .select('rating, book_number')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch ratings' }) };
    }

    // Fetch book titles for each rating
    const { data: booksData, error: booksError } = await supabase
      .from('books_meetings')
      .select('meeting_number, title')
      .order('meeting_number', { ascending: false }); // current book first

    if (booksError) {
      console.error('Supabase fetch books error:', booksError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch books' }) };
    }

    // Map meeting_number → title
    const bookMap = {};
    booksData.forEach(b => { bookMap[b.meeting_number] = b.title; });

    // Calculate averages
    const summary = {};
    data.forEach(r => {
      const title = bookMap[r.book_number] || '(unknown book)';
      if (!summary[title]) summary[title] = { total: 0, count: 0 };
      summary[title].total += r.rating;
      summary[title].count += 1;
    });

    const result = Object.keys(summary).map(title => ({
      book: title,
      avg: summary[title].total / summary[title].count,
      count: summary[title].count
    }));

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected server error' }) };
  }
};

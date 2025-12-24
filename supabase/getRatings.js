// supabase/getRatings.js
const { supabase } = require('./supabaseClient.js');

/**
 * Returns an array of books with their average rating and rating count
 */
async function getRatings() {
  const { data, error } = await supabase
    .from('ratings')
    .select('book_number, rating');

  if (error) {
    console.error('Error fetching ratings:', error);
    return [];
  }

  // Compute averages and counts per book_number
  const ratingsMap = {};
  data.forEach(row => {
    if (!ratingsMap[row.book_number]) {
      ratingsMap[row.book_number] = { sum: 0, count: 0 };
    }
    ratingsMap[row.book_number].sum += row.rating;
    ratingsMap[row.book_number].count += 1;
  });

  // Convert to array
  const result = Object.keys(ratingsMap).map(book_number => ({
    book_number: parseInt(book_number),
    avg: ratingsMap[book_number].sum / ratingsMap[book_number].count,
    count: ratingsMap[book_number].count
  }));

  return result;
}

module.exports = { getRatings };

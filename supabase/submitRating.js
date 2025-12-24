// supabase/submitRating.js
const { supabase } = require('./supabaseClient.js');

async function submitRating(bookNumber, rating) {
  if (!bookNumber || rating < 1 || rating > 5) {
    throw new Error('Invalid book number or rating');
  }

  const { data, error } = await supabase
    .from('ratings')
    .insert([{ book_number: bookNumber, rating }]);

  if (error) {
    console.error('Error inserting rating:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

module.exports = { submitRating };

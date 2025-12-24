// supabase/getBooksMeetings.js
const { supabase } = require('./supabaseClient.js');

async function getBooksMeetings() {
  const { data, error } = await supabase
    .from('books_meetings')
    .select('*')
    .order('meeting', { ascending: false });

  if (error) {
    console.error('Error fetching books & meetings:', error);
    return [];
  }

  return data;
}

module.exports = { getBooksMeetings };

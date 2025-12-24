// supabase/getCurrentMeeting.js
const { supabase } = require('./supabaseClient.js');

async function getCurrentMeeting() {
  const { data, error } = await supabase
    .from('books_meetings')
    .select('meeting_number, meeting, theme, additional_info')
    .order('meeting', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching current meeting:', error);
    return null;
  }

  return data;
}

module.exports = { getCurrentMeeting };

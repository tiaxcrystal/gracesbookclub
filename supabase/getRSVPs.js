const { supabase } = require('./supabaseClient.js');

async function getRSVPs(meetingNumber) {
  const { data, error } = await supabase
    .from('rsvp')
    .select('*')
    .eq('meeting_number', meetingNumber)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching RSVPs:', error);
    return [];
  }

  return data;
}

module.exports = { getRSVPs };

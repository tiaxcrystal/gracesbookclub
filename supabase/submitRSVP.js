// supabase/submitRSVP.js
const { supabase } = require('./supabaseClient.js');

async function submitRSVP({ meeting_number, name, bringing }) {
  const { error } = await supabase
    .from('rsvp')
    .insert([{ meeting_number, name, bringing }]);

  if (error) {
    console.error('Error inserting RSVP:', error);
    throw error;
  }

  return true;
}

module.exports = { submitRSVP };

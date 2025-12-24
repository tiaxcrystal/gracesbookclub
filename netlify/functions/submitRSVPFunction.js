// netlify/functions/submitRSVPFunction.js
const { getSupabaseAdmin } = require('../../supabase/supabaseClient.js');

exports.handler = async function(event) {
  const supabaseAdmin = getSupabaseAdmin(); // runtime-safe admin client

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, bringing, meeting_number } = JSON.parse(event.body);

    if (!name || !bringing || !meeting_number) {
      return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required' }) };
    }

    console.log('Submitting RSVP:', { name, bringing, meeting_number });

    const { data, error } = await supabaseAdmin
      .from('rsvp')
      .insert([{ name, bringing, meeting_number }]);

    if (error) {
      console.error('Error inserting RSVP:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to submit RSVP' }) };
    }

    console.log('RSVP submission result:', { success: true, data });

    return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
  } catch (err) {
    console.error('Unexpected error submitting RSVP:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
};

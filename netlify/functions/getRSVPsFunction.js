// netlify/functions/getRSVPsFunction.js
const { supabase } = require('../../supabase/supabaseClient.js');

exports.handler = async function(event) {
  try {
    // Use the query param name that the front-end actually sends
    const meetingNumber = parseInt(event.queryStringParameters?.meeting_number, 10);

    if (!meetingNumber) {
      console.warn('getRSVPsFunction: meeting_number is required');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'meeting_number is required' }) 
      };
    }

    console.log('Fetching RSVPs for meeting_number:', meetingNumber);

    const { data, error } = await supabase
      .from('rsvp')
      .select('*')
      .eq('meeting_number', meetingNumber)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching RSVPs:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch RSVPs' }) };
    }

    console.log('RSVPs fetched:', data);
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Unexpected error in getRSVPsFunction:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
};

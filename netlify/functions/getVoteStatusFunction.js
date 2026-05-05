// netlify/functions/getVoteStatusFunction.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_VOTES = 3;

exports.handler = async (event) => {
  try {
    const meeting_number = event.queryStringParameters.meeting_number;

    // You MUST already have some session identifier system
    // (this assumes you are already using something like this elsewhere)
    const session_id =
      event.headers['x-session-id'] ||
      event.headers['cookie'] ||
      'anonymous';

    if (!meeting_number) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing meeting_number' })
      };
    }

    // Count votes already used
    const { data, error } = await supabase
      .from('vote_count')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_number', meeting_number)
      .eq('session_id', session_id);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    const votesUsed = data?.length || 0;
    const votesRemaining = Math.max(MAX_VOTES - votesUsed, 0);

    return {
      statusCode: 200,
      body: JSON.stringify({
        votes_remaining: votesRemaining
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

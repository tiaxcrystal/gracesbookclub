const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_VOTES = 3;
const COOKIE_NAME = 'graces_vote_session';
const COOKIE_DAYS = 20;

/**
 * Parse cookies from request headers
 */
function getCookies(event) {
  const cookieHeader = event.headers.cookie || event.headers.Cookie;
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
}

/**
 * Create a new session id
 */
function createSessionId() {
  return crypto.randomUUID();
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { uuid } = body;

    if (!uuid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing uuid' })
      };
    }

    // --- COOKIE HANDLING ---
    const cookies = getCookies(event);
    let sessionId = cookies[COOKIE_NAME];
    let setCookieHeader = null;

    if (!sessionId) {
      sessionId = createSessionId();
      const expires = new Date(
        Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000
      ).toUTCString();

      setCookieHeader = `${COOKIE_NAME}=${sessionId}; Path=/; Expires=${expires}; SameSite=Lax`;
    }

    // --- COUNT EXISTING VOTES ---
    const { count, error: countError } = await supabase
      .from('vote_count')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (countError) {
      console.error('Vote count error:', countError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to count votes' })
      };
    }

    if (count >= MAX_VOTES) {
      return {
        statusCode: 403,
        headers: setCookieHeader ? { 'Set-Cookie': setCookieHeader } : {},
        body: JSON.stringify({
          error: 'Vote limit reached',
          votesRemaining: 0
        })
      };
    }

    // --- INSERT VOTE ---
    const { error: insertError } = await supabase
      .from('vote_count')
      .insert([
        {
          uuid,
          session_id: sessionId
        }
      ]);

    if (insertError) {
      console.error('Insert vote error:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to register vote' })
      };
    }

    return {
      statusCode: 200,
      headers: setCookieHeader ? { 'Set-Cookie': setCookieHeader } : {},
      body: JSON.stringify({
        success: true,
        votesRemaining: MAX_VOTES - (count + 1)
      })
    };

  } catch (err) {
    console.error('submitVoteFunction fatal error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};

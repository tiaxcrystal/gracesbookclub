// functions/getMeetingInfo.js

exports.handler = async function(event, context) {
  try {
    // Replace these with your actual meeting info
    const meetingInfo = {
      date: "December 12, 2025",
      theme: "Holiday Fun"
    };

    return {
      statusCode: 200,
      body: JSON.stringify(meetingInfo),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch meeting info" }),
    };
  }
};

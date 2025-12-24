// js/rsvpForm.js
const rsvpForm = document.getElementById('rsvpForm');
const rsvpTableBody = document.querySelector('#rsvp-table tbody');
const rsvpMessage = document.getElementById('rsvp-message');

let currentMeetingNumber = null;

// Fetch current meeting info
async function loadCurrentMeeting() {
  try {
    const res = await fetch('/.netlify/functions/getCurrentMeetingFunction');
    const meeting = await res.json();

    if (res.ok) {
      currentMeetingNumber = meeting.meeting_number;
      console.log('Loaded current meeting: ', meeting);

      // Fix: add 1 day to the meeting date to counter JS timezone issue
      if (meeting.meeting) {
        const meetingDate = new Date(meeting.meeting);
        meetingDate.setDate(meetingDate.getDate() + 1); // add 1 day
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        document.getElementById('meeting-date').textContent = `Date: ${meetingDate.toLocaleDateString(undefined, options)}`;
      }

      document.getElementById('meeting-theme').textContent = meeting.theme ? `Theme: ${meeting.theme}` : '';
      document.getElementById('meeting-info').textContent = meeting.info || '';
    } else {
      console.warn('Failed to load current meeting:', meeting.error);
      currentMeetingNumber = null;
    }
  } catch (err) {
    console.error('Error fetching current meeting:', err);
    currentMeetingNumber = null;
  }
}


// Load RSVPs for current meeting
async function loadRSVPs() {
  if (!currentMeetingNumber) {
    console.warn('meetingNumber is required');
    return;
  }

  try {
    console.log(`Fetching RSVPs for meeting_number: ${currentMeetingNumber}`);
    const res = await fetch(`/.netlify/functions/getRSVPsFunction?meeting_number=${currentMeetingNumber}`);
    const data = await res.json();

    if (!res.ok) {
      console.warn('Failed to fetch RSVPs:', data.error);
      rsvpTableBody.innerHTML = '<tr><td colspan="2">No RSVPs found.</td></tr>';
      return;
    }

    console.log('RSVPs fetched: ', data);

    rsvpTableBody.innerHTML = '';

    if (data.length === 0) {
      rsvpTableBody.innerHTML = '<tr><td colspan="2">No RSVPs found.</td></tr>';
      return;
    }

    data.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${entry.name}</td><td>${entry.bringing}</td>`;
      rsvpTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading RSVPs:', err);
    rsvpTableBody.innerHTML = '<tr><td colspan="2">Error loading RSVPs.</td></tr>';
  }
}

// Show a temporary fade-in/fade-out message
function showRSVPMessage(text) {
  rsvpMessage.textContent = text;
  rsvpMessage.style.opacity = 0;
  rsvpMessage.style.display = 'block';

  // Fade in
  let opacity = 0;
  const fadeIn = setInterval(() => {
    if (opacity >= 1) {
      clearInterval(fadeIn);
      // Stay visible for 3 seconds
      setTimeout(() => {
        // Fade out
        const fadeOut = setInterval(() => {
          if (opacity <= 0) {
            clearInterval(fadeOut);
            rsvpMessage.style.display = 'none';
          }
          rsvpMessage.style.opacity = opacity;
          opacity -= 0.05;
        }, 30);
      }, 3000);
    }
    rsvpMessage.style.opacity = opacity;
    opacity += 0.05;
  }, 30);
}

// Submit RSVP
rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentMeetingNumber) {
    alert('No active meeting found.');
    return;
  }

  const formData = new FormData(rsvpForm);
  const payload = {
    name: formData.get('name'),
    bringing: formData.get('bringing'),
    meeting_number: currentMeetingNumber
  };

  console.log('Submitting RSVP: ', payload);

  try {
    const res = await fetch('/.netlify/functions/submitRSVPFunction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log('RSVP submission result: ', result);

    if (res.ok && result.success) {
      rsvpForm.reset();
      await loadRSVPs(); // refresh table after submit
      showRSVPMessage('Thank you! Your RSVP has been received.');
    } else {
      alert(result.error || 'Failed to submit RSVP.');
    }
  } catch (err) {
    console.error('Error submitting RSVP:', err);
    alert('Error submitting RSVP.');
  }
});

// Initialize
(async () => {
  await loadCurrentMeeting();
  await loadRSVPs();
})();

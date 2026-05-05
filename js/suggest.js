// js/suggest.js

const nomsTableBody = document.querySelector('#nomsTable tbody');
const votesLeftEl = document.getElementById('votesLeft');
const suggestForm = document.getElementById('suggest-book-form');

const REFRESH_INTERVAL = 15000; // 15 seconds

// FIX: prevent "already declared" crash across multiple scripts
window.currentMeetingNumber = window.currentMeetingNumber || null;

let votesRemaining = 3;

/* -----------------------------
   Get current meeting (same idea as RSVP)
------------------------------ */
async function loadCurrentMeeting() {
  try {
    const res = await fetch('/.netlify/functions/getCurrentMeetingFunction');
    const meeting = await res.json();

    if (res.ok) {
      window.currentMeetingNumber = meeting.meeting_number;
    } else {
      console.warn('Failed to load meeting');
    }
  } catch (err) {
    console.error('Error fetching meeting:', err);
  }
}

/* -----------------------------
   Get vote status (NEW SYSTEM)
------------------------------ */
async function getVoteStatus() {
  if (!window.currentMeetingNumber) return;

  try {
    const res = await fetch(
      `/.netlify/functions/getVoteStatusFunction?meeting_number=${window.currentMeetingNumber}`
    );

    const data = await res.json();

    if (res.ok) {
      votesRemaining = data.votes_remaining;
      votesLeftEl.textContent = votesRemaining;
    }
  } catch (err) {
    console.error('Error fetching vote status:', err);
  }
}

/* -----------------------------
   Update vote buttons
------------------------------ */
function updateVoteButtons() {
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.disabled = votesRemaining <= 0;
  });
}

/* -----------------------------
   Render table
------------------------------ */
function renderSuggestions(data) {
  nomsTableBody.innerHTML = '';

  if (!data || !data.length) {
    nomsTableBody.innerHTML =
      '<tr><td colspan="3">No suggestions yet.</td></tr>';
    return;
  }

  const maxVotes = Math.max(...data.map(b => b.votes || 0));

  data.forEach(entry => {
    const tr = document.createElement('tr');

    if (entry.votes === maxVotes && maxVotes > 0) {
      tr.classList.add('leader');
    }

    const titleTd = document.createElement('td');
    const link = document.createElement('a');
    link.href = entry.goodreads;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = entry.title;
    titleTd.appendChild(link);

    const countTd = document.createElement('td');
    countTd.textContent = entry.votes ?? 0;

    const btnTd = document.createElement('td');
    const voteBtn = document.createElement('button');
    voteBtn.className = 'vote-btn';
    voteBtn.textContent = 'Vote';
    voteBtn.disabled = votesRemaining <= 0;

    voteBtn.addEventListener('click', async () => {
      if (votesRemaining <= 0) return;

      try {
        const res = await fetch('/.netlify/functions/submitVoteFunction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uuid: entry.uuid,
            meeting_number: window.currentMeetingNumber
          })
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          alert(result.error || 'Failed to register vote');
          return;
        }

        votesRemaining--;
        votesLeftEl.textContent = votesRemaining;
        updateVoteButtons();

        await loadSuggestions();

      } catch (err) {
        console.error('Vote error:', err);
        alert('Error submitting vote.');
      }
    });

    btnTd.appendChild(voteBtn);

    tr.appendChild(titleTd);
    tr.appendChild(countTd);
    tr.appendChild(btnTd);

    nomsTableBody.appendChild(tr);
  });

  updateVoteButtons();
}

/* -----------------------------
   Fetch suggestions
------------------------------ */
async function loadSuggestions() {
  try {
    const res = await fetch(
      `/.netlify/functions/getSuggestionsFunction?meeting_number=${window.currentMeetingNumber}`
    );

    const data = await res.json();

    if (!res.ok) throw new Error('Failed to fetch suggestions');

    renderSuggestions(data);
  } catch (err) {
    console.error(err);
    nomsTableBody.innerHTML =
      '<tr><td colspan="3">Unable to load suggestions.</td></tr>';
  }
}

/* -----------------------------
   Suggest form
------------------------------ */
if (suggestForm) {
  suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = suggestForm.title.value.trim();
    const goodreads = suggestForm.goodreads.value.trim();

    if (!title || !goodreads) {
      alert('Please fill out both fields.');
      return;
    }

    try {
      const res = await fetch('/.netlify/functions/submitSuggestionFunction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, goodreads })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.error || 'Failed to submit suggestion.');
        return;
      }

      suggestForm.reset();
      await loadSuggestions();

    } catch (err) {
      console.error('Suggestion error:', err);
      alert('Error submitting suggestion.');
    }
  });
}

/* -----------------------------
   Init
------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentMeeting();
  await getVoteStatus();
  await loadSuggestions();

  setInterval(loadSuggestions, REFRESH_INTERVAL);
});

// js/suggest.js

const nomsTableBody = document.querySelector('#nomsTable tbody');
const votesLeftEl = document.getElementById('votesLeft');
const suggestForm = document.getElementById('suggest-book-form');

const VOTES_KEY = 'votesLeft';
const COOKIE_NAME = 'graces_votes';
const MAX_VOTES = 3;
const COOKIE_DAYS = 20;
const REFRESH_INTERVAL = 15000; // 15 seconds

/* -----------------------------
   Cookie helpers
------------------------------ */
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

/* -----------------------------
   Vote tracking (client-side)
------------------------------ */
function getVotesLeft() {
  let votes = parseInt(localStorage.getItem(VOTES_KEY));
  if (isNaN(votes)) {
    const cookieVotes = parseInt(getCookie(COOKIE_NAME));
    votes = isNaN(cookieVotes) ? MAX_VOTES : cookieVotes;
    localStorage.setItem(VOTES_KEY, votes);
  }
  return votes;
}

function updateVotesLeft(votes) {
  votesLeftEl.textContent = votes;
  localStorage.setItem(VOTES_KEY, votes);
  setCookie(COOKIE_NAME, votes, COOKIE_DAYS);
}

function updateVoteButtons() {
  const votes = getVotesLeft();
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.disabled = votes <= 0;
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

    // Highlight leader(s)
    if (entry.votes === maxVotes && maxVotes > 0) {
      tr.classList.add('leader');
    }

    // Title
    const titleTd = document.createElement('td');
    const link = document.createElement('a');
    link.href = entry.goodreads;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = entry.title;
    titleTd.appendChild(link);

    // Vote count
    const countTd = document.createElement('td');
    countTd.textContent = entry.votes ?? 0;

    // Vote button
    const btnTd = document.createElement('td');
    const voteBtn = document.createElement('button');
    voteBtn.className = 'vote-btn';
    voteBtn.textContent = 'Vote';
    voteBtn.disabled = getVotesLeft() <= 0;

    voteBtn.addEventListener('click', async () => {
      const currentVotes = getVotesLeft();
      if (currentVotes <= 0) return;

      try {
        const res = await fetch('/.netlify/functions/submitVoteFunction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: entry.uuid })
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          alert(result.error || 'Failed to register vote');
          return;
        }

        updateVotesLeft(currentVotes - 1);
        updateVoteButtons();
        await loadSuggestions(); // refresh totals immediately

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
    const res = await fetch('/.netlify/functions/getSuggestionsFunction');
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();
    renderSuggestions(data);
  } catch (err) {
    console.error(err);
    nomsTableBody.innerHTML =
      '<tr><td colspan="3">Unable to load suggestions.</td></tr>';
  }
}

/* -----------------------------
   Suggest-a-book form handler
------------------------------ */
if (suggestForm) {
  suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 🚨 THIS stops the page refresh

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
      await loadSuggestions(); // 👈 new suggestion appears immediately

    } catch (err) {
      console.error('Suggestion error:', err);
      alert('Error submitting suggestion.');
    }
  });
}

/* -----------------------------
   Init + polling
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  updateVotesLeft(getVotesLeft());
  loadSuggestions();
  setInterval(loadSuggestions, REFRESH_INTERVAL);
});

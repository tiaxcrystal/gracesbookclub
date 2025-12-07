// =======================
// Suggest & Vote Section
// =======================

// --- Suggestion Form ---
const suggestForm = document.getElementById('suggestForm');
const suggestStatus = document.getElementById('suggest-status');
const suggestTableBody = document.querySelector('#suggestions-table tbody');

// Load existing suggestions from backend
async function loadSuggestions() {
  if (!suggestTableBody) return;
  try {
    const data = await fetch('/.netlify/functions/getNominations').then(r => r.json());
    suggestTableBody.innerHTML = '';

    if (!data || !data.length) {
      suggestTableBody.innerHTML = '<tr><td colspan="2">No suggestions yet.</td></tr>';
      return;
    }

    data.reverse().forEach(entry => {
      const row = document.createElement('tr');

      const bookCell = document.createElement('td');
      bookCell.textContent = entry.book || '(no title)';

      const suggesterCell = document.createElement('td');
      suggesterCell.textContent = entry.name || '(anonymous)';

      row.appendChild(bookCell);
      row.appendChild(suggesterCell);
      suggestTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading suggestions:', err);
    suggestTableBody.innerHTML = '<tr><td colspan="2">Error loading suggestions.</td></tr>';
  }
}

// Handle suggestion form submission
if (suggestForm) {
  suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookName = suggestForm.book.value.trim();
    const name = suggestForm.name.value.trim();

    if (!bookName) {
      suggestStatus.textContent = 'Please enter a book title.';
      suggestStatus.style.color = 'red';
      return;
    }

    suggestStatus.textContent = 'Submitting…';
    suggestStatus.style.color = '#4c1033';

    try {
      await fetch('/.netlify/functions/submitNomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: bookName, name: name || 'Anonymous' })
      });

      suggestStatus.textContent = 'Suggestion submitted!';
      suggestStatus.style.color = 'green';
      suggestForm.reset();
      loadSuggestions();
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      suggestStatus.textContent = 'Error submitting suggestion.';
      suggestStatus.style.color = 'red';
    }
  });
}

// --- Voting Form ---
const voteForm = document.getElementById('voteForm');
const voteStatus = document.getElementById('vote-status');
const voteSelect = document.getElementById('vote-select');

// Load suggestions into vote dropdown
async function loadVoteOptions() {
  if (!voteSelect) return;
  try {
    const data = await fetch('/.netlify/functions/getNominations').then(r => r.json());
    voteSelect.innerHTML = '';

    if (!data || !data.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No books available';
      voteSelect.add(option);
      return;
    }

    data.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.book || '';
      option.textContent = entry.book || '(no title)';
      voteSelect.add(option);
    });
  } catch (err) {
    console.error('Error loading vote options:', err);
    voteSelect.innerHTML = '<option value="">Error loading options</option>';
  }
}

// Handle voting form submission
if (voteForm) {
  voteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedBook = voteSelect.value;
    const voterName = voteForm.name.value.trim();

    if (!selectedBook) {
      voteStatus.textContent = 'Please select a book to vote.';
      voteStatus.style.color = 'red';
      return;
    }

    voteStatus.textContent = 'Submitting vote…';
    voteStatus.style.color = '#4c1033';

    try {
      await fetch('/.netlify/functions/addVote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: selectedBook, name: voterName || 'Anonymous' })
      });

      voteStatus.textContent = 'Vote submitted!';
      voteStatus.style.color = 'green';
      voteForm.reset();
      loadVoteOptions(); // Refresh options in case something changed
      loadSuggestions(); // Optional: refresh table to show latest votes/suggestions
    } catch (err) {
      console.error('Error submitting vote:', err);
      voteStatus.textContent = 'Error submitting vote.';
      voteStatus.style.color = 'red';
    }
  });
}

// Initial load
loadSuggestions();
loadVoteOptions();

// Optional: auto-refresh every 5 seconds
setInterval(() => { loadSuggestions(); loadVoteOptions(); }, 5000);

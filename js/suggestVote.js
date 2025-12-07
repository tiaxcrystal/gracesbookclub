// =======================
// Suggest & Vote Section
// =======================

// --- Suggestion Form ---
const nomForm = document.getElementById('nomForm');
const nomStatus = document.getElementById('nomStatus');
const nomsTableBody = document.querySelector('#nomsTable tbody');

async function loadSuggestions() {
  if (!nomsTableBody) return;
  try {
    const data = await fetch('/.netlify/functions/getNominations').then(r => r.json());
    nomsTableBody.innerHTML = '';

    if (!data || !data.length) {
      nomsTableBody.innerHTML = '<tr><td colspan="2">No suggestions yet.</td></tr>';
      return;
    }

    data.reverse().forEach(entry => {
      const row = document.createElement('tr');

      const bookCell = document.createElement('td');
      bookCell.textContent = entry.title || '(no title)';

      const linkCell = document.createElement('td');
      if (entry.link) {
        const a = document.createElement('a');
        a.href = entry.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Link';
        linkCell.appendChild(a);
      } else {
        linkCell.textContent = '(no link)';
      }

      row.appendChild(bookCell);
      row.appendChild(linkCell);
      nomsTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading suggestions:', err);
    nomsTableBody.innerHTML = '<tr><td colspan="2">Error loading suggestions.</td></tr>';
  }
}

if (nomForm) {
  nomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = nomForm.title.value.trim();
    const link = nomForm.link.value.trim();

    if (!title || !link) {
      nomStatus.textContent = 'Please enter a title and a valid link.';
      nomStatus.style.color = 'red';
      return;
    }

    nomStatus.textContent = 'Submitting…';
    nomStatus.style.color = '#4c1033';

    try {
      const resp = await fetch('/.netlify/functions/submitNomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, link })
      });

      const result = await resp.json();
      if (result.success) {
        nomStatus.textContent = 'Suggestion submitted!';
        nomStatus.style.color = 'green';
        nomForm.reset();
        loadSuggestions();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      nomStatus.textContent = 'Error submitting suggestion.';
      nomStatus.style.color = 'red';
    }
  });
}

// --- Voting Section (optional) ---
// Only activate if you have a vote form & select in your HTML
const voteForm = document.getElementById('voteForm');
const voteStatus = document.getElementById('vote-status');
const voteSelect = document.getElementById('vote-select');

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
      option.value = entry.title || '';
      option.textContent = entry.title || '(no title)';
      voteSelect.add(option);
    });
  } catch (err) {
    console.error('Error loading vote options:', err);
    voteSelect.innerHTML = '<option value="">Error loading options</option>';
  }
}

if (voteForm) {
  voteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedBook = voteSelect.value;
    const voterName = voteForm.name.value?.trim() || 'Anonymous';

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
        body: JSON.stringify({ book: selectedBook, name: voterName })
      });

      voteStatus.textContent = 'Vote submitted!';
      voteStatus.style.color = 'green';
      voteForm.reset();
      loadVoteOptions();
      loadSuggestions();
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
setInterval(() => { loadSuggestions(); loadVoteOptions(); }, 5000);

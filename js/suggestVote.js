// =======================
// Suggest & Vote Section
// =======================

// --- Suggestion Form ---
const nomForm = document.getElementById('nomForm');
const nomStatus = document.getElementById('nomStatus');
const nomsTableBody = document.querySelector('#nomsTable tbody');

const voteForm = document.getElementById('voteForm');
const voteStatus = document.getElementById('vote-status');
const voteSelect = document.getElementById('vote-select');
const votesLeftSpan = document.getElementById('votesLeft');

let votesRemaining = 3; // max votes per session

// --- Load nominations and render table ---
async function loadSuggestions() {
  if (!nomsTableBody) return;
  try {
    const data = await fetch('/.netlify/functions/getNominations').then(r => r.json());
    nomsTableBody.innerHTML = '';

    if (!data || !data.length) {
      nomsTableBody.innerHTML = '<tr><td colspan="3">No suggestions yet.</td></tr>';
      return;
    }

    data.reverse().forEach(entry => {
      const row = document.createElement('tr');

      // Title cell
      const titleCell = document.createElement('td');
      if (entry.link) {
        const a = document.createElement('a');
        a.href = entry.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = entry.title || '(no title)';
        titleCell.appendChild(a);
      } else {
        titleCell.textContent = entry.title || '(no title)';
      }

      // Votes tally cell
      const votesCell = document.createElement('td');
      votesCell.textContent = entry.votes ?? 0;

      // Vote button cell
      const voteCell = document.createElement('td');
      const voteBtn = document.createElement('button');
      voteBtn.textContent = 'Vote';
      voteBtn.className = 'submit-btn';
      voteBtn.disabled = votesRemaining === 0;

      voteBtn.addEventListener('click', async () => {
        if (votesRemaining === 0) return;

        try {
          const resp = await fetch('/.netlify/functions/addVote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submitted: entry.title, name: 'Anonymous' })
          });

          const result = await resp.json();
          if (result.success) {
            votesRemaining--;
            updateVotesNotice();
            loadSuggestions();
            loadVoteOptions();
          } else {
            alert('Vote failed: ' + (result.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Error submitting vote:', err);
          alert('Error submitting vote.');
        }
      });

      voteCell.appendChild(voteBtn);
      row.appendChild(titleCell);
      row.appendChild(votesCell);
      row.appendChild(voteCell);

      nomsTableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Error loading suggestions:', err);
    nomsTableBody.innerHTML = '<tr><td colspan="3">Error loading suggestions.</td></tr>';
  }
}

// --- Nomination form submission ---
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

// --- Load vote select options ---
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

// --- Handle voting form ---
if (voteForm) {
  voteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (votesRemaining === 0) return;

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
      const resp = await fetch('/.netlify/functions/addVote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitted: selectedBook, name: voterName })
      });

      const result = await resp.json();
      if (result.success) {
        votesRemaining--;
        updateVotesNotice();
        voteStatus.textContent = 'Vote submitted!';
        voteStatus.style.color = 'green';
        voteForm.reset();
        loadVoteOptions();
        loadSuggestions();
      } else {
        voteStatus.textContent = 'Vote failed: ' + (result.error || 'Unknown error');
        voteStatus.style.color = 'red';
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      voteStatus.textContent = 'Error submitting vote.';
      voteStatus.style.color = 'red';
    }
  });
}

// --- Update vote notice and disable buttons if needed ---
function updateVotesNotice() {
  if (votesLeftSpan) votesLeftSpan.textContent = votesRemaining;
  // Disable all vote buttons if votesRemaining = 0
  const voteButtons = document.querySelectorAll('#nomsTable button, #voteForm button');
  voteButtons.forEach(btn => {
    btn.disabled = votesRemaining === 0;
  });
}

// --- Initial load ---
updateVotesNotice();
loadSuggestions();
loadVoteOptions();
setInterval(() => { loadSuggestions(); loadVoteOptions(); }, 5000);

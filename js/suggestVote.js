// =======================
// Suggest & Vote Section
// =======================
const suggestForm = document.getElementById('suggestForm');
const suggestTableBody = document.querySelector('#suggest-table tbody');
const voteForm = document.getElementById('voteForm');
const voteSelect = document.getElementById('voteBook');
const voteStatus = document.getElementById('voteStatus');

// Load suggestions from backend
async function loadSuggestions() {
  try {
    const data = await fetch('/.netlify/functions/getSuggestions').then(r => r.json());
    suggestTableBody.innerHTML = '';

    if (!data || !data.length) {
      suggestTableBody.innerHTML = '<tr><td colspan="2">No suggestions yet.</td></tr>';
      voteSelect.innerHTML = '<option value="">No books to vote on</option>';
      return;
    }

    // Populate table and vote dropdown
    voteSelect.innerHTML = '';
    data.forEach(entry => {
      // Table row
      const row = document.createElement('tr');
      const titleCell = document.createElement('td');
      titleCell.textContent = entry.title || '(no title)';
      const suggesterCell = document.createElement('td');
      suggesterCell.textContent = entry.name || '(anonymous)';
      row.appendChild(titleCell);
      row.appendChild(suggesterCell);
      suggestTableBody.appendChild(row);

      // Vote dropdown
      const option = document.createElement('option');
      option.value = entry.title || '';
      option.textContent = entry.title || '(no title)';
      voteSelect.add(option);
    });
  } catch (err) {
    console.error('Error loading suggestions:', err);
    suggestTableBody.innerHTML = '<tr><td colspan="2">Error loading suggestions.</td></tr>';
    voteSelect.innerHTML = '<option value="">Error loading books</option>';
  }
}

// Submit new suggestion
suggestForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = suggestForm.title.value.trim();
  const name = suggestForm.name.value.trim();

  if (!title || !name) return;

  try {
    await fetch('/.netlify/functions/addSuggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name })
    });
    suggestForm.reset();
    loadSuggestions();
  } catch (err) {
    console.error('Error submitting suggestion:', err);
  }
});

// Submit vote
voteForm.addEventListener('submit', async e => {
  e.preventDefault();
  const selectedBook = voteSelect.value;
  if (!selectedBook) {
    voteStatus.textContent = 'Please select a book to vote!';
    voteStatus.style.color = 'red';
    return;
  }

  voteStatus.textContent = 'Submitting vote…';
  voteStatus.style.color = '#4c1033';

  try {
    await fetch('/.netlify/functions/addVote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: selectedBook })
    });
    voteStatus.textContent = 'Vote submitted!';
    voteStatus.style.color = 'green';
    voteForm.reset();
    loadSuggestions(); // refresh in case vote counts are displayed
  } catch (err) {
    console.error('Error submitting vote:', err);
    voteStatus.textContent = 'Error submitting vote!';
    voteStatus.style.color = 'red';
  }
});

// Initial load
loadSuggestions();

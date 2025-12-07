// =======================
// Suggest & Vote Section
// =======================

const suggestForm = document.getElementById('suggestForm');
const suggestStatus = document.getElementById('suggest-status');
const suggestTableBody = document.querySelector('#suggestions-table tbody');

// Load existing suggestions from backend
async function loadSuggestions() {
  if (!suggestTableBody) return;
  try {
    const data = await fetch('/.netlify/functions/getSuggestions').then(r => r.json());
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

// Handle form submission
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
      await fetch('/.netlify/functions/addSuggestion', {
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

// Initial load
loadSuggestions();

// Optional: refresh every 5 seconds in case multiple people are submitting
setInterval(loadSuggestions, 5000);

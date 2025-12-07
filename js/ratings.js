// =======================
// Rate Our Books
// =======================
const bookSelect = document.getElementById('book');
const statusDiv = document.getElementById('status');
const avgTableBody = document.querySelector('#averages tbody');

async function populateBooks() {
  try {
    const books = await fetch('/.netlify/functions/getBookList').then(r => r.json());
    bookSelect.innerHTML = '';

    if (!books || !books.length) {
      const option = document.createElement('option');
      option.textContent = 'No books available';
      option.value = '';
      bookSelect.add(option);
      return;
    }

    books.forEach(book => {
      const bookName = (typeof book === 'string') ? book.trim() : '';
      if (!bookName) return;
      const option = document.createElement('option');
      option.value = bookName;
      option.textContent = bookName;
      bookSelect.add(option);
    });

    refreshAverages();
  } catch (e) {
    console.error('Error loading book list:', e);
    bookSelect.innerHTML = '<option value="">Error loading books</option>';
  }
}

async function refreshAverages() {
  try {
    const averages = await fetch('/.netlify/functions/getAverages').then(r => r.json());
    avgTableBody.innerHTML = '';

    if (!averages || !averages.length) {
      avgTableBody.innerHTML = '<tr><td colspan="3">No ratings yet.</td></tr>';
      return;
    }

    averages.sort((a, b) => (b.avg || 0) - (a.avg || 0));

    averages.forEach(item => {
      const row = document.createElement('tr');

      const bookCell = document.createElement('td');
      bookCell.textContent = item.book || '(unknown)';

      const avgCell = document.createElement('td');
      const stars = Math.round(item.avg || 0);
      avgCell.innerHTML = '⭐'.repeat(stars);

      const countCell = document.createElement('td');
      countCell.textContent = item.count || 0;

      row.appendChild(bookCell);
      row.appendChild(avgCell);
      row.appendChild(countCell);

      avgTableBody.appendChild(row);
    });
  } catch (e) {
    console.error('Error loading averages:', e);
    avgTableBody.innerHTML = '<tr><td colspan="3">Error loading averages.</td></tr>';
  }
}

document.getElementById('ratingForm').addEventListener('submit', async e => {
  e.preventDefault();

  const selectedRating = document.querySelector('input[name="rating"]:checked')?.value;
  const selectedBook = bookSelect.value;

  if (!selectedBook) {
    statusDiv.innerText = 'Please select a book!';
    statusDiv.style.color = 'red';
    return;
  }

  if (!selectedRating) {
    statusDiv.innerText = 'Please select a star rating!';
    statusDiv.style.color = 'red';
    return;
  }

  statusDiv.innerText = 'Submitting rating…';
  statusDiv.style.color = '#4c1033';

  try {
    await fetch('/.netlify/functions/submitRating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: selectedBook, rating: selectedRating })
    });

    statusDiv.innerText = 'Rating submitted!';
    statusDiv.style.color = 'green';
    document.querySelectorAll('input[name="rating"]').forEach(input => input.checked = false);
    refreshAverages();
  } catch (e) {
    console.error('Error submitting rating:', e);
    statusDiv.innerText = 'Error submitting rating!';
    statusDiv.style.color = 'red';
  }
});

// Initialize
populateBooks();

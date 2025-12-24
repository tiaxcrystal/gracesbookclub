// =======================
// Ratings
// =======================

const bookSelect = document.getElementById('book');
const ratingForm = document.getElementById('ratingForm');
const statusDiv = document.getElementById('status');
const avgTableBody = document.querySelector('#averages tbody');

// -----------------------
// Load books for dropdown
// -----------------------
async function loadBooksForDropdown(preselectedBookNumber = null) {
  try {
    const res = await fetch('/.netlify/functions/getBooksForRatingsFunction');
    if (!res.ok) throw new Error('Failed to fetch books');

    const books = await res.json();

    bookSelect.innerHTML = '<option value="">Select a book</option>';

    books.forEach(book => {
      const option = document.createElement('option');
      option.value = book.meeting_number;
      option.textContent = book.title;
      if (preselectedBookNumber && Number(preselectedBookNumber) === book.meeting_number) {
        option.selected = true;
      }
      bookSelect.appendChild(option);
    });

  } catch (err) {
    console.error('Error loading books for dropdown:', err);
    statusDiv.textContent = 'Error loading book list.';
  }
}

// -----------------------
// Load averages table
// -----------------------
async function loadAverages() {
  try {
    const res = await fetch('/.netlify/functions/getAveragesFunction');
    if (!res.ok) throw new Error('Failed to fetch averages');

    const data = await res.json();

    // Sort: highest rated first, unrated last
    data.sort((a, b) => {
      if (a.avg === null && b.avg !== null) return 1;
      if (a.avg !== null && b.avg === null) return -1;
      if (b.avg !== a.avg) return b.avg - a.avg;
      return (b.count || 0) - (a.count || 0);
    });

    avgTableBody.innerHTML = '';

    if (!data.length) {
      avgTableBody.innerHTML =
        '<tr><td colspan="3">No ratings yet.</td></tr>';
      return;
    }

    data.forEach(item => {
      const row = document.createElement('tr');

      // Book title + Goodreads link
      const bookCell = document.createElement('td');
      if (item.url) {
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.book;
        link.classList.add('ratings-link');
        bookCell.appendChild(link);
      } else {
        bookCell.textContent = item.book;
      }

      // Average rating stars
      const avgCell = document.createElement('td');
      avgCell.textContent = item.avg
        ? '⭐'.repeat(Math.round(item.avg))
        : '';

      // Number of ratings
      const countCell = document.createElement('td');
      countCell.textContent = item.count || 0;

      row.appendChild(bookCell);
      row.appendChild(avgCell);
      row.appendChild(countCell);

      avgTableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Error loading averages:', err);
    avgTableBody.innerHTML =
      '<tr><td colspan="3">Error loading ratings.</td></tr>';
  }
}

// -----------------------
// Submit rating
// -----------------------
ratingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const book_number = bookSelect.value;
  const rating = ratingForm.rating.value;

  if (!book_number || !rating) {
    statusDiv.textContent = 'Please select a book and rating.';
    return;
  }

  try {
    const res = await fetch('/.netlify/functions/submitRatingFunction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_number: Number(bookSelect.value),
        rating: Number(ratingForm.rating.value)
      })
    });

    if (!res.ok) throw new Error('Submit failed');

    statusDiv.textContent = '⭐ Thank you for rating!';
    ratingForm.reset();

    await loadAverages();

  } catch (err) {
    console.error('Submit error:', err);
    statusDiv.textContent = 'Failed to submit rating.';
  }
});

// -----------------------
// Init with preselection
// -----------------------
const urlParams = new URLSearchParams(window.location.search);
const prebook = urlParams.get('book_number');

loadBooksForDropdown(prebook);
loadAverages();

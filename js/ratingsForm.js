const ratingsForm = document.getElementById('ratingsForm');
const bookSelect = document.getElementById('bookSelect');
const ratingMessage = document.getElementById('ratingMessage');

async function loadBooksForRatings() {
  try {
    console.log('Loading books for ratings dropdown…');

    const res = await fetch('/.netlify/functions/getBooksFunction');

    if (!res.ok) {
      console.error('getBooksFunction failed:', res.status);
      bookSelect.innerHTML = '<option value="">Failed to load books</option>';
      return;
    }

    const books = await res.json();
    console.log('Books received:', books);

    bookSelect.innerHTML = '<option value="">Select a book</option>';

    if (!books.length) {
      bookSelect.innerHTML = '<option value="">No books found</option>';
      return;
    }

    books.forEach(book => {
      const option = document.createElement('option');
      option.value = book.meeting_number;
      option.textContent = book.title;
      bookSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading books for ratings:', err);
    bookSelect.innerHTML = '<option value="">Error loading books</option>';
  }
}

ratingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ratingMessage.style.display = 'none';

  const payload = {
    book_number: Number(bookSelect.value),
    rating: Number(document.getElementById('starSelect').value)
  };

  console.log('Submitting rating:', payload);

  try {
    const res = await fetch('/.netlify/functions/submitRatingFunction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log('Rating submission result:', result);

    if (res.ok && result.success) {
      ratingsForm.reset();
      ratingMessage.style.display = 'block';
    } else {
      alert(result.error || 'Failed to submit rating');
    }
  } catch (err) {
    console.error('Error submitting rating:', err);
    alert('Error submitting rating');
  }
});

// INIT
loadBooksForRatings();

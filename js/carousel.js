// js/carousel.js
// =======================
// Past Books Carousel with clickable rating stars (integrates in-page rating container)
// =======================
(function () {
  if (window.__GRACES_CAROUSEL_LOADED) return;
  window.__GRACES_CAROUSEL_LOADED = true;

  (async function initPastBooksCarousel() {
    const track = document.querySelector('.carousel-track');
    const trackWrapper = document.querySelector('.carousel-track-wrapper');
    if (!track || !trackWrapper) return;

    const PLACEHOLDER = 'https://raw.githubusercontent.com/tiaxcrystal/gracesbookclub/main/images/favicon.png';

    // fetch past books
    let items = [];
    let ratingsData = [];
    try {
      const resp = await fetch('/.netlify/functions/getPastBooksFunction');
      if (!resp.ok) throw new Error('Failed to fetch past books: ' + resp.status);
      items = await resp.json();

      const ratingsResp = await fetch('/.netlify/functions/getAveragesFunction');
      if (!ratingsResp.ok) throw new Error('Failed to fetch ratings: ' + ratingsResp.status);
      ratingsData = await ratingsResp.json();
    } catch (err) {
      console.error('Could not load past books or ratings', err);
      track.innerHTML = '<li style="padding:20px;">Could not load past books.</li>';
      return;
    }

    if (!items || !items.length) {
      track.innerHTML = '<li style="padding:20px;">No past books yet.</li>';
      return;
    }

    // Sort by meeting_number descending (latest first)
    items.sort((a, b) => b.meeting_number - a.meeting_number);

    // clear existing slides
    track.innerHTML = '';

    // build slides
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-slide';
      li.setAttribute('data-index', idx);
      li.style.boxSizing = 'border-box';

      const imgSrc = it.image?.trim() || PLACEHOLDER;

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = it.title ? `${it.title} cover` : 'Book cover';
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      img.style.background = '#fff';
      img.addEventListener('error', () => { 
        if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER; 
      });

      const imgContainer = document.createElement('div');
      imgContainer.className = 'carousel-image-container';
      imgContainer.style.boxSizing = 'border-box';
      imgContainer.appendChild(img);

      const caption = document.createElement('div');
      caption.className = 'carousel-caption';

      // Title link
      const titleLink = document.createElement('a');
      titleLink.className = 'title-link';
      titleLink.href = it.goodreads?.trim() || '#';
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = it.title || '(no title)';
      caption.appendChild(titleLink);

      // Author
      if (it.author) {
        const authorRow = document.createElement('div');
        authorRow.className = 'author';
        authorRow.textContent = it.author;
        caption.appendChild(authorRow);
      }

// Stars row
const ratingObj = ratingsData.find(r => r.book_number === it.meeting_number);
const ratingRow = document.createElement('div');
ratingRow.className = 'carousel-stars-row';

const ratingLink = document.createElement('a');
ratingLink.href = '#';
ratingLink.className = 'ratings-link';
ratingLink.style.cursor = 'pointer';

if (ratingObj && ratingObj.avg && ratingObj.count > 0) {
  const stars = Math.round(ratingObj.avg);
  ratingLink.innerHTML = '⭐'.repeat(stars);
} else {
  // Wrap the "Be the first to rate this book" in a span for independent sizing
  ratingLink.innerHTML = '<span class="first-to-rate">Be the first to rate this book</span>';
}

ratingLink.addEventListener('click', e => {
  e.preventDefault();
  const rateSection = document.getElementById('rate');
  const bookSelect = document.getElementById('book');
  if (!rateSection || !bookSelect) return;

  // Populate the book dropdown with current book
  bookSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = it.meeting_number;
  option.textContent = it.title;
  bookSelect.appendChild(option);
  bookSelect.value = it.meeting_number;

  // Hide carousel section and show rating container
  const carouselSection = document.querySelector('.past-books-section');
  if (carouselSection) carouselSection.style.display = 'none';
  rateSection.style.display = 'block';
});

ratingRow.appendChild(ratingLink);
caption.appendChild(ratingRow);


// Meeting date
if (it.meeting) {
  const dateRow = document.createElement('div');
  dateRow.className = 'meeting-date';

  const meetingDate = new Date(it.meeting);
  meetingDate.setDate(meetingDate.getDate() + 1);

  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  dateRow.textContent = meetingDate.toLocaleDateString(undefined, options);

  caption.appendChild(dateRow);
}


      li.appendChild(imgContainer);
      li.appendChild(caption);
      track.appendChild(li);
    });

    // controls
    let controlsBar = document.querySelector('.carousel-controls');
    if (!controlsBar) {
      controlsBar = document.createElement('div');
      controlsBar.className = 'carousel-controls';
      trackWrapper.insertAdjacentElement('afterend', controlsBar);
    } else {
      controlsBar.innerHTML = '';
    }

    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev';
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous book');
    prevBtn.textContent = '◀';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next';
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next book');
    nextBtn.textContent = '▶';

    controlsBar.appendChild(prevBtn);
    controlsBar.appendChild(nextBtn);

    const slides = Array.from(track.children);
    slides.forEach(slide => slide.style.flexShrink = '0');

    let slideIndex = 0;
    track.style.transition = 'transform 0.35s ease';

    function getGap() {
      const computed = getComputedStyle(track).gap;
      const parsed = parseFloat(computed);
      return isFinite(parsed) ? parsed : 12;
    }

    function setSizes() {
      const wrapperWidth = trackWrapper.clientWidth;
      slides.forEach(slide => {
        slide.style.width = wrapperWidth + 'px';
        slide.style.minWidth = wrapperWidth + 'px';
        slide.style.maxWidth = wrapperWidth + 'px';
        const imgContainer = slide.querySelector('.carousel-image-container');
        if (imgContainer) imgContainer.style.height = wrapperWidth + 'px';
      });
      updateTrackPosition();
    }

    function updateTrackPosition() {
      if (!slides.length) return;
      const slideWidth = slides[0].offsetWidth;
      const gap = getGap();
      const stride = slideWidth + gap;
      const offset = slideIndex * stride;
      track.style.transform = `translateX(-${offset}px)`;

      prevBtn.disabled = slideIndex === 0;
      nextBtn.disabled = slideIndex >= slides.length - 1;
    }

    function nextSlide() { if (slideIndex < slides.length - 1) { slideIndex++; updateTrackPosition(); } }
    function prevSlide() { if (slideIndex > 0) { slideIndex--; updateTrackPosition(); } }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    let startX = 0, startTime = 0;
    trackWrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startTime = Date.now(); });
    trackWrapper.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      const deltaTime = Date.now() - startTime;
      const speed = deltaX / deltaTime;
      const SWIPE_MIN_DISTANCE = 20;
      const SWIPE_SPEED_THRESHOLD = 0.3;
      if (Math.abs(deltaX) > SWIPE_MIN_DISTANCE || Math.abs(speed) > SWIPE_SPEED_THRESHOLD) {
        if (deltaX > 0) prevSlide();
        else nextSlide();
      }
    });

    let imagesToLoad = slides.length;
    let imagesSeen = 0;
    slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (!img) { imagesSeen++; return; }
      if (img.complete) imagesSeen++;
      else { img.addEventListener('load', () => { imagesSeen++; }); img.addEventListener('error', () => { imagesSeen++; }); }
    });

    function finalizeLayout() {
      setSizes();
      const timeout = setTimeout(() => setSizes(), 300);
      const interval = setInterval(() => {
        if (imagesSeen >= imagesToLoad) {
          clearInterval(interval);
          clearTimeout(timeout);
          setSizes();
        }
      }, 100);
    }
    finalizeLayout();

    let resizeTimer = null;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { setSizes(); }, 120); });

    updateTrackPosition();
  })();
})();

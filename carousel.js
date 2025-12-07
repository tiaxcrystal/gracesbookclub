// =======================
// Past Books Carousel
// =======================
(async function initPastBooksCarousel() {
  const track = document.querySelector('.carousel-track');
  const trackWrapper = document.querySelector('.carousel-track-wrapper');
  if (!track || !trackWrapper) return;

  const PLACEHOLDER = 'https://raw.githubusercontent.com/tiaxcrystal/gracesbookclub/main/images/favicon.png';

  let items = [];
  try {
    const resp = await fetch('/.netlify/functions/getPastBooks');
    if (!resp.ok) throw new Error('Failed to fetch past books: ' + resp.status);
    items = await resp.json();
  } catch (err) {
    console.error('Could not load past books', err);
    track.innerHTML = '<li style="padding:20px;">Could not load past books.</li>';
    return;
  }

  if (!items || !items.length) {
    track.innerHTML = '<li style="padding:20px;">No past books yet.</li>';
    return;
  }

  track.innerHTML = '';

  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-slide';
    li.setAttribute('data-index', idx);
    li.style.boxSizing = 'border-box';

    let imgUrl = '';
    for (const key in it) {
      if (typeof it[key] === 'string' && it[key].trim().match(/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/i)) {
        imgUrl = it[key].trim();
        break;
      }
    }
    const finalImgSrc = imgUrl || PLACEHOLDER;

    const goodreadsHref = (it.link && it.link.trim()) ? it.link.trim() : '#';
    const imgWrap = document.createElement('a');
    imgWrap.href = goodreadsHref;
    imgWrap.target = '_blank';
    imgWrap.rel = 'noopener noreferrer';

    const img = document.createElement('img');
    img.src = finalImgSrc;
    img.alt = it.title ? `${it.title} cover` : 'Book cover';
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.background = '#fff';

    img.addEventListener('error', () => {
      if (img.src !== PLACEHOLDER) {
        console.warn('Book image failed to load, swapping to placeholder:', imgUrl || '(empty)');
        img.src = PLACEHOLDER;
      }
    });

    imgWrap.appendChild(img);

    const caption = document.createElement('div');
    caption.className = 'carousel-caption';
    const titleLink = document.createElement('a');
    titleLink.className = 'title-link';
    titleLink.href = goodreadsHref;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = it.title || '(no title)';
    caption.appendChild(titleLink);
    if (it.month) {
      const monthSpan = document.createElement('span');
      monthSpan.className = 'month';
      monthSpan.textContent = it.month;
      caption.appendChild(monthSpan);
    }

    const imgContainer = document.createElement('div');
    imgContainer.className = 'carousel-image-container';
    imgContainer.style.boxSizing = 'border-box';
    imgContainer.appendChild(imgWrap);

    li.appendChild(imgContainer);
    li.appendChild(caption);
    track.appendChild(li);
  });

  // Controls
  let controlsBar = document.querySelector('.carousel-controls');
  if (!controlsBar) {
    controlsBar = document.createElement('div');
    controlsBar.className = 'carousel-controls';
    trackWrapper.insertAdjacentElement('afterend', controlsBar);
  } else controlsBar.innerHTML = '';

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
  let slideIndex = 0;

  function getGap() {
    const computed = getComputedStyle(track).gap;
    const parsed = parseFloat(computed);
    return (isFinite(parsed) ? parsed : 12);
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
    const wrapperWidth = trackWrapper.clientWidth;
    const gap = getGap();
    const stride = wrapperWidth + gap;
    const offset = slideIndex * stride;
    track.style.transform = `translateX(-${offset}px)`;
    prevBtn.disabled = (slideIndex === 0);
    nextBtn.disabled = (slideIndex >= slides.length - 1);
  }

  function nextSlide() { if (slideIndex < slides.length - 1) { slideIndex++; updateTrackPosition(); } }
  function prevSlide() { if (slideIndex > 0) { slideIndex--; updateTrackPosition(); } }

  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') prevSlide(); if (e.key === 'ArrowRight') nextSlide(); });

  let imagesToLoad = slides.length;
  let imagesSeen = 0;
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (!img) { imagesSeen++; return; }
    if (img.complete) { imagesSeen++; }
    else { img.addEventListener('load', () => { imagesSeen++; }); img.addEventListener('error', () => { imagesSeen++; }); }
  });

  function finalizeLayout() {
    setSizes();
    const timeout = setTimeout(() => setSizes(), 300);
    const interval = setInterval(() => {
      if (imagesSeen >= imagesToLoad) { clearInterval(interval); clearTimeout(timeout); setSizes(); }
    }, 100);
  }
  finalizeLayout();

  let resizeTimer = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { setSizes(); }, 120); });

  updateTrackPosition();
})();

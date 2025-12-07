// js/carousel.js
// =======================
// Past Books Carousel (defensive: removes duplicate buttons / avoids double-init)
// =======================
(function () {
  // Avoid running twice
  if (window.__GRACES_CAROUSEL_LOADED) return;
  window.__GRACES_CAROUSEL_LOADED = true;

  (async function initPastBooksCarousel() {
    const track = document.querySelector('.carousel-track');
    const trackWrapper = document.querySelector('.carousel-track-wrapper');
    if (!track || !trackWrapper) return;

    // Remove any pre-existing carousel buttons in the DOM to avoid duplicates
    // (these might be inlined in the HTML or left from a previous init)
    document.querySelectorAll('.carousel .carousel-btn, .carousel-btn.prev, .carousel-btn.next').forEach(btn => btn.remove());
    // Also remove any controls container left behind
    const existingControls = document.querySelectorAll('.carousel-controls');
    existingControls.forEach(c => c.remove());

    const PLACEHOLDER = 'https://raw.githubusercontent.com/tiaxcrystal/gracesbookclub/main/images/favicon.png';

    // fetch data
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

    // clear existing slides
    track.innerHTML = '';

    // build slides
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-slide';
      li.setAttribute('data-index', idx);
      li.style.boxSizing = 'border-box';

      const imgUrl = (it.picture && it.picture.trim()) ? it.picture.trim()
                   : (it.pictureLink && it.pictureLink.trim()) ? it.pictureLink.trim()
                   : (it.link && it.link.trim() && it.link.match(/\.(png|jpg|jpeg|gif)$/i) ? it.link.trim() : '')
                   ;

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

    // create controls container under track wrapper (single source of truth)
    let controlsBar = document.querySelector('.carousel-controls');
    if (!controlsBar) {
      controlsBar = document.createElement('div');
      controlsBar.className = 'carousel-controls';
      trackWrapper.insertAdjacentElement('afterend', controlsBar);
    } else {
      controlsBar.innerHTML = '';
    }

    // create prev/next buttons
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

    // keyboard accessibility
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    // image load tracking then finalize layout
    const slidesSnapshot = Array.from(track.children);
    let imagesToLoad = slidesSnapshot.length;
    let imagesSeen = 0;
    slidesSnapshot.forEach(slide => {
      const img = slide.querySelector('img');
      if (!img) {
        imagesSeen++;
        return;
      }
      if (img.complete) {
        imagesSeen++;
      } else {
        img.addEventListener('load', () => { imagesSeen++; });
        img.addEventListener('error', () => { imagesSeen++; });
      }
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

    // resize handler (debounced)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setSizes();
      }, 120);
    });

    // initial state for buttons
    updateTrackPosition();
  })();
})();

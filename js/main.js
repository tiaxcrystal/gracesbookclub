// =======================
// Navigation: switch active container (includes past-books section)
// =======================
const navButtons = document.querySelectorAll('.nav-bar button');
const containers = document.querySelectorAll('.container, .past-books-section');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    containers.forEach(c => c.classList.remove('active'));
    const el = document.getElementById(target);
    if (el) el.classList.add('active');
  });
});

// =======================
// RSVP Section
// =======================
const rsvpForm = document.getElementById('rsvpForm');
const rsvpTableBody = document.querySelector('#rsvp-table tbody');
const meetingDate = document.getElementById('meeting-date');
const meetingTheme = document.getElementById('meeting-theme');

async function loadRSVPs() {
  try {
    const data = await fetch('/.netlify/functions/getRSVPs').then(r => r.json());
    rsvpTableBody.innerHTML = '';
    data.reverse().forEach(entry => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td'); nameCell.textContent = entry.name;
      const bringingCell = document.createElement('td'); bringingCell.textContent = entry.bringing;
      row.appendChild(nameCell); row.appendChild(bringingCell);
      rsvpTableBody.appendChild(row);
    });
  } catch(e) { console.error('Error loading RSVPs:', e); }
}

async function loadMeetingInfo() {
  try {
    const info = await fetch('/.netlify/functions/getMeetingInfo').then(r => r.json());
    meetingDate.textContent = `Date: ${info.date}`;
    meetingTheme.textContent = `Theme: ${info.theme}`;
  } catch(e) { console.error('Error loading meeting info:', e); }
}

loadRSVPs();
loadMeetingInfo();
setInterval(() => { loadRSVPs(); loadMeetingInfo(); }, 5000);

rsvpForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = this.name.value.trim();
  const bringing = this.bringing.value.trim();
  if (!name || !bringing) return;
  try {
    await fetch('/.netlify/functions/addRSVP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bringing })
    });
    this.reset();
    loadRSVPs();
  } catch (err) {
    console.error('Error submitting RSVP:', err);
  }
});

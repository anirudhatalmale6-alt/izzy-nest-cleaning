// Mobile nav toggle
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
toggle && toggle.addEventListener('click', () => nav.classList.toggle('open'));
nav && nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Booking form (demo — no backend yet)
const form = document.getElementById('bookForm');
const note = document.getElementById('formNote');
form && form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  if (!data.get('name') || !data.get('phone') || !data.get('service')) {
    note.textContent = 'Please add your name, phone and a service.';
    note.classList.remove('ok');
    return;
  }
  note.textContent = 'Thank you! Your request has been received — we\'ll confirm shortly. 💗';
  note.classList.add('ok');
  form.reset();
});

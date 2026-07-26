// ===== Mobile nav =====
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
toggle && toggle.addEventListener('click', () => nav.classList.toggle('open'));
nav && nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Booking wizard =====
const form = document.getElementById('bookForm');
if (form) {
  const steps = Array.from(form.querySelectorAll('.wiz-step'));
  const bar = document.getElementById('wizBar');
  const stepLabels = document.querySelectorAll('#wizSteps span');
  const backBtn = document.getElementById('wizBack');
  const nextBtn = document.getElementById('wizNext');
  const submitBtn = document.getElementById('wizSubmit');
  const note = document.getElementById('formNote');
  const estimateEl = document.getElementById('estimate');
  const estimateNote = document.getElementById('estimateNote');
  let current = 0;

  // ---- WHERE BOOKINGS ARE EMAILED ----
  // FormSubmit needs a one-time confirmation click from this inbox on the first
  // real submission. Update to the client's preferred booking inbox.
  const BOOKING_EMAIL = 'izzynestcleaning@hotmail.com';

  function showStep(i) {
    steps.forEach((s, idx) => (s.hidden = idx !== i));
    bar.style.width = ((i + 1) / steps.length) * 100 + '%';
    stepLabels.forEach((l, idx) => l.classList.toggle('active', idx <= i));
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === steps.length - 1;
    submitBtn.hidden = i !== steps.length - 1;
    current = i;
    note.textContent = '';
  }

  function validStep(i) {
    const required = steps[i].querySelectorAll('[required]');
    for (const el of required) {
      if (el.type === 'radio') {
        if (!steps[i].querySelector(`[name="${el.name}"]:checked`)) return el.name;
      } else if (!el.value.trim()) {
        return el;
      }
    }
    return null;
  }

  function calcEstimate() {
    const pack = form.querySelector('[name="package"]:checked');
    if (!pack) { estimateEl.textContent = '£0'; estimateNote.textContent = 'select a package'; return; }
    let total = +pack.dataset.price;
    form.querySelectorAll('[name="extras"]:checked').forEach(e => total += +e.dataset.price);
    const freq = form.querySelector('[name="frequency"]:checked');
    let discNote = '';
    if (freq && +freq.dataset.disc > 0) {
      total = Math.round(total * (1 - +freq.dataset.disc));
      discNote = ` · ${freq.value} saving applied`;
    }
    estimateEl.textContent = '£' + total;
    estimateNote.textContent = 'estimate — final quote confirmed' + discNote;
  }

  form.addEventListener('change', calcEstimate);

  nextBtn.addEventListener('click', () => {
    const bad = validStep(current);
    if (bad) {
      note.textContent = current === 0 ? 'Please pick a package to continue.' :
        current === 2 ? 'Please choose how often you\'d like your clean.' :
        'Please fill in the required fields.';
      return;
    }
    showStep(Math.min(current + 1, steps.length - 1));
  });

  backBtn.addEventListener('click', () => showStep(Math.max(current - 1, 0)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = validStep(current);
    if (bad) { note.textContent = 'Please complete your name, phone, email and address.'; return; }

    const data = new FormData(form);
    const extras = data.getAll('extras');
    const payload = {
      Package: data.get('package'),
      Extras: extras.length ? extras.join(', ') : 'None',
      Frequency: data.get('frequency'),
      Bedrooms: data.get('bedrooms'),
      Bathrooms: data.get('bathrooms'),
      Pets: data.get('pets'),
      Parking: data.get('parking'),
      'Special requirements': data.get('requirements') || '—',
      Name: data.get('name'),
      Phone: data.get('phone'),
      Email: data.get('email'),
      'Property address': data.get('address'),
      'Preferred date': data.get('date') || 'Flexible',
      'Preferred time': data.get('time') || 'Flexible',
      'Estimated total': estimateEl.textContent,
      _subject: 'New Izzy Nest booking — ' + data.get('name'),
    };

    submitBtn.disabled = true;
    note.textContent = 'Sending your request…';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + BOOKING_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('bad status');
      form.reset();
      calcEstimate();
      showStep(0);
      note.classList.add('ok');
      note.textContent = 'Thank you! Your booking request has been sent — we\'ll confirm shortly. 💗';
    } catch (err) {
      note.textContent = 'Sorry, something went wrong. Please call or WhatsApp us on +44 7388 582981 and we\'ll sort it right away.';
    } finally {
      submitBtn.disabled = false;
    }
  });

  showStep(0);
  calcEstimate();
}

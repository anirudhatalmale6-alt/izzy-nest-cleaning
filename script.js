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

  // Regular cleaning price matrix: bedrooms -> frequency -> £ (weekly = best value)
  const MATRIX = {
    1: { Weekly: 40, Fortnightly: 45, Monthly: 50 },
    2: { Weekly: 55, Fortnightly: 60, Monthly: 65 },
    3: { Weekly: 70, Fortnightly: 75, Monthly: 80 },
    4: { Weekly: 90, Fortnightly: 95, Monthly: 100 },
    5: { Weekly: 110, Fortnightly: 120, Monthly: 130 },
  };
  const bedIndex = (v) => {
    if (!v) return null;
    if (v === 'Studio' || v === '1') return 1;
    if (v === '5+') return 5;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : Math.min(Math.max(n, 1), 5);
  };
  const selectedType = () => {
    const p = form.querySelector('[name="package"]:checked');
    return p ? p.dataset.type : null;
  };

  // Frequency step is rendered to match the chosen clean
  const freqChoices = document.getElementById('freqChoices');
  const freqHeading = document.getElementById('freqHeading');
  function renderFrequency() {
    const type = selectedType();
    if (type === 'oneoff') {
      freqHeading.textContent = 'This is a one-off clean';
      freqChoices.innerHTML =
        '<label class="freq"><input type="radio" name="frequency" value="One-Off Clean" checked required />' +
        '<span><strong>One-Off Clean</strong><em>No commitment — pay once</em></span></label>';
    } else {
      freqHeading.textContent = 'How often would you like your clean?';
      freqChoices.innerHTML =
        '<label class="freq"><input type="radio" name="frequency" value="Weekly" required /><span><strong>Weekly</strong><em>Best value</em></span></label>' +
        '<label class="freq"><input type="radio" name="frequency" value="Fortnightly" /><span><strong>Fortnightly</strong><em>Every 2 weeks</em></span></label>' +
        '<label class="freq"><input type="radio" name="frequency" value="Monthly" /><span><strong>Monthly</strong><em>Once a month</em></span></label>';
    }
  }

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
    // Regular cleans need bedrooms to price the booking
    if (i === 3 && selectedType() === 'regular') {
      const bed = form.querySelector('[name="bedrooms"]');
      if (bed && !bed.value) return bed;
    }
    return null;
  }

  function extrasTotal() {
    let t = 0;
    form.querySelectorAll('[name="extras"]:checked').forEach(e => (t += +e.dataset.price));
    return t;
  }

  function calcEstimate() {
    const pack = form.querySelector('[name="package"]:checked');
    if (!pack) { estimateEl.textContent = '£0'; estimateNote.textContent = 'choose a clean'; return; }
    const extras = extrasTotal();
    const freq = form.querySelector('[name="frequency"]:checked');

    if (pack.dataset.type === 'oneoff') {
      const total = +pack.dataset.price + extras;
      estimateEl.textContent = '£' + total;
      estimateNote.textContent = 'one-off — final quote confirmed on booking';
      return;
    }

    // Regular clean — priced by bedrooms x frequency
    const bed = bedIndex(form.querySelector('[name="bedrooms"]') ? form.querySelector('[name="bedrooms"]').value : '');
    const f = freq ? freq.value : null;
    if (!f) {
      estimateEl.textContent = 'from £40';
      estimateNote.textContent = 'choose how often for your price';
    } else if (!bed) {
      const from = MATRIX[1][f];
      estimateEl.textContent = 'from £' + (from + extras);
      estimateNote.textContent = f + ' — add bedrooms in step 4 for exact price';
    } else {
      const total = MATRIX[bed][f] + extras;
      estimateEl.textContent = '£' + total;
      estimateNote.textContent = f + ' regular clean' + (f === 'Weekly' ? ' · best value' : '');
    }
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'package') renderFrequency();
    calcEstimate();
  });

  nextBtn.addEventListener('click', () => {
    const bad = validStep(current);
    if (bad) {
      note.textContent = current === 0 ? 'Please choose a clean to continue.' :
        current === 2 ? 'Please choose how often you\'d like your clean.' :
        current === 3 ? 'Please select your number of bedrooms so we can price your clean.' :
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

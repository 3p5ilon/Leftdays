(function () {
  const yearGridEl = document.getElementById('yearGrid');
  const headlineEl = document.getElementById('headline');
  const nameForm = document.getElementById('nameForm');
  const nameInput = document.getElementById('nameInput');
  const now = new Date();

  function monthNames() {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  }

  function storageGet(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get([key], (res) => resolve(res[key]));
      } else {
        resolve(localStorage.getItem(key));
      }
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ [key]: value }, () => resolve());
      } else {
        localStorage.setItem(key, value);
        resolve();
      }
    });
  }

  function render() {
    const year = new Date().getFullYear();
    yearGridEl.innerHTML = '';

    const today = new Date(); today.setHours(0,0,0,0);
    const names = monthNames();

    for (let m = 0; m < 12; m++) {
      const block = document.createElement('div');
      block.className = 'month-block';

      const nameEl = document.createElement('div');
      nameEl.className = 'month-name';
      nameEl.textContent = names[m];
      block.appendChild(nameEl);

      const daysEl = document.createElement('div');
      daysEl.className = 'month-days';

      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      const totalDays = last.getDate();

      // Only actual month days, no placeholders
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, m, d);
        const cell = document.createElement('div');
        cell.className = 'day';

        const cmp = date.getTime() - today.getTime();
        if (cmp === 0) {
          cell.classList.add('today');
        } else if (date.getDay() === 0) {
          // Sundays (except today) get a distinct color
          cell.classList.add('sunday');
        } else if (cmp < 0) {
          cell.classList.add('past');
        } else {
          cell.classList.add('future');
        }
        // Store a locale-aware date string for the tooltip (uses user's local timezone)
        cell.dataset.dateStr = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        daysEl.appendChild(cell);
      }

      block.appendChild(daysEl);
      yearGridEl.appendChild(block);
    }

    // Headline: name + remaining days (year, month) + percent remaining
    if (headlineEl) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const yearEnd = new Date(year, 11, 31); yearEnd.setHours(0,0,0,0);
      const yearStart = new Date(year, 0, 1); yearStart.setHours(0,0,0,0);
      const remainingYear = Math.max(0, Math.floor((yearEnd - today) / msPerDay) + 1);
      const totalYearDays = Math.floor((yearEnd - yearStart) / msPerDay) + 1;
      const pctRemain = ((remainingYear / totalYearDays) * 100).toFixed(1);

      const m = today.getMonth();
      const monthEnd = new Date(year, m + 1, 0); monthEnd.setHours(0,0,0,0);
      const remainingMonth = Math.max(0, Math.floor((monthEnd - today) / msPerDay) + 1);

      storageGet('userName').then((userName) => {
        if (!userName) {
          // Show name input once if not set
          if (nameForm) nameForm.style.display = 'flex';
          if (nameInput) nameInput.focus();
          userName = '';
        } else if (nameForm) {
          nameForm.style.display = 'none';
        }
        const firstLine = userName
          ? `${userName}, only <span class="num-red">${remainingYear}</span> days remain`
          : `Only <span class="num-red">${remainingYear}</span> days remain`;
        const secondLine = `Only <span class="num-red">${remainingMonth}</span> days left in ${names[m]}`;

        headlineEl.innerHTML = `
          <div class="h1">${firstLine}</div>
          <div class="h2">${secondLine}</div>
        `;
      });
    }
  }

  function scheduleMidnightRefresh() {
    // Re-render at the next midnight
    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    const ms = next.getTime() - now.getTime();
    setTimeout(() => {
      render();
      scheduleMidnightRefresh();
    }, ms + 50);
  }

  // Initial render
  render();
  scheduleMidnightRefresh();

  // Handle name form submit
  if (nameForm) {
    nameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = (nameInput && nameInput.value || '').trim();
      if (v) await storageSet('userName', v);
      render();
    });
  }

  // Custom tooltip (shows after 1s on hover)
  let tooltipEl = null;
  let hoverTimer = null;
  let currentTarget = null;

  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'ld-tooltip';
      document.body.appendChild(tooltipEl);
    }
  }

  function showTooltip(text, x, y) {
    ensureTooltip();
    tooltipEl.textContent = text;
    const offset = 12;
    tooltipEl.style.left = `${x + offset}px`;
    tooltipEl.style.top = `${y + offset}px`;
    tooltipEl.classList.add('show');
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
  }

  // Event delegation on the whole document for newly rendered cells
  document.addEventListener('mousemove', (e) => {
    if (!e.target || !(e.target instanceof Element)) return;
    const el = e.target.closest('.day');
    if (el && el.dataset && el.dataset.dateStr && !el.classList.contains('empty')) {
      if (currentTarget !== el) {
        // New target, restart timer
        currentTarget = el;
        clearTimeout(hoverTimer);
        hideTooltip();
        hoverTimer = setTimeout(() => {
          showTooltip(el.dataset.dateStr, e.clientX, e.clientY);
        }, 1000);
      } else if (tooltipEl && tooltipEl.classList.contains('show')) {
        // Update position while shown
        tooltipEl.style.left = `${e.clientX + 12}px`;
        tooltipEl.style.top = `${e.clientY + 12}px`;
      }
    } else {
      // Left the cell
      currentTarget = null;
      clearTimeout(hoverTimer);
      hideTooltip();
    }
  });
})();

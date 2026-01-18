(function () {
  const yearGridEl = document.getElementById('yearGrid');
  const headlineEl = document.getElementById('headline');
  const nameForm = document.getElementById('nameForm');
  const nameInput = document.getElementById('nameInput');

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
    yearGridEl.innerHTML = ''; 

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const year = now.getFullYear();

    const yearStart = new Date(year, 0, 1);
    const startDayIndex = yearStart.getDay(); 
    
    for (let i = 0; i < startDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'day void';
        yearGridEl.appendChild(empty);
    }

    const yearEnd = new Date(year, 11, 31);
    let totalCells = startDayIndex;

    for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
        const cell = document.createElement('div');
        cell.className = 'day';
        
        const currentMs = d.getTime();
        const todayMs = today.getTime();
        const dayOfWeek = d.getDay();

        if (currentMs === todayMs) {
          cell.classList.add('today');
        } else if (dayOfWeek === 0) {
          cell.classList.add('sunday'); 
        } else if (currentMs < todayMs) {
          cell.classList.add('past');
        } else {
          cell.classList.add('future');
        }

        if (currentMs < todayMs && dayOfWeek === 0) {
           cell.classList.remove('sunday');
           cell.classList.add('past');
        }

        const dateStr = d.toLocaleDateString(undefined, { 
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
        });
        cell.dataset.dateStr = dateStr;
        
        yearGridEl.appendChild(cell);
        totalCells++;
    }

    const TARGET_CELLS = 53 * 7;
    while (totalCells < TARGET_CELLS) {
        const empty = document.createElement('div');
        empty.className = 'day void';
        yearGridEl.appendChild(empty);
        totalCells++;
    }

    if (headlineEl) {
      const msPerDay = 86400000;
      const totalYearDays = Math.floor((yearEnd - yearStart) / msPerDay) + 1;
      const remainingYear = Math.max(0, Math.floor((yearEnd - today) / msPerDay) + 1);
      const daysPassed = totalYearDays - remainingYear;
      const pctPassed = Math.floor((daysPassed / totalYearDays) * 100);
      
      const m = today.getMonth();
      const monthEnd = new Date(year, m + 1, 0); 
      monthEnd.setHours(0,0,0,0);
      const remainingMonth = Math.max(0, Math.floor((monthEnd - today) / msPerDay) + 1);

      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      
      storageGet('userName').then((userName) => {
        if (!userName) {
          if (nameForm) nameForm.style.display = 'flex';
          if (nameInput) nameInput.focus();
        } else if (nameForm) {
          nameForm.style.display = 'none';
        }

        const nameDisplay = userName ? `${userName}` : '';
        
        headlineEl.innerHTML = `
          <div class="h1">${nameDisplay} &bull; <span class="num-red">${remainingYear}</span> days left &bull; <span class="num-red">${pctPassed}%</span></div>
          <div class="h2"><span class="num-red">${remainingMonth}</span> days left in ${MONTHS[m]} &bull; <span class="num-red">${timeStr}</span></div>
        `;
      });
    }
  }

  function startClock() {
    const now = new Date();
    const msToNextMinute = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();
    
    setTimeout(() => {
      render();
      setInterval(render, 60000);
    }, msToNextMinute);
  }

  render();
  startClock();

  if (nameForm) {
    nameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = (nameInput && nameInput.value || '').trim();
      if (val) {
        await storageSet('userName', val);
        render();
      }
    });
  }

  let tooltipEl = null;
  let hoverTimer = null;
  let currentTarget = null;
  const TOOLTIP_DELAY = 1000;

  document.addEventListener('mousemove', (e) => {
    if (!e.target || !e.target.classList) return;
    
    const cell = e.target.closest('.day');
    const isValidDay = cell && cell.dataset.dateStr && !cell.classList.contains('void');

    if (isValidDay) {
       if (currentTarget !== cell) {
         currentTarget = cell;
         clearTimeout(hoverTimer);
         hideTooltip();
         hoverTimer = setTimeout(() => {
           showTooltip(cell.dataset.dateStr, e.clientX, e.clientY);
         }, TOOLTIP_DELAY);
       } else if (tooltipEl && tooltipEl.classList.contains('show')) {
         updateTooltipPos(e.clientX, e.clientY);
       }
    } else {
       currentTarget = null;
       clearTimeout(hoverTimer);
       hideTooltip();
    }
  });

  function showTooltip(text, x, y) {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'ld-tooltip';
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.textContent = text;
    updateTooltipPos(x, y);
    tooltipEl.classList.add('show');
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
  }

  function updateTooltipPos(x, y) {
    if (tooltipEl) {
      tooltipEl.style.left = (x + 12) + 'px';
      tooltipEl.style.top = (y + 12) + 'px';
    }
  }

})();

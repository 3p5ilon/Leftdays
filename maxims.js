(function() {
const MAXIMS = [
  "Speed forces you to decide what actually matters.",
  "Time is the denominator in every meaningful outcome.",
  "Reality gives clearer answers than reflection alone.",
  "Momentum creates clarity more reliably than planning does. ",
  "You learn faster when you touch reality more often.",
  "Progress comes from action, not thought.",
  "Days are the real unit of progress.",
  "Going fast makes you focus on what's important; there's no time for bullshit.",
  "A week is 2% of the year.",
  "What ships teaches more than what plans.",
  "Urgency clarifies priorities.",
  "Constraints make work concrete.",
  "Action reduces confusion.",
  "Time limits everything else."
];

  function getDailyMaxim() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Rotate through maxims based on day of year
    const index = dayOfYear % MAXIMS.length;
    return MAXIMS[index];
  }

  function renderMaxim() {
    let containerEl = document.getElementById('dailyMaxim');
    if (!containerEl) containerEl = document.getElementById('dailyQuote');
    
    if (!containerEl) return;

    const text = getDailyMaxim();
    containerEl.innerHTML = `<div class="maxim-text">${text}</div>`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMaxim);
  } else {
    renderMaxim();
  }
})();

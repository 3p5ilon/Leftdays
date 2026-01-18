(function () {
  function initNotes() {
    const readView = document.getElementById('notesReadView');
    const editView = document.getElementById('notesEditView');
    
    if (!readView || !editView) return;

    // --- Storage Helpers ---
    function storageGet(key) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get([key], (res) => resolve(res ? res[key] : null));
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

    // --- Core Logic ---
    function renderReader(text) {
        if (!text) {
            readView.innerHTML = '<span style="color:#888; font-style:italic">Press "i" to edit notes...</span>';
            return;
        }
        
        let html = '';
        const lines = text.split('\n');
        
        lines.forEach(line => {
            // XSS Prevention
            let content = line.replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")
                              .replace(/"/g, "&quot;")
                              .replace(/'/g, "&#039;");
            
            // Markers: Headers (#, ##, ###) -> Bullets (-x, --x) -> Links
            if (/^\s*###\s/.test(content)) {
                content = `<span class="note-h3">${content.replace(/^\s*###\s/, '')}</span>`;
            } else if (/^\s*##\s/.test(content)) {
                content = `<span class="note-h2">${content.replace(/^\s*##\s/, '')}</span>`;
            } else if (/^\s*#\s/.test(content)) {
                content = `<span class="note-h1">${content.replace(/^\s*#\s/, '')}</span>`;
            } else if (/^\s*---x\s/.test(content)) {
                content = formatLine(content, '---x', 40, true);
            } else if (/^\s*--x\s/.test(content)) {
                content = formatLine(content, '--x', 20, true);
            } else if (/^\s*---\s/.test(content)) {
                content = formatLine(content, '---', 40, false);
            } else if (/^\s*--\s/.test(content)) {
                content = formatLine(content, '--', 20, false);
            } else if (/^\s*-x\s/.test(content)) {
                content = formatLine(content, '-x', 0, true);
            } else if (/^\s*-\s/.test(content)) {
                content = formatLine(content, '-', 0, false);
            }
            
            // Link Parsing [text](url)
            content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, p1, p2) => {
                let url = p2;
                if (!url.match(/^[a-zA-Z]+:\/\//)) url = 'https://' + url;
                return `<a href="${url}" target="_blank">${p1}</a>`;
            });

            html += `<div class="note-line">${content}</div>`;
        });
        
        readView.innerHTML = html;
    }

    function formatLine(text, prefix, margin, isStrike) {
        const cleanText = text.replace(new RegExp(`^\\s*${prefix}\\s`), '');
        const style = isStrike ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
        const bulletMargin = margin > 0 ? `margin-left:${margin}px;` : '';
        return `<span style="${bulletMargin} margin-right:6px">•</span><span ${style}>${cleanText}</span>`;
    }
    
    function switchToEdit() {
        readView.style.display = 'none';
        editView.style.display = 'block';
        editView.focus();
    }
    
    function switchToRead() {
        const text = editView.value;
        storageSet('userNotes', text);
        renderReader(text);
        
        editView.style.display = 'none';
        readView.style.display = 'block';
        readView.focus(); 
    }

    // --- Init Load ---
    storageGet('userNotes').then((notes) => {
        const text = notes || '';
        editView.value = text;
        renderReader(text);
        editView.style.display = 'none';
        readView.style.display = 'block';
    });

    // --- Input Handling ---
    let debounceTimer;
    editView.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            storageSet('userNotes', editView.value);
        }, 1000);
    });

    // --- Key Bindings ---
    // Global 'i' to edit
    document.addEventListener('keydown', (e) => {
        if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
        if (e.key === 'i') {
            e.preventDefault();
            switchToEdit();
        }
    });

    // Editor Shortcuts
    editView.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + Enter to Save
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            switchToRead();
        }
        // Tab Indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editView.selectionStart;
            const end = editView.selectionEnd;
            const val = editView.value;
            editView.value = val.substring(0, start) + "  " + val.substring(end);
            editView.selectionStart = editView.selectionEnd = start + 2;
        }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotes);
  } else {
    initNotes();
  }
})();

// Global variables
let currentUserQuery = '';
let currentFilter = '';
let hasResults = false;

// Initialize when page loads
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
    updateClearButton();
});

// Search on Enter key
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Show/hide clear button based on input content
document.getElementById('searchInput').addEventListener('input', function() {
    updateClearButton();
    
    const query = this.value.trim();
    currentUserQuery = cleanUserQuery(query);
    
    // If user clears input, close results
    if (query === '' && hasResults) {
        setTimeout(() => {
            if (this.value.trim() === '') {
                closeIframe();
                currentUserQuery = '';
                currentFilter = '';
            }
        }, 100);
    }
});

// Update clear button visibility
function updateClearButton() {
    const clearBtn = document.getElementById('clearBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput.value.trim() !== '') {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }
}

// Clear search function
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    searchInput.focus();
    updateClearButton();
    closeIframe();
    currentUserQuery = '';
    currentFilter = '';
}

// Main search function
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    // If empty query, close results and return
    if (!query) {
        closeIframe();
        return;
    }
    
    // Update user query (remove any existing filters)
    currentUserQuery = cleanUserQuery(query);
    
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(query)}`;
    showInIframe(searchUrl, query);
}

// Clean user query by removing filter patterns
function cleanUserQuery(query) {
    // Remove filter patterns like *.ext|*.ext2, size:, dm:, folder:
    let cleaned = query;
    
    // Remove file extension patterns
    cleaned = cleaned.replace(/\*\.[a-zA-Z0-9]+(\|\*\.[a-zA-Z0-9]+)*/g, '');
    
    // Remove size filters
    cleaned = cleaned.replace(/size:[^\s]+/g, '');
    
    // Remove date filters
    cleaned = cleaned.replace(/dm:[^\s]+/g, '');
    
    // Remove folder filters
    cleaned = cleaned.replace(/folder:/g, '');
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Apply quick filter while preserving user query
function applyQuickFilter(filter) {
    // Store the new filter
    currentFilter = filter;
    
    let combinedQuery = '';
    
    // If user has entered a query, combine it with the filter
    if (currentUserQuery.trim()) {
        combinedQuery = `${filter} ${currentUserQuery.trim()}`;
    } else {
        // If no user query, just use the filter
        combinedQuery = filter;
    }
    
    // Perform search with combined query but don't show filter in input
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(combinedQuery)}`;
    showInIframe(searchUrl, combinedQuery);
}

// Search Google function
function searchGoogle() {
    const query = currentUserQuery.trim();
    if (query) {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleUrl, '_blank');
    } else {
        // If no query, just open Google
        window.open('https://www.google.com', '_blank');
    }
}

// Show results in iframe with CSS injection to hide Everything header
function showInIframe(url, query) {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    const urlDisplay = document.getElementById('iframeUrl');
    
    // Show iframe
    container.style.display = 'block';
    iframe.src = url;
    urlDisplay.textContent = url.replace('http://', '');
    
    // Inject CSS to hide Everything header after iframe loads
    iframe.onload = function() {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Create style element to hide Everything header and search
            const style = iframeDoc.createElement('style');
            style.textContent = `
                /* Hide Everything header and search */
                h1 { display: none !important; }
                input[type="text"] { display: none !important; }
                form { display: none !important; }
                /* Keep only results table */
                body > * { display: none !important; }
                table, .results { display: table !important; }
                /* Show results content */
                body > table:last-of-type { display: table !important; }
                body > div:last-child { display: block !important; }
                /* Clean up layout */
                body { padding: 10px !important; margin: 0 !important; }
            `;
            
            iframeDoc.head.appendChild(style);
        } catch (e) {
            // Cross-origin restrictions - can't inject CSS
            console.log('Cannot inject CSS due to CORS restrictions');
        }
    };
    
    hasResults = true;
}

// Close iframe
function closeIframe() {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    
    // Hide iframe
    container.style.display = 'none';
    iframe.src = '';
    iframe.onload = null;
    
    // Reset state
    hasResults = false;
    currentFilter = '';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape to close iframe or clear search
    if (e.key === 'Escape') {
        if (hasResults) {
            closeIframe();
        } else {
            clearSearch();
        }
    }
});

// Handle Everything Web link - always open clean
document.querySelector('a[href="http://localhost:8080"]').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('http://localhost:8080', '_blank');
});
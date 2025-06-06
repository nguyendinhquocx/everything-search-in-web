// Global variables
let currentUserQuery = '';
let hasResults = false;

// Initialize when page loads
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
});

// Search on Enter key
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Main search function
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    // If empty query, close results and return
    if (!query) {
        closeIframe();
        return;
    }
    
    currentUserQuery = query;
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(query)}`;
    showInIframe(searchUrl, query);
}

// Apply quick filter while preserving user query
function applyQuickFilter(filter) {
    const userQuery = currentUserQuery.trim();
    let combinedQuery = '';
    
    // If user has entered a query, combine it with the filter
    if (userQuery) {
        combinedQuery = `${filter} ${userQuery}`;
    } else {
        // If no user query, just use the filter
        combinedQuery = filter;
    }
    
    // Update search input to show combined query
    document.getElementById('searchInput').value = combinedQuery;
    
    // Perform search with combined query
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(combinedQuery)}`;
    showInIframe(searchUrl, combinedQuery);
}

// Show results in iframe
function showInIframe(url, query) {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    const urlDisplay = document.getElementById('iframeUrl');
    const searchSection = document.getElementById('searchSection');
    const quickActions = document.getElementById('quickActions');
    
    // Show iframe
    container.style.display = 'block';
    iframe.src = url;
    urlDisplay.textContent = url.replace('http://', '');
    
    // Keep search section in place (don't scroll up)
    hasResults = true;
    
    // Don't scroll to iframe, keep current position
    // Removed scrollIntoView to keep search box visible
}

// Close iframe
function closeIframe() {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    const searchSection = document.getElementById('searchSection');
    const quickActions = document.getElementById('quickActions');
    
    // Hide iframe
    container.style.display = 'none';
    iframe.src = '';
    
    // Reset layout
    hasResults = false;
    searchSection.classList.remove('fixed');
    quickActions.classList.remove('with-results');
    document.body.classList.remove('content-spacing');
}

// Update current user query when input changes
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.trim();
    // Only update if it's a simple user query (not a filter combination)
    if (!query.includes('*.') && !query.includes('size:') && !query.includes('dm:')) {
        currentUserQuery = query;
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape to close iframe
    if (e.key === 'Escape') {
        closeIframe();
    }
});

// Clear search when input is cleared
document.getElementById('searchInput').addEventListener('input', function() {
    if (this.value.trim() === '' && hasResults) {
        // If user clears input and there are results showing, close them
        setTimeout(() => {
            if (this.value.trim() === '') {
                closeIframe();
                currentUserQuery = '';
            }
        }, 100);
    }
});
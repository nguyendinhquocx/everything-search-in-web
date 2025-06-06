// Global variables
let currentUserQuery = '';
let currentFilter = '';
let selectedDrives = new Set(); // Use Set to track multiple selected drives
let hasResults = false;

// Initialize when page loads
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
});

// Search on Enter key and Ctrl+Enter for Google
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            searchGoogleWithCurrentInput();
        } else {
            performSearch();
        }
    }
});

document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchGoogleWithCurrentInput();
    }
});

// Update current user query when input changes
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.trim();
    currentUserQuery = cleanUserQuery(query);
    
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

// Toggle drive selection - new logic
function toggleDrive(drive) {
    const checkbox = document.getElementById(`drive${drive.replace(':', '')}`);
    
    if (selectedDrives.has(drive)) {
        // If already selected, unselect it
        selectedDrives.delete(drive);
        checkbox.classList.remove('active');
    } else {
        // If not selected, select it
        selectedDrives.add(drive);
        checkbox.classList.add('active');
    }
    
    // Re-search if there are current results
    if (hasResults) {
        performSearch();
    }
}

// Get current drive filter string
function getDriveFilter() {
    if (selectedDrives.size === 0) {
        return ''; // No drives selected = search all
    }
    
    // Create filter string for selected drives
    return Array.from(selectedDrives).join(' ');
}

// Main search function
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        closeIframe();
        return;
    }
    
    currentUserQuery = cleanUserQuery(query);
    
    // Add drive filter if any drives are selected
    let finalQuery = query;
    const driveFilter = getDriveFilter();
    if (driveFilter) {
        finalQuery = `${driveFilter} ${query}`;
    }
    
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(finalQuery)}`;
    showInIframe(searchUrl, finalQuery);
}

// Clean user query by removing filter patterns
function cleanUserQuery(query) {
    let cleaned = query;
    
    // Remove file extension patterns
    cleaned = cleaned.replace(/\*\.[a-zA-Z0-9]+(\|\*\.[a-zA-Z0-9]+)*/g, '');
    
    // Remove size filters
    cleaned = cleaned.replace(/size:[^\s]+/g, '');
    
    // Remove date filters
    cleaned = cleaned.replace(/dm:[^\s]+/g, '');
    
    // Remove folder filters
    cleaned = cleaned.replace(/folder:/g, '');
    
    // Remove drive filters
    cleaned = cleaned.replace(/[A-Z]:/g, '');
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Apply quick filter while preserving user query
function applyQuickFilter(filter) {
    currentFilter = filter;
    
    let combinedQuery = '';
    
    if (currentUserQuery.trim()) {
        combinedQuery = `${filter} ${currentUserQuery.trim()}`;
    } else {
        combinedQuery = filter;
    }
    
    // Add drive filter if any drives are selected
    const driveFilter = getDriveFilter();
    if (driveFilter) {
        combinedQuery = `${driveFilter} ${combinedQuery}`;
    }
    
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(combinedQuery)}`;
    showInIframe(searchUrl, combinedQuery);
}

// Search Google with current input
function searchGoogleWithCurrentInput() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleUrl, '_blank');
    } else {
        window.open('https://www.google.com', '_blank');
    }
}

// Show results in iframe
function showInIframe(url, query) {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    const urlDisplay = document.getElementById('iframeUrl');
    
    container.style.display = 'block';
    iframe.src = url;
    urlDisplay.textContent = url.replace('http://', '');
    
    iframe.onload = function() {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            const style = iframeDoc.createElement('style');
            style.textContent = `
                h1 { display: none !important; }
                input[type="text"] { display: none !important; }
                form { display: none !important; }
                body > * { display: none !important; }
                table, .results { display: table !important; }
                body > table:last-of-type { display: table !important; }
                body > div:last-child { display: block !important; }
                body { padding: 10px !important; margin: 0 !important; }
            `;
            
            iframeDoc.head.appendChild(style);
        } catch (e) {
            console.log('Cannot inject CSS due to CORS restrictions');
        }
    };
    
    hasResults = true;
}

// Close iframe
function closeIframe() {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    
    container.style.display = 'none';
    iframe.src = '';
    iframe.onload = null;
    
    hasResults = false;
    currentFilter = '';
}

// URL Converter functions
function openUrlConverter() {
    document.getElementById('urlConverterModal').classList.add('open');
    document.getElementById('urlInput').focus();
}

function closeUrlConverter() {
    document.getElementById('urlConverterModal').classList.remove('open');
    document.getElementById('urlInput').value = '';
    document.getElementById('pathOutput').value = '';
    resetCopyButton();
}

function pasteFromClipboard() {
    navigator.clipboard.readText()
        .then(text => {
            document.getElementById('urlInput').value = text;
            convertUrl();
        })
        .catch(err => {
            console.error('Cannot read clipboard: ', err);
        });
}

function convertUrl() {
    const urlInput = document.getElementById('urlInput');
    const pathOutput = document.getElementById('pathOutput');
    const url = urlInput.value.trim();
    
    if (!url) {
        pathOutput.value = '';
        return;
    }
    
    const localPath = convertUrlToLocalPath(url);
    pathOutput.value = localPath;
}

function convertUrlToLocalPath(url) {
    let result = url;
    
    if (url.startsWith('local-file-open://')) {
        result = decodeURIComponent(url.replace('local-file-open://', ''));
    } else if (url.includes('localhost') && url.includes('%3A')) {
        const urlParts = url.split('localhost:');
        if (urlParts.length > 1) {
            const portAndPath = urlParts[1];
            const pathStart = portAndPath.indexOf('/', 0);
            if (pathStart !== -1) {
                const pathPart = portAndPath.substring(pathStart + 1);
                result = decodeURIComponent(pathPart.replace('%3A', ':'));
            }
        }
    }
    
    return result.replace(/\//g, '\\');
}

function copyToClipboard() {
    const pathOutput = document.getElementById('pathOutput');
    const copyBtn = document.getElementById('copyBtn');
    
    if (!pathOutput.value) {
        return;
    }
    
    navigator.clipboard.writeText(pathOutput.value)
        .then(() => {
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            `;
            copyBtn.style.color = '#4caf50';
            
            setTimeout(() => {
                resetCopyButton();
            }, 2000);
        })
        .catch(err => {
            console.error('Cannot copy to clipboard: ', err);
        });
}

function resetCopyButton() {
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
        </svg>
    `;
    copyBtn.style.color = '';
}

// Auto-convert when typing in URL input
document.getElementById('urlInput').addEventListener('input', convertUrl);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape to close modals or iframe
    if (e.key === 'Escape') {
        if (document.getElementById('urlConverterModal').classList.contains('open')) {
            closeUrlConverter();
        } else if (hasResults) {
            closeIframe();
        }
    }
    
    // Ctrl+Shift+C to open URL converter
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        openUrlConverter();
    }
});

// Close modal when clicking overlay
document.getElementById('urlConverterModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeUrlConverter();
    }
});
// Global variables
let currentUserQuery = '';
let currentFilter = '';
let selectedDrives = new Set(['D:']); // Default to D: drive only
let selectedDateFilter = '';
let customDateRange = '';
let hasResults = false;
let isFullscreen = false;
let searchOnCDrive = false; // New variable to track C: drive selection

// Initialize when page loads
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
    initializeDateLabels();
    updateSearchTitle();
    document.addEventListener('click', closeDropdownsOnOutsideClick);
});

// Initialize date labels
function initializeDateLabels() {
    const today = new Date();
    
    document.getElementById('todayDate').textContent = formatDate(today);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    document.getElementById('thisWeekRange').textContent = 
        `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    document.getElementById('thisMonthRange').textContent = 
        `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`;
}

function formatDate(date) {
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit'
    });
}

// Updated search functionality with URL conversion
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+Enter: Tìm Google
            e.preventDefault();
            searchGoogleWithCurrentInput();
        } else {
            // Enter: Kiểm tra URL hoặc tìm kiếm
            e.preventDefault();
            handleSearchOrConvert(query);
        }
    }
});

document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchGoogleWithCurrentInput();
    }
});

// Updated input handler with URL detection
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.trim();
    currentUserQuery = cleanUserQuery(query);
    
    // Visual feedback for URL detection
    updateSearchVisualFeedback(query);
    
    if (query === '' && hasResults) {
        setTimeout(() => {
            if (this.value.trim() === '') {
                closeIframe();
                currentUserQuery = '';
                currentFilter = '';
                resetSearchVisual();
                resetQuickFilterUI();
            }
        }, 100);
    }
});

// Handle search or convert based on input
function handleSearchOrConvert(query) {
    if (!query) {
        closeIframe();
        return;
    }
    
    if (isLocalhostUrl(query)) {
        // Convert URL
        convertUrlDirectly(query);
    } else {
        // Normal unified search
        performUnifiedSearch();
    }
}

// Check if input is localhost URL
function isLocalhostUrl(input) {
    return input.includes('localhost') || input.startsWith('local-file-open://');
}

// Convert URL directly and copy to clipboard
function convertUrlDirectly(url) {
    const localPath = convertUrlToLocalPath(url);
    
    if (localPath) {
        navigator.clipboard.writeText(localPath)
            .then(() => {
                showConvertSuccess(localPath);
                // Clear search input
                document.getElementById('searchInput').value = '';
                resetSearchVisual();
            })
            .catch(err => {
                console.error('Cannot copy to clipboard: ', err);
                showConvertError();
            });
    }
}

// Visual feedback for URL detection
function updateSearchVisualFeedback(query) {
    const searchIcon = document.querySelector('.search-icon svg');
    const searchInput = document.getElementById('searchInput');
    
    if (isLocalhostUrl(query)) {
        // Change to convert icon
        searchIcon.innerHTML = `
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M16.5,11H13V7.5H11V11H7.5V13H11V16.5H13V13H16.5V11Z"/>
        `;
        searchInput.placeholder = 'Nhấn Enter để convert URL';
        searchIcon.style.fill = 'var(--accent-color)';
        searchInput.style.color = 'var(--accent-color)';
    } else {
        resetSearchVisual();
    }
}

// Reset search visual to default
function resetSearchVisual() {
    const searchIcon = document.querySelector('.search-icon svg');
    const searchInput = document.getElementById('searchInput');
    
    // Reset to search icon
    searchIcon.innerHTML = `
        <path d="M15.5 14h-.79l-.28-.27c.98-1.14 1.57-2.62 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 2.91-6.5 6.5 2.91 6.5 6.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/>
    `;
    searchInput.placeholder = 'Tìm kiếm';
    searchIcon.style.fill = '';
    searchInput.style.color = '';
}

// Show convert success notification
function showConvertSuccess(localPath) {
    const fileName = localPath.split('\\').pop() || localPath.split('/').pop();
    const message = ``;
    showToast(message, 'success');
    
    // Brief visual feedback on search input
    const searchInput = document.getElementById('searchInput');
    const originalPlaceholder = searchInput.placeholder;
    
    searchInput.placeholder = '✓ Đã copy đường dẫn';
    searchInput.style.color = 'var(--success-color)';
    
    setTimeout(() => {
        searchInput.placeholder = originalPlaceholder;
        searchInput.style.color = '';
    }, 2000);
}

// Show convert error
function showConvertError() {
    showToast('❌ Lỗi khi copy vào clipboard', 'error');
}

// ChatGPT-style minimalist toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    
    // ChatGPT-style minimalist design
    const colors = {
        success: '#2563eb',
        error: '#dc2626',
        info: '#2563eb'
    };
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-100%)',
        padding: '8px 16px',
        color: colors[type] || colors.info,
        fontSize: '14px',
        fontWeight: '400',
        zIndex: '9999',
        transition: 'transform 0.3s ease',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2500);
}

// Update search title
function updateSearchTitle() {
    const searchInput = document.getElementById('searchInput');
    searchInput.title = 'Enter: Tìm kiếm hoặc Convert URL | Ctrl+Enter: Tìm Google';
}

// Date filter functions (updated for unified search)
function toggleDateDropdown() {
    const dropdown = document.getElementById('dateDropdown');
    const btn = document.getElementById('dateBtn');
    
    dropdown.classList.toggle('open');
    btn.classList.toggle('open');
}

function selectQuickDate(period, displayText) {
    selectedDateFilter = period;
    document.getElementById('selectedDateText').textContent = displayText;
    
    // Update active state - only for quick date options
    document.querySelectorAll('.date-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Add active class to clicked option
    if (event && event.target.closest('.date-option')) {
        event.target.closest('.date-option').classList.add('active');
    }
    
    // Update button appearance
    const dateBtn = document.getElementById('dateBtn');
    if (period === 'all') {
        dateBtn.classList.remove('active');
    } else {
        dateBtn.classList.add('active');
    }
    
    // Close dropdown
    document.getElementById('dateDropdown').classList.remove('open');
    document.getElementById('dateBtn').classList.remove('open');
    
    // Use unified search that combines all filters
    if (hasResults) {
        performUnifiedSearch();
    }
}

function updateDateInputs() {
    const dateType = document.querySelector('input[name="dateType"]:checked').value;
    const dateInputs = document.getElementById('dateInputs');
    
    dateInputs.innerHTML = '';
    
    if (dateType === 'range') {
        dateInputs.innerHTML = `
            <div class="date-input-group">
                <label>Từ ngày:</label>
                <input type="date" id="startDate" onchange="updateCustomDate()">
            </div>
            <div class="date-input-group">
                <label>Đến ngày:</label>
                <input type="date" id="endDate" onchange="updateCustomDate()">
            </div>
        `;
    } else if (dateType === 'after') {
        dateInputs.innerHTML = `
            <div class="date-input-group">
                <label>Sau ngày:</label>
                <input type="date" id="afterDate" onchange="updateCustomDate()">
            </div>
        `;
    } else if (dateType === 'before') {
        dateInputs.innerHTML = `
            <div class="date-input-group">
                <label>Trước ngày:</label>
                <input type="date" id="beforeDate" onchange="updateCustomDate()">
            </div>
        `;
    }
}

function updateCustomDate() {
    // Real-time preview if needed
}

function applyCustomDate() {
    const dateType = document.querySelector('input[name="dateType"]:checked').value;
    let dateFilter = '';
    let displayText = '';
    
    if (dateType === 'range') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            dateFilter = `${startDate}..${endDate}`;
            displayText = `${formatInputDate(startDate)} - ${formatInputDate(endDate)}`;
        }
    } else if (dateType === 'after') {
        const afterDate = document.getElementById('afterDate').value;
        if (afterDate) {
            dateFilter = `>${afterDate}`;
            displayText = `Sau ${formatInputDate(afterDate)}`;
        }
    } else if (dateType === 'before') {
        const beforeDate = document.getElementById('beforeDate').value;
        if (beforeDate) {
            dateFilter = `<${beforeDate}`;
            displayText = `Trước ${formatInputDate(beforeDate)}`;
        }
    }
    
    if (dateFilter) {
        selectedDateFilter = 'custom';
        customDateRange = dateFilter;
        document.getElementById('selectedDateText').textContent = displayText;
        document.getElementById('dateBtn').classList.add('active');
        
        // Clear active state from quick options
        document.querySelectorAll('.date-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Close dropdown
        document.getElementById('dateDropdown').classList.remove('open');
        document.getElementById('dateBtn').classList.remove('open');
        
        // Use unified search
        if (hasResults) {
            performUnifiedSearch();
        }
    }
}

function formatInputDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
    });
}

function clearDateFilter() {
    selectedDateFilter = '';
    customDateRange = '';
    document.getElementById('selectedDateText').textContent = 'Tất cả';
    document.getElementById('dateBtn').classList.remove('active');
    
    // Reset to "all" option
    document.querySelectorAll('.date-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector('.date-option').classList.add('active'); // First option is "all"
    
    // Reset radio buttons
    document.querySelector('input[name="dateType"][value="range"]').checked = true;
    updateDateInputs();
    
    // Close dropdown
    document.getElementById('dateDropdown').classList.remove('open');
    document.getElementById('dateBtn').classList.remove('open');
    
    // Use unified search
    if (hasResults) {
        performUnifiedSearch();
    }
}

// Enhanced date filter generation - mặc định áp dụng cho tất cả loại ngày
function getDateFilter() {
    if (!selectedDateFilter || selectedDateFilter === 'all') {
        return '';
    }
    
    let dateValue = '';
    if (selectedDateFilter === 'custom') {
        dateValue = customDateRange;
    } else {
        const dateFilters = {
            'today': 'today',
            'thisweek': 'thisweek', 
            'thismonth': 'thismonth',
            'thisyear': 'thisyear'
        };
        dateValue = dateFilters[selectedDateFilter] || '';
    }
    
    if (!dateValue) return '';
    
    // Mặc định tạo OR condition cho tất cả loại ngày (tạo/sửa/truy cập)
    return `(dm:${dateValue}|dc:${dateValue}|da:${dateValue})`;
}

// Updated drive selector functions - simplified logic
function toggleDrive(drive) {
    if (drive === 'C:') {
        const checkbox = document.getElementById('driveC');
        const driveOption = checkbox.closest('.drive-option');
        
        searchOnCDrive = !searchOnCDrive;
        
        if (searchOnCDrive) {
            checkbox.classList.add('active');
            driveOption.classList.add('active');
        } else {
            checkbox.classList.remove('active');
            driveOption.classList.remove('active');
        }
        
        // Use unified search that combines all filters
        if (hasResults) {
            performUnifiedSearch();
        }
    }
}

// Updated drive filter function - simplified logic
function getDriveFilter() {
    if (searchOnCDrive) {
        return 'C:'; // Search only C: drive when checked
    } else {
        return 'D:'; // Default to D: drive when unchecked
    }
}

// MAIN FUNCTION: Unified search function that combines all filters properly
function performUnifiedSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query && !currentFilter) {
        closeIframe();
        return;
    }
    
    // Clean user query
    currentUserQuery = cleanUserQuery(query);
    
    // Build final search query with proper filter combination
    let searchParts = [];
    
    // Add drive filter first (simplified: only one drive at a time)
    const driveFilter = getDriveFilter();
    if (driveFilter) {
        searchParts.push(driveFilter);
    }
    
    // Add date filter (với OR logic cho tất cả loại ngày)
    const dateFilter = getDateFilter();
    if (dateFilter) {
        searchParts.push(dateFilter);
    }
    
    // Add current quick filter (file type or folder)
    if (currentFilter) {
        searchParts.push(currentFilter);
    }
    
    // Add user search query last
    if (currentUserQuery.trim()) {
        searchParts.push(currentUserQuery.trim());
    }
    
    // Combine all parts with spaces
    const finalQuery = searchParts.join(' ');
    
    if (!finalQuery.trim()) {
        closeIframe();
        return;
    }
    
    console.log('Final Search Query:', finalQuery); // Debug log
    
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(finalQuery)}`;
    showInIframe(searchUrl, finalQuery);
}

// Clean user query by removing filter patterns
function cleanUserQuery(query) {
    let cleaned = query;
    
    // Remove various filter patterns
    cleaned = cleaned.replace(/\*\.[a-zA-Z0-9]+(\|\*\.[a-zA-Z0-9]+)*/g, '');
    cleaned = cleaned.replace(/size:[^\s]+/g, '');
    cleaned = cleaned.replace(/dm:[^\s]+/g, '');
    cleaned = cleaned.replace(/dc:[^\s]+/g, '');
    cleaned = cleaned.replace(/da:[^\s]+/g, '');
    cleaned = cleaned.replace(/folder:/g, '');
    cleaned = cleaned.replace(/[A-Z]:/g, '');
    cleaned = cleaned.replace(/\([^)]*\)/g, ''); // Remove parentheses groups
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Apply quick filter with unified search and UI state management  
function applyQuickFilter(filter) {
    currentFilter = filter;
    
    // Update UI to show active quick filter
    updateQuickFilterUI(filter);
    
    // Use unified search that combines with current drives and date filters
    performUnifiedSearch();
}

// Update quick filter UI state
function updateQuickFilterUI(activeFilter) {
    // Remove active class from all quick items
    document.querySelectorAll('.quick-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current filter
    if (activeFilter) {
        let targetId = '';
        if (activeFilter.includes('jpg|png|gif')) targetId = 'quick-images';
        else if (activeFilter.includes('mp3|mp4|avi')) targetId = 'quick-media';
        else if (activeFilter.includes('doc|pdf|txt')) targetId = 'quick-documents';
        else if (activeFilter.includes('folder:')) targetId = 'quick-folders';
        
        if (targetId) {
            document.getElementById(targetId).classList.add('active');
        }
    }
}

// Reset quick filter UI
function resetQuickFilterUI() {
    document.querySelectorAll('.quick-item').forEach(item => {
        item.classList.remove('active');
    });
    currentFilter = '';
}

// Legacy function kept for backward compatibility - now uses unified search
function performSearch() {
    performUnifiedSearch();
}

// Close dropdowns when clicking outside
function closeDropdownsOnOutsideClick(event) {
    const dateFilter = document.getElementById('dateFilter');
    if (!dateFilter.contains(event.target)) {
        document.getElementById('dateDropdown').classList.remove('open');
        document.getElementById('dateBtn').classList.remove('open');
    }
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
    
    container.style.display = 'block';
    iframe.src = url;
    
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

// Fullscreen functionality
function toggleFullscreen() {
    const container = document.getElementById('iframeContainer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const expandIcon = fullscreenBtn.querySelector('.expand-icon');
    const collapseIcon = fullscreenBtn.querySelector('.collapse-icon');
    
    if (!isFullscreen) {
        container.classList.add('fullscreen');
        document.body.classList.add('fullscreen-active');
        expandIcon.style.display = 'none';
        collapseIcon.style.display = 'block';
        fullscreenBtn.title = 'Thoát toàn màn hình';
        isFullscreen = true;
    } else {
        container.classList.remove('fullscreen');
        document.body.classList.remove('fullscreen-active');
        expandIcon.style.display = 'block';
        collapseIcon.style.display = 'none';
        fullscreenBtn.title = 'Toàn màn hình';
        isFullscreen = false;
    }
}

// Close iframe
function closeIframe() {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    
    if (isFullscreen) {
        toggleFullscreen();
    }
    
    container.style.display = 'none';
    iframe.src = '';
    iframe.onload = null;
    
    hasResults = false;
    currentFilter = '';
    resetQuickFilterUI();
}

// URL Converter functions
function openUrlConverter() {
    document.getElementById('urlConverterModal').classList.add('open');
    document.getElementById('urlInput').focus();
    resetCopyStatus();
}

function closeUrlConverter() {
    document.getElementById('urlConverterModal').classList.remove('open');
    document.getElementById('urlInput').value = '';
    document.getElementById('pathOutput').value = '';
    resetCopyStatus();
}

function pasteFromClipboard() {
    navigator.clipboard.readText()
        .then(text => {
            document.getElementById('urlInput').value = text;
            convertAndCopyUrl();
        })
        .catch(err => {
            console.error('Cannot read clipboard: ', err);
            updateCopyStatus('Error', false);
        });
}

function convertAndCopyUrl() {
    const urlInput = document.getElementById('urlInput');
    const pathOutput = document.getElementById('pathOutput');
    const url = urlInput.value.trim();
    
    if (!url) {
        pathOutput.value = '';
        resetCopyStatus();
        return;
    }
    
    const localPath = convertUrlToLocalPath(url);
    pathOutput.value = localPath;
    
    if (localPath) {
        navigator.clipboard.writeText(localPath)
            .then(() => {
                updateCopyStatus('Copied!', true);
                setTimeout(() => {
                    closeUrlConverter();
                }, 1500);
            })
            .catch(err => {
                console.error('Cannot copy to clipboard: ', err);
                updateCopyStatus('Copy Failed', false);
            });
    }
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

function updateCopyStatus(text, isSuccess) {
    const copyStatus = document.getElementById('copyStatus');
    const statusText = copyStatus.querySelector('.status-text');
    const copyIcon = copyStatus.querySelector('.copy-icon');
    const checkIcon = copyStatus.querySelector('.check-icon');
    
    statusText.textContent = text;
    
    if (isSuccess) {
        copyStatus.classList.add('copied');
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
    } else {
        copyStatus.classList.remove('copied');
        copyIcon.style.display = 'block';
        checkIcon.style.display = 'none';
    }
}

function resetCopyStatus() {
    updateCopyStatus('Ready', false);
}

// URL Input event listeners
document.getElementById('urlInput').addEventListener('input', function() {
    const pathOutput = document.getElementById('pathOutput');
    const url = this.value.trim();
    
    if (url) {
        const localPath = convertUrlToLocalPath(url);
        pathOutput.value = localPath;
        updateCopyStatus('Press Enter', false);
    } else {
        pathOutput.value = '';
        resetCopyStatus();
    }
});

document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        convertAndCopyUrl();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    if (e.key === 'F11' || (hasResults && e.key === 'f')) {
        e.preventDefault();
        if (hasResults) {
            toggleFullscreen();
        }
    }
    
    if (e.key === 'Escape') {
        if (document.getElementById('urlConverterModal').classList.contains('open')) {
            closeUrlConverter();
        } else if (document.getElementById('dateDropdown').classList.contains('open')) {
            document.getElementById('dateDropdown').classList.remove('open');
            document.getElementById('dateBtn').classList.remove('open');
        } else if (isFullscreen) {
            toggleFullscreen();
        } else if (hasResults) {
            closeIframe();
        }
    }
    
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

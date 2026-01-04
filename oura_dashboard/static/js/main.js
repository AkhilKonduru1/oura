// Global data store
let healthData = {};

// Notification system
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    
    const icons = {
        success: '<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
        error: '<svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
        info: '<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    
    icon.innerHTML = icons[type] || icons.success;
    titleEl.textContent = title;
    messageEl.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => hideNotification(), 5000);
}

function hideNotification() {
    document.getElementById('notification').classList.add('hidden');
}

function showLoading(text = 'Processing your data...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function updateFilesList(files) {
    const filesList = document.getElementById('files-list');
    const filesBadge = document.getElementById('files-badge');
    const filesCount = document.getElementById('files-count');
    
    filesCount.textContent = files.length;
    filesBadge.classList.remove('hidden');
    
    filesList.innerHTML = files.map(file => `
        <div class="px-2.5 py-1.5 bg-gray-100 rounded-md text-xs font-medium text-gray-700 border border-gray-200">
            ${file.replace('.csv', '')}
        </div>
    `).join('');
}

// File upload handler
document.getElementById('file-input').addEventListener('change', async (e) => {
    const files = e.target.files;
    
    if (files.length === 0) {
        showNotification('No Files Selected', 'Please select at least one CSV file to upload.', 'info');
        return;
    }
    
    const formData = new FormData();
    let csvCount = 0;
    
    for (let file of files) {
        if (file.name.endsWith('.csv')) {
            formData.append('files', file);
            csvCount++;
        }
    }
    
    if (csvCount === 0) {
        showNotification('Invalid Files', 'Please select CSV files only.', 'error');
        return;
    }
    
    showLoading(`Uploading ${csvCount} file${csvCount > 1 ? 's' : ''}...`);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            hideLoading();
            showNotification('Upload Error', errorData.error || `Server returned ${response.status}`, 'error');
            console.error('Server error:', errorData);
            return;
        }
        
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.error) {
            hideLoading();
            showNotification('Upload Error', result.error, 'error');
            console.error('Upload error:', result.error);
            return;
        }
        
        if (result.success) {
            healthData = result.data;
            
            // Update files list
            updateFilesList(result.files);
            
            // Show AI summary
            document.getElementById('ai-summary-text').textContent = result.summary;
            document.getElementById('ai-summary').classList.remove('hidden');
            
            // Show main content
            document.getElementById('empty-state').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            
            hideLoading();
            showNotification('Upload Successful!', `${result.files.length} file${result.files.length > 1 ? 's' : ''} processed successfully.`, 'success');
            
            // Load default tab (sleep)
            switchTab('sleep');
        } else {
            hideLoading();
            showNotification('Upload Error', 'Unexpected response format from server', 'error');
            console.error('Unexpected result:', result);
        }
    } catch (error) {
        hideLoading();
        showNotification('Upload Failed', error.message || 'An error occurred while uploading your files. Please try again.', 'error');
        console.error('Upload error:', error);
    }
    
    // Reset file input
    e.target.value = '';
});

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-50', 'text-blue-600');
        btn.classList.add('text-gray-600');
    });
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.remove('text-gray-600');
    activeBtn.classList.add('active', 'bg-blue-50', 'text-blue-600');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    
    // Load tab content
    switch(tabName) {
        case 'sleep':
            loadSleepTab();
            break;
        case 'activity':
            loadActivityTab();
            break;
        case 'heart':
            loadHeartTab();
            break;
        case 'metrics':
            loadMetricsTab();
            break;
        case 'temperature':
            loadTemperatureData();
            break;
        case 'session':
            loadSessionData();
            break;
        case 'cardiovascular':
            loadCardiovascularData();
            break;
    }
}

// Utility function to create contributor card
function createContributorCard(label, value, description) {
    value = value || 0;
    const colorClass = value >= 80 ? 'bg-green-50 border-green-200' : value >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    const textColor = value >= 80 ? 'text-green-900' : value >= 60 ? 'text-yellow-900' : 'text-red-900';
    const barColor = value >= 80 ? 'bg-green-600' : value >= 60 ? 'bg-yellow-600' : 'bg-red-600';
    
    return `
        <div class="stat-card ${colorClass} rounded-lg p-4 border">
            <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">${label.replace(/_/g, ' ')}</div>
            <div class="text-3xl font-bold ${textColor} mb-3">${value}</div>
            <div class="w-full bg-white rounded-full h-1.5 mb-3 overflow-hidden">
                <div class="${barColor} h-1.5 rounded-full transition-all duration-500" style="width: ${value}%"></div>
            </div>
            ${description ? `<p class="text-xs text-gray-600 leading-relaxed">${description}</p>` : ''}
        </div>
    `;
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Filter data by time range
function filterDataByTimeRange(data, days) {
    if (!data || data.length === 0) return data;
    if (days === 'all') return data;
    
    // Sort by date descending and take the last N days
    const sorted = [...data].sort((a, b) => new Date(b.day) - new Date(a.day));
    return sorted.slice(0, days).reverse();
}

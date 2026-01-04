// Sleep Time Recommendations visualization
let currentSleepTimeData = null;

function loadSleepTimeData() {
    if (!healthData['sleeptime.csv']) {
        document.getElementById('tab-content-sleeptime').innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No sleep time data available</p>
            </div>
        `;
        return;
    }

    currentSleepTimeData = healthData['sleeptime.csv'];
    displaySleepTimeData();
}

function displaySleepTimeData() {
    const container = document.getElementById('tab-content-sleeptime');
    
    // Group recommendations by day
    const recommendations = currentSleepTimeData
        .filter(d => d.day)
        .sort((a, b) => new Date(b.day) - new Date(a.day));
    
    const statusColors = {
        'not_enough_nights': 'bg-gray-100 text-gray-700',
        'only_recommended_found': 'bg-blue-100 text-blue-700',
        'optimal_bedtime_available': 'bg-green-100 text-green-700'
    };
    
    const recommendationText = {
        'earlier_bedtime': '🌙 Try going to bed earlier',
        'later_bedtime': '☀️ You can go to bed later',
        'optimal_timing': '✅ Your bedtime is optimal',
        '': 'No specific recommendation'
    };
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Sleep Time Recommendations</h3>
                <p class="text-sm text-gray-600">Daily bedtime advice from your Oura Ring</p>
            </div>

            <!-- Recommendations List -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="space-y-4">
                    ${recommendations.map(rec => `
                        <div class="border-l-4 ${getRecommendationColor(rec.recommendation)} bg-gray-50 p-4 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-sm font-semibold text-gray-900">${formatDate(rec.day)}</span>
                                        <span class="px-2 py-1 text-xs rounded ${statusColors[rec.status] || 'bg-gray-100 text-gray-700'}">
                                            ${formatStatus(rec.status)}
                                        </span>
                                    </div>
                                    <div class="mt-2 space-y-1">
                                        ${rec.recommendation ? `
                                            <p class="text-sm text-gray-700">
                                                <strong>Advice:</strong> ${recommendationText[rec.recommendation] || rec.recommendation}
                                            </p>
                                        ` : ''}
                                        ${rec.optimal_bedtime ? `
                                            <p class="text-sm text-gray-700">
                                                <strong>Optimal Bedtime:</strong> ${formatTime(rec.optimal_bedtime)}
                                            </p>
                                        ` : '<p class="text-sm text-gray-500 italic">Insufficient data for bedtime recommendation</p>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-gray-900">${recommendations.length}</div>
                    <div class="text-sm text-gray-600">Total Days Tracked</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-600">${recommendations.filter(r => r.optimal_bedtime).length}</div>
                    <div class="text-sm text-gray-600">Days with Optimal Time</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-blue-600">${recommendations.filter(r => r.recommendation).length}</div>
                    <div class="text-sm text-gray-600">Days with Advice</div>
                </div>
            </div>
        </div>
    `;
}

function getRecommendationColor(recommendation) {
    const colors = {
        'earlier_bedtime': 'border-blue-500',
        'later_bedtime': 'border-orange-500',
        'optimal_timing': 'border-green-500',
        '': 'border-gray-300'
    };
    return colors[recommendation] || 'border-gray-300';
}

function formatStatus(status) {
    const statusMap = {
        'not_enough_nights': 'Not Enough Data',
        'only_recommended_found': 'Recommendation Only',
        'optimal_bedtime_available': 'Optimal Time Available'
    };
    return statusMap[status] || status;
}

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timeStr;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

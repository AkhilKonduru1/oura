let sleepTimeRange = 10; // Default to 10 days
let currentSleepData = []; // Store filtered data for click handlers
let currentSleepModelData = null;
let currentSleepTimeData = null;

function loadSleepTab() {
    const allSleepData = healthData['dailysleep.csv'];
    if (!allSleepData) {
        document.getElementById('tab-content-sleep').innerHTML = '<p class="text-center text-gray-500 py-10 text-sm">No sleep data available</p>';
        return;
    }
    
    // Load all sleep-related data
    currentSleepModelData = healthData['sleepmodel.csv'];
    currentSleepTimeData = healthData['sleeptime.csv'];
    
    // Parse contributors
    allSleepData.forEach(day => {
        if (day.contributors && typeof day.contributors === 'string') {
            day.contributors_parsed = JSON.parse(day.contributors);
        }
    });
    
    // Filter data based on time range
    currentSleepData = filterDataByTimeRange(allSleepData, sleepTimeRange);
    
    // Create chart
    const trace = {
        x: currentSleepData.map(d => d.day),
        y: currentSleepData.map(d => d.score),
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
            color: '#2563eb',
            size: 8,
            line: {
                color: 'white',
                width: 2
            }
        },
        line: {
            color: '#2563eb',
            width: 2
        },
        hovertemplate: '<b>%{x}</b><br>Sleep Score: %{y}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Sleep Quality Trend',
            font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
            x: 0,
            xanchor: 'left'
        },
        xaxis: { 
            title: '', 
            gridcolor: '#f3f4f6',
            showgrid: false,
            zeroline: false
        },
        yaxis: { 
            title: 'Score', 
            range: [0, 100], 
            gridcolor: '#f3f4f6',
            zeroline: false
        },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' },
        margin: { t: 60, r: 20, b: 40, l: 50 },
        hovermode: 'closest'
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    let html = `
        ${getSleepRecommendations()}
        <div class="chart-container">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-gray-900">Sleep Quality Trend</h3>
                <select id="sleep-time-range" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="7" ${sleepTimeRange === 7 ? 'selected' : ''}>Last 7 days</option>
                    <option value="10" ${sleepTimeRange === 10 ? 'selected' : ''}>Last 10 days</option>
                    <option value="30" ${sleepTimeRange === 30 ? 'selected' : ''}>Last 30 days</option>
                    <option value="90" ${sleepTimeRange === 90 ? 'selected' : ''}>Last 90 days</option>
                    <option value="all" ${sleepTimeRange === 'all' ? 'selected' : ''}>All time</option>
                </select>
            </div>
            <div id="sleep-chart"></div>
            <p class="text-xs text-gray-500 mt-3">Click on any point to view detailed breakdown</p>
        </div>
        
        <div id="sleep-detail-view" class="detail-view hidden">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-gray-900">Sleep Breakdown</h3>
                <div id="sleep-selected-date" class="text-xs text-gray-600"></div>
            </div>
            <div id="sleep-details" class="stat-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"></div>
        </div>
        
        ${getSleepModelSection()}
    `;
    
    document.getElementById('tab-content-sleep').innerHTML = html;
    
    Plotly.newPlot('sleep-chart', [trace], layout, config);
    
    // Add click handler to chart
    document.getElementById('sleep-chart').on('plotly_click', function(data) {
        let clickedDate = data.points[0].x;
        // Normalize date to YYYY-MM-DD format and add 1 day to fix timezone offset
        let dateObj;
        if (clickedDate instanceof Date) {
            dateObj = new Date(clickedDate);
        } else {
            dateObj = new Date(clickedDate);
        }
        dateObj.setDate(dateObj.getDate() + 1);
        clickedDate = dateObj.toISOString().split('T')[0];
        
        const selectedDay = currentSleepData.find(d => d.day === clickedDate);
        if (selectedDay) {
            loadSleepDetails(selectedDay);
        }
    });
    
    // Add time range change handler
    document.getElementById('sleep-time-range').addEventListener('change', (e) => {
        sleepTimeRange = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        loadSleepTab();
    });
    
    // Render sleep model charts if data is available
    if (currentSleepModelData) {
        renderSleepModelCharts();
    }
}

function loadSleepDetails(dayData) {
    const detailView = document.getElementById('sleep-detail-view');
    const dateEl = document.getElementById('sleep-selected-date');
    const detailsEl = document.getElementById('sleep-details');
    
    if (!dayData || !dayData.contributors_parsed) {
        detailsEl.innerHTML = '<p class="text-gray-500 text-center col-span-full text-sm">No contributor data available for this date.</p>';
        return;
    }
    
    dateEl.textContent = formatDate(dayData.day);
    detailView.classList.remove('hidden');
    detailView.classList.add('visible');
    
    const contributors = dayData.contributors_parsed;
    const detailsHtml = `
        ${createContributorCard('Deep Sleep', contributors.deep_sleep || 0, 'Restorative sleep phase')}
        ${createContributorCard('REM Sleep', contributors.rem_sleep || 0, 'Dream & memory consolidation')}
        ${createContributorCard('Efficiency', contributors.efficiency || 0, 'Time asleep vs in bed')}
        ${createContributorCard('Latency', contributors.latency || 0, 'Time to fall asleep')}
        ${createContributorCard('Restfulness', contributors.restfulness || 0, 'Sleep disruptions')}
        ${createContributorCard('Timing', contributors.timing || 0, 'Schedule consistency')}
        ${createContributorCard('Total Sleep', contributors.total_sleep || 0, 'Duration of sleep')}
    `;
    
    detailsEl.innerHTML = detailsHtml;
    
    // Scroll to details
    detailView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getSleepRecommendations() {
    const sleepTimeData = healthData['sleeptime.csv'];
    if (!sleepTimeData || sleepTimeData.length === 0) {
        return '';
    }
    
    // Get the most recent recommendation
    const recentRecs = sleepTimeData
        .filter(d => d.day && d.recommendation)
        .sort((a, b) => new Date(b.day) - new Date(a.day))
        .slice(0, 3);
    
    if (recentRecs.length === 0) {
        return '';
    }
    
    const recommendationIcons = {
        'earlier_bedtime': '🌙',
        'later_bedtime': '☀️',
        'optimal_timing': '✅'
    };
    
    const recommendationText = {
        'earlier_bedtime': 'Try going to bed earlier tonight',
        'later_bedtime': 'You can go to bed a bit later',
        'optimal_timing': 'Your bedtime is optimal'
    };
    
    const recommendationColors = {
        'earlier_bedtime': 'bg-blue-50 border-blue-200',
        'later_bedtime': 'bg-orange-50 border-orange-200',
        'optimal_timing': 'bg-green-50 border-green-200'
    };
    
    const latestRec = recentRecs[0];
    const icon = recommendationIcons[latestRec.recommendation] || '💤';
    const text = recommendationText[latestRec.recommendation] || latestRec.recommendation;
    const colorClass = recommendationColors[latestRec.recommendation] || 'bg-gray-50 border-gray-200';
    
    return `
        <div class="chart-container ${colorClass} mb-6">
            <div class="flex items-start space-x-3">
                <div class="text-3xl">${icon}</div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-base font-semibold text-gray-900">Sleep Recommendation</h3>
                        <span class="text-xs text-gray-600">Latest advice</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-2">${text}</p>
                    ${latestRec.optimal_bedtime ? `
                        <p class="text-xs text-gray-600">
                            <strong>Optimal bedtime:</strong> ${formatBedtime(latestRec.optimal_bedtime)}
                        </p>
                    ` : ''}
                    <div class="mt-3 pt-3 border-t border-gray-300">
                        <p class="text-xs text-gray-500">
                            Based on your sleep patterns from ${formatDate(latestRec.day)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatBedtime(timeStr) {
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
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

// ====== Sleep Model Functions ======
function getSleepModelSection() {
    if (!currentSleepModelData || currentSleepModelData.length === 0) {
        return '';
    }

    return `
        <div class="space-y-6 mt-6">
            <!-- Sleep Duration Breakdown -->
            <div class="chart-container">
                <h3 class="text-base font-semibold text-gray-900 mb-4">Sleep Stage Duration</h3>
                <div id="sleep-stages-chart"></div>
            </div>

            <!-- Sleep Efficiency -->
            <div class="chart-container">
                <h3 class="text-base font-semibold text-gray-900 mb-4">Sleep Efficiency Over Time</h3>
                <div id="sleep-efficiency-chart"></div>
            </div>

            <!-- Heart Rate & HRV During Sleep -->
            <div class="chart-container">
                <h3 class="text-base font-semibold text-gray-900 mb-4">Average Heart Rate & HRV During Sleep</h3>
                <div id="sleep-hr-hrv-chart"></div>
            </div>
        </div>
    `;
}

function renderSleepModelCharts() {
    if (!currentSleepModelData) return;

    const sortedData = currentSleepModelData
        .filter(d => d.day)
        .sort((a, b) => new Date(a.day) - new Date(b.day));

    // Sleep Stages Chart (Stacked Bar)
    const dates = sortedData.map(d => d.day);
    const deepSleep = sortedData.map(d => (d.deep_sleep_duration || 0) / 3600); // Convert to hours
    const remSleep = sortedData.map(d => (d.rem_sleep_duration || 0) / 3600);
    const lightSleep = sortedData.map(d => (d.light_sleep_duration || 0) / 3600);
    const awakeTime = sortedData.map(d => (d.awake_time || 0) / 3600);
    
    const sleepStagesLayout = {
        barmode: 'stack',
        height: 400,
        margin: { l: 50, r: 30, t: 30, b: 80 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Hours' },
        hovermode: 'x unified',
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' }
    };
    
    const stagesTraces = [
        {
            x: dates,
            y: deepSleep,
            name: 'Deep Sleep',
            type: 'bar',
            marker: { color: '#3b82f6' },
            hovertemplate: 'Deep: %{y:.1f}h<extra></extra>'
        },
        {
            x: dates,
            y: remSleep,
            name: 'REM Sleep',
            type: 'bar',
            marker: { color: '#8b5cf6' },
            hovertemplate: 'REM: %{y:.1f}h<extra></extra>'
        },
        {
            x: dates,
            y: lightSleep,
            name: 'Light Sleep',
            type: 'bar',
            marker: { color: '#06b6d4' },
            hovertemplate: 'Light: %{y:.1f}h<extra></extra>'
        },
        {
            x: dates,
            y: awakeTime,
            name: 'Awake',
            type: 'bar',
            marker: { color: '#ef4444' },
            hovertemplate: 'Awake: %{y:.1f}h<extra></extra>'
        }
    ];
    
    Plotly.newPlot('sleep-stages-chart', stagesTraces, sleepStagesLayout, { responsive: true, displayModeBar: false });

    // Sleep Efficiency Chart
    const efficiency = sortedData.map(d => d.efficiency || 0);
    
    const efficiencyTrace = {
        x: dates,
        y: efficiency,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Efficiency',
        line: { color: '#10b981', width: 2 },
        marker: { size: 6 },
        hovertemplate: '<b>%{x}</b><br>Efficiency: %{y}%<extra></extra>'
    };
    
    const efficiencyLayout = {
        height: 300,
        margin: { l: 50, r: 30, t: 30, b: 80 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Efficiency (%)', range: [0, 100] },
        hovermode: 'closest',
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' }
    };
    
    Plotly.newPlot('sleep-efficiency-chart', [efficiencyTrace], efficiencyLayout, { responsive: true, displayModeBar: false });

    // Heart Rate & HRV Chart
    const avgHR = sortedData.map(d => d.average_heart_rate || null);
    const avgHRV = sortedData.map(d => d.average_hrv || null);
    
    const hrTrace = {
        x: dates,
        y: avgHR,
        name: 'Avg Heart Rate',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#ef4444', width: 2 },
        yaxis: 'y',
        hovertemplate: 'HR: %{y:.1f} bpm<extra></extra>'
    };
    
    const hrvTrace = {
        x: dates,
        y: avgHRV,
        name: 'Avg HRV',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#8b5cf6', width: 2 },
        yaxis: 'y2',
        hovertemplate: 'HRV: %{y:.1f} ms<extra></extra>'
    };
    
    const hrHrvLayout = {
        height: 300,
        margin: { l: 50, r: 50, t: 30, b: 80 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Heart Rate (bpm)', titlefont: { color: '#ef4444' } },
        yaxis2: {
            title: 'HRV (ms)',
            titlefont: { color: '#8b5cf6' },
            overlaying: 'y',
            side: 'right'
        },
        hovermode: 'x unified',
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' }
    };
    
    Plotly.newPlot('sleep-hr-hrv-chart', [hrTrace, hrvTrace], hrHrvLayout, { responsive: true, displayModeBar: false });
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


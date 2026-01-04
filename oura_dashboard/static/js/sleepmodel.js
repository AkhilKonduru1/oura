// Sleep Model visualization - detailed sleep analysis
let currentSleepModelData = null;

function loadSleepModelData() {
    if (!healthData['sleepmodel.csv']) {
        document.getElementById('tab-content-sleepmodel').innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No sleep model data available</p>
            </div>
        `;
        return;
    }

    currentSleepModelData = healthData['sleepmodel.csv'];
    displaySleepModelCharts();
}

function displaySleepModelCharts() {
    const container = document.getElementById('tab-content-sleepmodel');
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Sleep Duration Breakdown -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Sleep Stage Duration</h3>
                <div id="sleep-stages-chart"></div>
            </div>

            <!-- Sleep Efficiency -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Sleep Efficiency Over Time</h3>
                <div id="sleep-efficiency-chart"></div>
            </div>

            <!-- Heart Rate & HRV During Sleep -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Average Heart Rate & HRV During Sleep</h3>
                <div id="sleep-hr-hrv-chart"></div>
            </div>

            <!-- Sleep Details List -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Sleep Sessions</h3>
                <div id="sleep-sessions-list"></div>
            </div>
        </div>
    `;
    
    renderSleepModelCharts();
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
        hovermode: 'x unified'
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
    
    Plotly.newPlot('sleep-stages-chart', stagesTraces, sleepStagesLayout, { responsive: true });

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
        hovermode: 'closest'
    };
    
    Plotly.newPlot('sleep-efficiency-chart', [efficiencyTrace], efficiencyLayout, { responsive: true });

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
        hovermode: 'x unified'
    };
    
    Plotly.newPlot('sleep-hr-hrv-chart', [hrTrace, hrvTrace], hrHrvLayout, { responsive: true });

    // Sleep Sessions List
    const recentSessions = sortedData.slice(-10).reverse();
    const sessionsList = document.getElementById('sleep-sessions-list');
    
    sessionsList.innerHTML = `
        <div class="space-y-3">
            ${recentSessions.map(session => `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-semibold text-gray-900">${formatDate(session.day)}</div>
                            <div class="text-sm text-gray-600 mt-1">
                                ${session.bedtime_start ? formatTime(session.bedtime_start) : 'N/A'} - 
                                ${session.bedtime_end ? formatTime(session.bedtime_end) : 'N/A'}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-blue-600">${session.efficiency || 0}% efficient</div>
                            <div class="text-xs text-gray-500">${((session.total_sleep_duration || 0) / 3600).toFixed(1)}h total</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                            <span class="text-gray-600">Deep:</span>
                            <span class="ml-1 font-medium text-blue-600">${((session.deep_sleep_duration || 0) / 3600).toFixed(1)}h</span>
                        </div>
                        <div>
                            <span class="text-gray-600">REM:</span>
                            <span class="ml-1 font-medium text-purple-600">${((session.rem_sleep_duration || 0) / 3600).toFixed(1)}h</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Light:</span>
                            <span class="ml-1 font-medium text-cyan-600">${((session.light_sleep_duration || 0) / 3600).toFixed(1)}h</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Awake:</span>
                            <span class="ml-1 font-medium text-red-600">${((session.awake_time || 0) / 3600).toFixed(1)}h</span>
                        </div>
                    </div>
                    ${session.average_heart_rate ? `
                        <div class="mt-2 text-sm text-gray-600">
                            ❤️ ${session.average_heart_rate.toFixed(1)} bpm avg | 
                            ${session.lowest_heart_rate || 'N/A'} bpm lowest
                            ${session.average_hrv ? ` | 📊 ${session.average_hrv.toFixed(0)} ms HRV` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
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

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timeStr;
    }
}

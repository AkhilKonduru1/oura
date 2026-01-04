let sleepTimeRange = 10; // Default to 10 days
let currentSleepData = []; // Store filtered data for click handlers

function loadSleepTab() {
    const allSleepData = healthData['dailysleep.csv'];
    if (!allSleepData) {
        document.getElementById('tab-content-sleep').innerHTML = '<p class="text-center text-gray-500 py-10 text-sm">No sleep data available</p>';
        return;
    }
    
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
    `;
    
    document.getElementById('tab-content-sleep').innerHTML = html;
    
    Plotly.newPlot('sleep-chart', [trace], layout, config);
    
    // Add click handler to chart
    document.getElementById('sleep-chart').on('plotly_click', function(data) {
        const clickedDate = data.points[0].x;
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

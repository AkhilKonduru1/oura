let activityTimeRange = 10; // Default to 10 days
let currentActivityData = []; // Store filtered data for click handlers

function loadActivityTab() {
    const allActivityData = healthData['dailyactivity.csv'];
    if (!allActivityData) {
        document.getElementById('tab-content-activity').innerHTML = '<p class="text-center text-gray-500 py-10 text-sm">No activity data available</p>';
        return;
    }
    
    // Parse contributors
    allActivityData.forEach(day => {
        if (day.contributors && typeof day.contributors === 'string') {
            day.contributors_parsed = JSON.parse(day.contributors);
        }
    });
    
    // Filter data based on time range
    currentActivityData = filterDataByTimeRange(allActivityData, activityTimeRange);
    
    // Steps chart
    const stepsTrace = {
        x: currentActivityData.map(d => d.day),
        y: currentActivityData.map(d => d.steps),
        type: 'bar',
        marker: {
            color: '#2563eb',
            opacity: 0.8
        },
        hovertemplate: '<b>%{x}</b><br>Steps: %{y:,}<extra></extra>'
    };
    
    const stepsLayout = {
        title: {
            text: 'Daily Steps',
            font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
            x: 0,
            xanchor: 'left'
        },
        xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
        yaxis: { title: 'Steps', gridcolor: '#f3f4f6', zeroline: false },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' },
        margin: { t: 60, r: 20, b: 40, l: 60 },
        hovermode: 'closest'
    };
    
    // Calories chart
    const calTrace1 = {
        x: currentActivityData.map(d => d.day),
        y: currentActivityData.map(d => d.total_calories),
        fill: 'tozeroy',
        type: 'scatter',
        name: 'Total',
        line: { color: '#2563eb', width: 2 },
        fillcolor: 'rgba(37, 99, 235, 0.1)'
    };
    
    const calTrace2 = {
        x: currentActivityData.map(d => d.day),
        y: currentActivityData.map(d => d.active_calories),
        fill: 'tozeroy',
        type: 'scatter',
        name: 'Active',
        line: { color: '#10b981', width: 2 },
        fillcolor: 'rgba(16, 185, 129, 0.1)'
    };
    
    const calLayout = {
        title: {
            text: 'Calories Burned',
            font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
            x: 0,
            xanchor: 'left'
        },
        xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
        yaxis: { title: 'Calories', gridcolor: '#f3f4f6', zeroline: false },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter', size: 12, color: '#6b7280' },
        margin: { t: 60, r: 20, b: 40, l: 60 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.15 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    let html = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900">Activity Overview</h3>
            <select id="activity-time-range" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="7" ${activityTimeRange === 7 ? 'selected' : ''}>Last 7 days</option>
                <option value="10" ${activityTimeRange === 10 ? 'selected' : ''}>Last 10 days</option>
                <option value="30" ${activityTimeRange === 30 ? 'selected' : ''}>Last 30 days</option>
                <option value="90" ${activityTimeRange === 90 ? 'selected' : ''}>Last 90 days</option>
                <option value="all" ${activityTimeRange === 'all' ? 'selected' : ''}>All time</option>
            </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div class="chart-container">
                <div id="steps-chart"></div>
                <p class="text-xs text-gray-500 mt-3">Click on any bar to view detailed breakdown</p>
            </div>
            <div class="chart-container">
                <div id="calories-chart"></div>
            </div>
        </div>
        
        <div id="activity-detail-view" class="detail-view hidden">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-gray-900">Activity Breakdown</h3>
                <div id="activity-selected-date" class="text-xs text-gray-600"></div>
            </div>
            <div id="activity-details" class="stat-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"></div>
        </div>
    `;
    
    document.getElementById('tab-content-activity').innerHTML = html;
    
    Plotly.newPlot('steps-chart', [stepsTrace], stepsLayout, config);
    Plotly.newPlot('calories-chart', [calTrace1, calTrace2], calLayout, config);
    
    // Add click handler to steps chart
    document.getElementById('steps-chart').on('plotly_click', function(data) {
        const clickedDate = data.points[0].x;
        const selectedDay = currentActivityData.find(d => d.day === clickedDate);
        if (selectedDay) {
            loadActivityDetails(selectedDay);
        }
    });
    
    // Add click handler to calories chart
    document.getElementById('calories-chart').on('plotly_click', function(data) {
        const clickedDate = data.points[0].x;
        const selectedDay = currentActivityData.find(d => d.day === clickedDate);
        if (selectedDay) {
            loadActivityDetails(selectedDay);
        }
    });
    
    // Add time range change handler
    document.getElementById('activity-time-range').addEventListener('change', (e) => {
        activityTimeRange = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        loadActivityTab();
    });
}

function loadActivityDetails(dayData) {
    const detailView = document.getElementById('activity-detail-view');
    const dateEl = document.getElementById('activity-selected-date');
    const detailsEl = document.getElementById('activity-details');
    
    if (!dayData || !dayData.contributors_parsed) {
        detailsEl.innerHTML = '<p class="text-gray-500 text-center col-span-full text-sm">No contributor data available for this date.</p>';
        return;
    }
    
    dateEl.textContent = formatDate(dayData.day);
    detailView.classList.remove('hidden');
    detailView.classList.add('visible');
    
    const contributors = dayData.contributors_parsed;
    const detailsHtml = `
        ${createContributorCard('Stay Active', contributors.stay_active || 0, 'Movement throughout day')}
        ${createContributorCard('Move Every Hour', contributors.move_every_hour || 0, 'Hourly movement')}
        ${createContributorCard('Meet Daily Targets', contributors.meet_daily_targets || 0, 'Goal achievement')}
        ${createContributorCard('Training Volume', contributors.training_volume || 0, 'Exercise intensity')}
        ${createContributorCard('Recovery Time', contributors.recovery_time || 0, 'Rest periods')}
    `;
    
    detailsEl.innerHTML = detailsHtml;
    
    // Scroll to details
    detailView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

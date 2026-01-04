let heartTimeRange = 10; // Default to 10 days
let currentStressData = []; // Store filtered data for click handlers

function loadHeartTab() {
    const allHeartData = healthData['heartrate.csv'];
    const allStressData = healthData['dailystress.csv'];
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    let html = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900">Heart & Stress Metrics</h3>
            <select id="heart-time-range" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="7" ${heartTimeRange === 7 ? 'selected' : ''}>Last 7 days</option>
                <option value="10" ${heartTimeRange === 10 ? 'selected' : ''}>Last 10 days</option>
                <option value="30" ${heartTimeRange === 30 ? 'selected' : ''}>Last 30 days</option>
                <option value="90" ${heartTimeRange === 90 ? 'selected' : ''}>Last 90 days</option>
                <option value="all" ${heartTimeRange === 'all' ? 'selected' : ''}>All time</option>
            </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    
    // Add placeholders for charts
    if (allHeartData && allHeartData.length > 0) {
        html += `<div class="chart-container"><div id="heart-chart"></div></div>`;
    }
    
    if (allStressData && allStressData.length > 0) {
        currentStressData = filterDataByTimeRange(allStressData, heartTimeRange);
        html += `<div class="chart-container"><div id="stress-chart"></div></div>`;
    }
    
    html += '</div>';
    document.getElementById('tab-content-heart').innerHTML = html;
    
    // Render charts after HTML is in DOM
    if (allHeartData && allHeartData.length > 0) {
        // Filter heart rate data by time range
        let heartData = allHeartData;
        if (heartTimeRange !== 'all') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - heartTimeRange);
            heartData = allHeartData.filter(d => new Date(d.timestamp) >= cutoffDate);
        }
        
        // Aggregate by hour
        const hourlyData = {};
        heartData.forEach(d => {
            const hour = new Date(d.timestamp).toISOString().slice(0, 13) + ':00:00';
            if (!hourlyData[hour]) {
                hourlyData[hour] = { sum: 0, count: 0 };
            }
            hourlyData[hour].sum += d.bpm;
            hourlyData[hour].count++;
        });
        
        const hours = Object.keys(hourlyData).sort();
        const avgBpm = hours.map(h => hourlyData[h].sum / hourlyData[h].count);
        
        const hrTrace = {
            x: hours,
            y: avgBpm,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#ef4444', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(239, 68, 68, 0.1)',
            hovertemplate: '<b>%{x}</b><br>Avg BPM: %{y:.0f}<extra></extra>'
        };
        
        const hrLayout = {
            title: {
                text: 'Heart Rate Trends',
                font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
                x: 0,
                xanchor: 'left'
            },
            xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
            yaxis: { title: 'BPM', gridcolor: '#f3f4f6', zeroline: false },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Inter', size: 12, color: '#6b7280' },
            margin: { t: 60, r: 20, b: 40, l: 60 }
        };
        
        Plotly.newPlot('heart-chart', [hrTrace], hrLayout, config);
    }
    
    if (currentStressData.length > 0) {
        const stressTrace1 = {
            x: currentStressData.map(d => d.day),
            y: currentStressData.map(d => d.stress_high / 3600), // Convert seconds to hours
            type: 'bar',
            name: 'Stress',
            marker: { color: '#f59e0b' },
            hovertemplate: '<b>%{x}</b><br>Stress: %{y:.1f} hours<extra></extra>'
        };
        
        const stressTrace2 = {
            x: currentStressData.map(d => d.day),
            y: currentStressData.map(d => d.recovery_high / 3600), // Convert seconds to hours
            type: 'bar',
            name: 'Recovery',
            marker: { color: '#10b981' },
            hovertemplate: '<b>%{x}</b><br>Recovery: %{y:.1f} hours<extra></extra>'
        };
        
        const stressLayout = {
            title: {
                text: 'Stress vs Recovery',
                font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
                x: 0,
                xanchor: 'left'
            },
            xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
            yaxis: { title: 'Hours', gridcolor: '#f3f4f6', zeroline: false },
            barmode: 'group',
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Inter', size: 12, color: '#6b7280' },
            margin: { t: 60, r: 20, b: 40, l: 60 },
            showlegend: true,
            legend: { orientation: 'h', y: -0.15 }
        };
        
        Plotly.newPlot('stress-chart', [stressTrace1, stressTrace2], stressLayout, config);
    }
    
    // Add time range change handler
    const timeRangeSelect = document.getElementById('heart-time-range');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (e) => {
            heartTimeRange = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
            loadHeartTab();
        });
    }
}

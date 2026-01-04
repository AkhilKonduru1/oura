let metricsTimeRange = 10; // Default to 10 days
let currentSpo2Data = [];
let currentReadinessData = [];

function loadMetricsTab() {
    const allSpo2Data = healthData['dailyspo2.csv'];
    const allReadinessData = healthData['dailyreadiness.csv'];
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    let html = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900">Health Metrics</h3>
            <select id="metrics-time-range" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="7" ${metricsTimeRange === 7 ? 'selected' : ''}>Last 7 days</option>
                <option value="10" ${metricsTimeRange === 10 ? 'selected' : ''}>Last 10 days</option>
                <option value="30" ${metricsTimeRange === 30 ? 'selected' : ''}>Last 30 days</option>
                <option value="90" ${metricsTimeRange === 90 ? 'selected' : ''}>Last 90 days</option>
                <option value="all" ${metricsTimeRange === 'all' ? 'selected' : ''}>All time</option>
            </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    
    // SpO2 Chart
    if (allSpo2Data && allSpo2Data.length > 0) {
        // Parse SpO2 data
        allSpo2Data.forEach(d => {
            if (d.spo2_percentage && typeof d.spo2_percentage === 'string') {
                const parsed = JSON.parse(d.spo2_percentage);
                d.spo2_avg = parsed.average;
            }
        });
        
        // Filter data based on time range
        currentSpo2Data = filterDataByTimeRange(allSpo2Data, metricsTimeRange);
        
        html += `<div class="chart-container"><div id="spo2-chart"></div></div>`;
    }
    
    if (allReadinessData && allReadinessData.length > 0) {
        // Filter data based on time range
        currentReadinessData = filterDataByTimeRange(allReadinessData, metricsTimeRange);
        
        html += `<div class="chart-container"><div id="readiness-chart"></div></div>`;
    }
    
    html += '</div>';
    document.getElementById('tab-content-metrics').innerHTML = html;
    
    // Render charts after HTML is in DOM
    if (currentSpo2Data.length > 0) {
        const spo2Trace = {
            x: currentSpo2Data.map(d => d.day),
            y: currentSpo2Data.map(d => d.spo2_avg),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { 
                color: '#06b6d4', 
                size: 8,
                line: {
                    color: 'white',
                    width: 2
                }
            },
            line: { color: '#06b6d4', width: 2 },
            hovertemplate: '<b>%{x}</b><br>SpO2: %{y:.1f}%<extra></extra>'
        };
        
        const spo2Layout = {
            title: {
                text: 'Blood Oxygen Levels',
                font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
                x: 0,
                xanchor: 'left'
            },
            xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
            yaxis: { title: 'SpO2 %', range: [90, 100], gridcolor: '#f3f4f6', zeroline: false },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Inter', size: 12, color: '#6b7280' },
            margin: { t: 60, r: 20, b: 40, l: 60 }
        };
        
        Plotly.newPlot('spo2-chart', [spo2Trace], spo2Layout, config);
    }
    
    if (currentReadinessData.length > 0) {
        const readinessTrace = {
            x: currentReadinessData.map(d => d.day),
            y: currentReadinessData.map(d => d.score),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { 
                color: '#8b5cf6', 
                size: 8,
                line: {
                    color: 'white',
                    width: 2
                }
            },
            line: { color: '#8b5cf6', width: 2 },
            hovertemplate: '<b>%{x}</b><br>Readiness: %{y}<extra></extra>'
        };
        
        const readinessLayout = {
            title: {
                text: 'Readiness Score',
                font: { size: 16, family: 'Inter', weight: 600, color: '#111827' },
                x: 0,
                xanchor: 'left'
            },
            xaxis: { title: '', gridcolor: '#f3f4f6', showgrid: false, zeroline: false },
            yaxis: { title: 'Score', range: [0, 100], gridcolor: '#f3f4f6', zeroline: false },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Inter', size: 12, color: '#6b7280' },
            margin: { t: 60, r: 20, b: 40, l: 60 }
        };
        
        Plotly.newPlot('readiness-chart', [readinessTrace], readinessLayout, config);
    }
    
    // Add time range change handler
    const timeRangeSelect = document.getElementById('metrics-time-range');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (e) => {
            metricsTimeRange = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
            loadMetricsTab();
        });
    }
}

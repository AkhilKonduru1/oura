// Temperature visualization
let currentTemperatureData = null;

function loadTemperatureData() {
    if (!healthData['temperature.csv']) {
        document.getElementById('tab-content-temperature').innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No temperature data available</p>
            </div>
        `;
        return;
    }

    currentTemperatureData = healthData['temperature.csv'];
    displayTemperatureCharts();
}

function displayTemperatureCharts() {
    const container = document.getElementById('tab-content-temperature');
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Time Range Filter -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center space-x-4">
                    <span class="text-sm font-medium text-gray-700">Time Range:</span>
                    <div class="flex space-x-2">
                        <button onclick="updateTemperatureRange(7)" class="time-range-btn px-3 py-1 text-sm rounded-lg bg-blue-600 text-white">7 days</button>
                        <button onclick="updateTemperatureRange(10)" class="time-range-btn px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">10 days</button>
                        <button onclick="updateTemperatureRange(30)" class="time-range-btn px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">30 days</button>
                        <button onclick="updateTemperatureRange(90)" class="time-range-btn px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">90 days</button>
                        <button onclick="updateTemperatureRange(null)" class="time-range-btn px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">All</button>
                    </div>
                </div>
            </div>

            <!-- Temperature Trend Chart -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Skin Temperature Trend</h3>
                <div id="temp-trend-chart"></div>
            </div>

            <!-- Daily Average Temperature -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Average Temperature</h3>
                <div id="temp-daily-chart"></div>
            </div>
        </div>
    `;
    
    renderTemperatureCharts(7);
}

function renderTemperatureCharts(days) {
    if (!currentTemperatureData) return;

    const filteredData = filterDataByTimeRange(currentTemperatureData, 'timestamp', days);
    
    // Temperature trend chart (hourly granular data)
    const timestamps = filteredData.map(d => d.timestamp);
    const temps = filteredData.map(d => parseFloat(d.skin_temp));
    
    const trendTrace = {
        x: timestamps,
        y: temps,
        type: 'scatter',
        mode: 'lines',
        name: 'Skin Temperature',
        line: { color: '#ef4444', width: 2 },
        hovertemplate: '<b>%{x}</b><br>Temperature: %{y:.2f}°C<extra></extra>'
    };
    
    const trendLayout = {
        height: 400,
        margin: { l: 50, r: 30, t: 30, b: 50 },
        xaxis: { title: 'Date/Time' },
        yaxis: { title: 'Temperature (°C)' },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('temp-trend-chart', [trendTrace], trendLayout, { responsive: true });

    // Daily average chart
    const dailyData = {};
    filteredData.forEach(d => {
        const date = d.timestamp.split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { sum: 0, count: 0 };
        }
        const temp = parseFloat(d.skin_temp);
        if (!isNaN(temp)) {
            dailyData[date].sum += temp;
            dailyData[date].count++;
        }
    });
    
    const dates = Object.keys(dailyData).sort();
    const avgTemps = dates.map(date => dailyData[date].sum / dailyData[date].count);
    
    const dailyTrace = {
        x: dates,
        y: avgTemps,
        type: 'bar',
        name: 'Avg Temperature',
        marker: { color: '#ef4444' },
        hovertemplate: '<b>%{x}</b><br>Avg Temperature: %{y:.2f}°C<extra></extra>'
    };
    
    const dailyLayout = {
        height: 400,
        margin: { l: 50, r: 30, t: 30, b: 50 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Average Temperature (°C)' },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('temp-daily-chart', [dailyTrace], dailyLayout, { responsive: true });
}

function updateTemperatureRange(days) {
    // Update button styles
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    event.target.classList.remove('bg-gray-100', 'text-gray-700');
    event.target.classList.add('bg-blue-600', 'text-white');
    
    renderTemperatureCharts(days);
}

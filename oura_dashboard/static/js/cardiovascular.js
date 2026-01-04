// Cardiovascular Age visualization
let currentCardiovascularData = null;

function loadCardiovascularData() {
    if (!healthData['dailycardiovascularage.csv']) {
        document.getElementById('tab-content-cardiovascular').innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No cardiovascular age data available</p>
            </div>
        `;
        return;
    }

    currentCardiovascularData = healthData['dailycardiovascularage.csv'];
    displayCardiovascularData();
}

function displayCardiovascularData() {
    const container = document.getElementById('tab-content-cardiovascular');
    
    const data = currentCardiovascularData
        .filter(d => d.day && d.vascular_age)
        .sort((a, b) => new Date(a.day) - new Date(b.day));
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No cardiovascular age data available</p>
            </div>
        `;
        return;
    }
    
    const latestAge = data[data.length - 1].vascular_age;
    const avgAge = (data.reduce((sum, d) => sum + parseFloat(d.vascular_age || 0), 0) / data.length).toFixed(1);
    const minAge = Math.min(...data.map(d => parseFloat(d.vascular_age || 100)));
    const maxAge = Math.max(...data.map(d => parseFloat(d.vascular_age || 0)));
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Cardiovascular Age</h3>
                <p class="text-sm text-gray-600">Track your vascular age based on your heart health metrics</p>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Current Age</div>
                    <div class="text-3xl font-bold text-blue-600">${latestAge}</div>
                    <div class="text-xs text-gray-500 mt-1">years</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Average Age</div>
                    <div class="text-3xl font-bold text-gray-900">${avgAge}</div>
                    <div class="text-xs text-gray-500 mt-1">years</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Best (Lowest)</div>
                    <div class="text-3xl font-bold text-green-600">${minAge}</div>
                    <div class="text-xs text-gray-500 mt-1">years</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Worst (Highest)</div>
                    <div class="text-3xl font-bold text-red-600">${maxAge}</div>
                    <div class="text-xs text-gray-500 mt-1">years</div>
                </div>
            </div>

            <!-- Trend Chart -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Vascular Age Trend</h3>
                <div id="cardio-age-chart"></div>
            </div>

            <!-- What is Cardiovascular Age -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-blue-900 mb-3">💡 Understanding Your Cardiovascular Age</h3>
                <div class="space-y-2 text-sm text-blue-800">
                    <p>
                        <strong>Cardiovascular age</strong> (also called vascular age) is an estimate of how old your cardiovascular system is compared to your chronological age.
                    </p>
                    <p>
                        A <strong>lower vascular age</strong> indicates better heart health. The goal is to have a vascular age lower than or equal to your actual age.
                    </p>
                    <p>
                        Oura Ring calculates this based on your resting heart rate, heart rate variability, and other cardiovascular metrics collected during sleep.
                    </p>
                    <p class="mt-3 pt-3 border-t border-blue-300">
                        <strong>Improving your score:</strong> Regular exercise, quality sleep, stress management, and a healthy diet can help lower your cardiovascular age.
                    </p>
                </div>
            </div>

            <!-- Daily Records -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Records</h3>
                <div class="space-y-2">
                    ${data.slice().reverse().map(record => `
                        <div class="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">${getAgeEmoji(record.vascular_age)}</div>
                                <div>
                                    <div class="text-sm font-medium text-gray-900">${formatDate(record.day)}</div>
                                    <div class="text-xs text-gray-500">${new Date(record.day).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold ${getAgeColor(record.vascular_age)}">${record.vascular_age}</div>
                                <div class="text-xs text-gray-500">years</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    renderCardiovascularChart(data);
}

function renderCardiovascularChart(data) {
    const dates = data.map(d => d.day);
    const ages = data.map(d => parseFloat(d.vascular_age));
    
    // Create gradient colors based on age
    const colors = ages.map(age => {
        if (age <= 15) return '#10b981'; // Green - excellent
        if (age <= 18) return '#3b82f6'; // Blue - good
        if (age <= 22) return '#f59e0b'; // Orange - moderate
        return '#ef4444'; // Red - needs attention
    });
    
    const trace = {
        x: dates,
        y: ages,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#3b82f6', width: 3 },
        marker: { 
            size: 10,
            color: colors,
            line: { width: 2, color: '#fff' }
        },
        hovertemplate: '<b>%{x}</b><br>Vascular Age: %{y} years<extra></extra>'
    };
    
    const layout = {
        height: 400,
        margin: { l: 50, r: 30, t: 30, b: 80 },
        xaxis: { 
            title: 'Date',
            type: 'date'
        },
        yaxis: { 
            title: 'Vascular Age (years)',
            range: [Math.min(...ages) - 2, Math.max(...ages) + 2]
        },
        hovermode: 'closest',
        shapes: [
            {
                type: 'line',
                x0: dates[0],
                x1: dates[dates.length - 1],
                y0: 18,
                y1: 18,
                line: {
                    color: '#10b981',
                    width: 2,
                    dash: 'dash'
                }
            }
        ],
        annotations: [
            {
                x: dates[Math.floor(dates.length / 2)],
                y: 18,
                text: 'Target: ≤18 years',
                showarrow: false,
                yshift: 10,
                font: { color: '#10b981', size: 12 }
            }
        ]
    };
    
    Plotly.newPlot('cardio-age-chart', [trace], layout, { responsive: true });
}

function getAgeEmoji(age) {
    const ageNum = parseFloat(age);
    if (ageNum <= 15) return '💚';
    if (ageNum <= 18) return '💙';
    if (ageNum <= 22) return '🧡';
    return '❤️';
}

function getAgeColor(age) {
    const ageNum = parseFloat(age);
    if (ageNum <= 15) return 'text-green-600';
    if (ageNum <= 18) return 'text-blue-600';
    if (ageNum <= 22) return 'text-orange-600';
    return 'text-red-600';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

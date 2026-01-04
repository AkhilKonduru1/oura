// Session visualization - meditation and breathing exercises
let currentSessionData = null;

function loadSessionData() {
    if (!healthData['session.csv']) {
        document.getElementById('tab-content-session').innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p class="text-gray-500">No session data available</p>
            </div>
        `;
        return;
    }

    currentSessionData = healthData['session.csv'];
    displaySessionData();
}

function displaySessionData() {
    const container = document.getElementById('tab-content-session');
    
    const sessions = currentSessionData
        .filter(d => d.day)
        .sort((a, b) => new Date(b.day) - new Date(a.day));
    
    // Calculate session duration in minutes
    sessions.forEach(session => {
        if (session.start_datetime && session.end_datetime) {
            const start = new Date(session.start_datetime);
            const end = new Date(session.end_datetime);
            session.duration_minutes = (end - start) / 1000 / 60;
        }
    });
    
    const typeIcons = {
        'meditation': '🧘',
        'breathing': '🌬️',
        'rest': '😌'
    };
    
    const typeColors = {
        'meditation': 'border-purple-500 bg-purple-50',
        'breathing': 'border-blue-500 bg-blue-50',
        'rest': 'border-green-500 bg-green-50'
    };
    
    const moodEmojis = {
        'good': '😊',
        'same': '😐',
        'bad': '😔'
    };
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Mindfulness Sessions</h3>
                <p class="text-sm text-gray-600">Track your meditation, breathing exercises, and rest sessions</p>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-gray-900">${sessions.length}</div>
                    <div class="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-purple-600">${sessions.filter(s => s.type === 'meditation').length}</div>
                    <div class="text-sm text-gray-600">Meditations</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-blue-600">${sessions.filter(s => s.type === 'breathing').length}</div>
                    <div class="text-sm text-gray-600">Breathing Exercises</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-600">${calculateTotalMinutes(sessions).toFixed(0)}</div>
                    <div class="text-sm text-gray-600">Total Minutes</div>
                </div>
            </div>

            <!-- Sessions Chart -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Session Duration Over Time</h3>
                <div id="sessions-duration-chart"></div>
            </div>

            <!-- Heart Rate Trends -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Average Heart Rate During Sessions</h3>
                <div id="sessions-hr-chart"></div>
            </div>

            <!-- Sessions List -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
                <div class="space-y-3">
                    ${sessions.map(session => `
                        <div class="border-l-4 ${typeColors[session.type] || 'border-gray-300 bg-gray-50'} p-4 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-xl">${typeIcons[session.type] || '📊'}</span>
                                        <span class="font-semibold text-gray-900 capitalize">${session.type || 'Session'}</span>
                                        ${session.mood ? `<span class="text-lg">${moodEmojis[session.mood] || session.mood}</span>` : ''}
                                    </div>
                                    <div class="mt-2 text-sm text-gray-600">
                                        <div><strong>Date:</strong> ${formatDate(session.day)}</div>
                                        <div><strong>Time:</strong> ${formatTime(session.start_datetime)} - ${formatTime(session.end_datetime)}</div>
                                        ${session.duration_minutes ? `<div><strong>Duration:</strong> ${session.duration_minutes.toFixed(1)} minutes</div>` : ''}
                                    </div>
                                    ${getAverageHeartRate(session) ? `
                                        <div class="mt-2 text-sm text-gray-700">
                                            <strong>Avg Heart Rate:</strong> ${getAverageHeartRate(session).toFixed(1)} bpm
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    renderSessionCharts(sessions);
}

function renderSessionCharts(sessions) {
    // Duration chart
    const dates = sessions.map(s => s.day).reverse();
    const durations = sessions.map(s => s.duration_minutes || 0).reverse();
    const types = sessions.map(s => s.type).reverse();
    
    const colors = types.map(type => {
        if (type === 'meditation') return '#8b5cf6';
        if (type === 'breathing') return '#3b82f6';
        if (type === 'rest') return '#10b981';
        return '#6b7280';
    });
    
    const durationTrace = {
        x: dates,
        y: durations,
        type: 'bar',
        marker: { color: colors },
        hovertemplate: '<b>%{x}</b><br>Duration: %{y:.1f} min<extra></extra>'
    };
    
    const durationLayout = {
        height: 350,
        margin: { l: 50, r: 30, t: 30, b: 80 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Duration (minutes)' },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('sessions-duration-chart', [durationTrace], durationLayout, { responsive: true });
    
    // Heart rate chart
    const sessionsWithHR = sessions.filter(s => getAverageHeartRate(s) !== null).reverse();
    const hrDates = sessionsWithHR.map(s => s.day);
    const avgHRs = sessionsWithHR.map(s => getAverageHeartRate(s));
    
    if (hrDates.length > 0) {
        const hrTrace = {
            x: hrDates,
            y: avgHRs,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#ef4444', width: 2 },
            marker: { size: 6 },
            hovertemplate: '<b>%{x}</b><br>Avg HR: %{y:.1f} bpm<extra></extra>'
        };
        
        const hrLayout = {
            height: 300,
            margin: { l: 50, r: 30, t: 30, b: 80 },
            xaxis: { title: 'Date' },
            yaxis: { title: 'Heart Rate (bpm)' },
            hovermode: 'closest'
        };
        
        Plotly.newPlot('sessions-hr-chart', [hrTrace], hrLayout, { responsive: true });
    } else {
        document.getElementById('sessions-hr-chart').innerHTML = 
            '<div class="text-center text-gray-500 py-8">No heart rate data available for sessions</div>';
    }
}

function getAverageHeartRate(session) {
    if (!session.heart_rate) return null;
    
    try {
        const hrData = JSON.parse(session.heart_rate);
        if (hrData && hrData.items && Array.isArray(hrData.items)) {
            const validHRs = hrData.items.filter(hr => hr !== null && !isNaN(hr));
            if (validHRs.length > 0) {
                return validHRs.reduce((sum, hr) => sum + hr, 0) / validHRs.length;
            }
        }
    } catch (e) {
        // Not valid JSON or error parsing
    }
    
    return null;
}

function calculateTotalMinutes(sessions) {
    return sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);
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

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timeStr;
    }
}

# Oura CSV

A free, open-source web dashboard for visualizing your Oura Ring data. Upload your CSV exports and get detailed charts covering sleep patterns, activity levels, heart rate variability, temperature trends, and more—all without needing an Oura subscription.

## Why This Exists

Oura gives you data exports, but the built-in visualizations can be limiting. This project lets you:
- View long-term trends across all your metrics
- Analyze sleep stages, REM, deep sleep, and efficiency over time
- Track HRV, resting heart rate, and cardiovascular age
- Get AI-powered insights about your health patterns
- Keep your data private—everything runs locally or in temporary sessions

## Quick Start

### 1. Install Dependencies

Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate
```

Install required packages:
```bash
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python server.py
```

The app will start on `http://localhost:5000` (or another port if 5000 is busy).

### 3. Upload Your Data

1. Go to [cloud.ouraring.com](https://cloud.ouraring.com)
2. Navigate to Account Settings → Data Export
3. Download your data archive
4. Extract the ZIP file
5. Upload the CSV files to the dashboard

That's it. The dashboard will generate interactive visualizations automatically.

## What You Get

- **Sleep Analysis**: Deep dive into sleep stages, efficiency, latency, and total sleep time
- **Activity Tracking**: Steps, calories, movement, and activity scores
- **Heart Metrics**: HRV trends, resting heart rate, and cardiovascular age estimates
- **Temperature**: Body temperature deviations and patterns
- **Readiness Scores**: Daily recovery and readiness tracking
- **Session Data**: Workouts and tagged activities
- **AI Chat**: Ask questions about your health data and get personalized insights

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JS + Tailwind CSS
- **Charts**: Plotly.js
- **AI**: Groq API (optional, for chat features)

## Contributing

This is a side project, but contributions are welcome. If you find bugs or want to add features:
1. Fork the repo
2. Make your changes
3. Submit a pull request

No formal process—just keep it clean and functional.

## License

MIT License. Use it however you want.

## Disclaimer

Not affiliated with Oura Health Oy. This is an independent tool for personal data visualization.

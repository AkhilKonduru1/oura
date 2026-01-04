# Oura Data Dashboard

This is a Streamlit application to visualize Oura Ring data from CSV files.

## Setup

1.  Create a virtual environment (optional but recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the App

Run the following command:

```bash
streamlit run app.py
```

## Usage

1.  Open the link provided in the terminal (usually http://localhost:8501).
2.  Click "Browse files" and select all your Oura CSV files (e.g., from the `App Data` folder).
3.  The dashboard will automatically generate graphs for Activity, Sleep, Heart Rate, Stress, and Readiness.

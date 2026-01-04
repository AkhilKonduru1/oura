from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Custom JSON encoder to handle NaN values
class NanSafeJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, float):
            if np.isnan(obj) or np.isinf(obj):
                return None
        return super().default(obj)

app.json_encoder = NanSafeJSONEncoder

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Store uploaded data in memory
data_store = {}

def clean_nan_from_dict(data):
    """Recursively clean NaN and inf values from dictionaries and lists"""
    if isinstance(data, dict):
        return {k: clean_nan_from_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nan_from_dict(item) for item in data]
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return None
        return data
    return data

def safe_mean(values):
    """Calculate mean safely, returning 0 if no valid values"""
    valid_values = [v for v in values if v is not None and not (isinstance(v, float) and (np.isnan(v) or np.isinf(v)))]
    return sum(valid_values) / len(valid_values) if valid_values else 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    global data_store
    data_store = {}
    
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        processed_files = []
        
        for file in files:
            if file.filename.endswith('.csv'):
                try:
                    df = pd.read_csv(file, sep=';')
                    # Replace NaN/inf values with None for JSON serialization
                    df = df.replace([np.inf, -np.inf], None)
                    df = df.replace({np.nan: None})
                    df = df.where(pd.notnull(df), None)
                    # Convert to JSON serializable format
                    df_dict = df.to_dict('records')
                    # Clean any remaining NaN values from the dict
                    df_dict = clean_nan_from_dict(df_dict)
                    data_store[file.filename] = df_dict
                    processed_files.append(file.filename)
                    print(f"Successfully processed: {file.filename} ({len(df_dict)} records)")
                except Exception as e:
                    print(f"Error reading {file.filename}: {str(e)}")
                    return jsonify({'error': f'Error reading {file.filename}: {str(e)}'}), 400
        
        if not processed_files:
            return jsonify({'error': 'No valid CSV files found'}), 400
        
        # Generate AI summary
        summary = generate_ai_summary(data_store)
        
        print(f"Upload successful: {len(processed_files)} files processed")
        return jsonify({
            'success': True,
            'files': processed_files,
            'summary': summary,
            'data': data_store
        })
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/data/<filename>')
def get_data(filename):
    if filename in data_store:
        return jsonify(data_store[filename])
    return jsonify({'error': 'File not found'}), 404

@app.route('/files', methods=['GET'])
def get_files():
    return jsonify({
        'files': list(data_store.keys()),
        'count': len(data_store)
    })

def generate_ai_summary(data):
    """Generate AI summary using Groq API"""
    try:
        # Prepare data summary for AI
        summary_text = "Health Data Summary:\n\n"
        
        if 'dailysleep.csv' in data:
            sleep_data = data['dailysleep.csv']
            sleep_scores = [d.get('score') for d in sleep_data if d.get('score') is not None]
            avg_sleep = safe_mean(sleep_scores)
            summary_text += f"Sleep: {len(sleep_data)} nights tracked, average score {avg_sleep:.1f}\n"
        
        if 'dailyactivity.csv' in data:
            activity_data = data['dailyactivity.csv']
            steps = [d.get('steps') for d in activity_data if d.get('steps') is not None]
            avg_steps = safe_mean(steps)
            summary_text += f"Activity: {len(activity_data)} days tracked, average {avg_steps:.0f} steps/day\n"
        
        if 'dailyreadiness.csv' in data:
            readiness_data = data['dailyreadiness.csv']
            readiness_scores = [d.get('score') for d in readiness_data if d.get('score') is not None]
            avg_readiness = safe_mean(readiness_scores)
            summary_text += f"Readiness: Average score {avg_readiness:.1f}\n"
        
        if not summary_text.strip() or summary_text == "Health Data Summary:\n\n":
            return "Your health data has been uploaded successfully! Explore the tabs to view detailed insights."
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a health data analyst. Provide a brief, encouraging 2-3 sentence summary of the user's health data trends. Focus on positives and actionable insights."
                },
                {
                    "role": "user",
                    "content": f"Summarize this health data in 2-3 sentences:\n{summary_text}"
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=150
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"AI Summary Error: {str(e)}")
        return "Your health data has been uploaded successfully! Explore the tabs below to view detailed insights and trends."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        user_data = data.get('data', {})
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Prepare context from user's health data
        context = "User's Health Data Summary:\n"
        
        if user_data:
            # Sleep data
            if 'dailysleep.csv' in user_data:
                sleep_data = user_data['dailysleep.csv']
                if sleep_data:
                    sleep_scores = [d.get('score') for d in sleep_data if d.get('score')]
                    if sleep_scores:
                        context += f"- Sleep: {len(sleep_data)} nights, avg score {safe_mean(sleep_scores):.1f}\n"
                        context += f"  Latest: {sleep_data[-1].get('day')} - Score: {sleep_data[-1].get('score')}\n"
            
            # Activity data
            if 'dailyactivity.csv' in user_data:
                activity_data = user_data['dailyactivity.csv']
                if activity_data:
                    steps = [d.get('steps') for d in activity_data if d.get('steps')]
                    calories = [d.get('total_calories') for d in activity_data if d.get('total_calories')]
                    if steps:
                        context += f"- Activity: {len(activity_data)} days, avg {safe_mean(steps):.0f} steps, {safe_mean(calories):.0f} calories\n"
                        context += f"  Latest: {activity_data[-1].get('day')} - {activity_data[-1].get('steps')} steps\n"
            
            # Readiness data
            if 'dailyreadiness.csv' in user_data:
                readiness_data = user_data['dailyreadiness.csv']
                if readiness_data:
                    readiness_scores = [d.get('score') for d in readiness_data if d.get('score')]
                    if readiness_scores:
                        context += f"- Readiness: avg score {safe_mean(readiness_scores):.1f}\n"
                        context += f"  Latest: {readiness_data[-1].get('day')} - Score: {readiness_data[-1].get('score')}\n"
            
            # Stress data
            if 'dailystress.csv' in user_data:
                stress_data = user_data['dailystress.csv']
                if stress_data:
                    recent_stress = [d for d in stress_data if d.get('day_summary')][-5:] if stress_data else []
                    if recent_stress:
                        context += f"- Stress: Recent days - {', '.join([d.get('day_summary', 'N/A') for d in recent_stress])}\n"
            
            # SpO2 data
            if 'dailyspo2.csv' in user_data:
                spo2_data = user_data['dailyspo2.csv']
                if spo2_data:
                    context += f"- SpO2: {len(spo2_data)} measurements tracked\n"
            
            # Heart rate data
            if 'heartrate.csv' in user_data:
                hr_data = user_data['heartrate.csv']
                if hr_data:
                    bpms = [d.get('bpm') for d in hr_data if d.get('bpm')]
                    if bpms:
                        context += f"- Heart Rate: {len(hr_data)} measurements, avg {safe_mean(bpms):.0f} bpm\n"
        
        # Create chat completion with user context
        system_message = """You are a helpful health and wellness assistant for Oura Ring users. Your role is to:
        - Answer questions about the user's specific health data with personalized insights
        - Explain health metrics (sleep score, HRV, readiness, activity, stress, recovery, SpO2, etc.)
        - Provide science-based lifestyle advice for improving health metrics
        - Answer questions about the dashboard features
        - Give actionable tips for better sleep, stress management, and overall wellness
        
        When the user has uploaded data, use their specific numbers in your responses. Keep responses concise (2-4 sentences), friendly, and evidence-based. If asked about medical concerns, remind users to consult healthcare professionals."""
        
        if context.strip() != "User's Health Data Summary:":
            system_message += f"\n\n{context}"
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=250
        )
        
        response = chat_completion.choices[0].message.content
        return jsonify({'response': response})
        
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get response. Please try again.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

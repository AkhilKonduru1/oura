import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json

st.set_page_config(page_title="Oura Data Dashboard", layout="wide")

st.title("Oura Data Dashboard")
st.write("Upload your Oura CSV files to visualize your data.")

uploaded_files = st.file_uploader("Choose CSV files", accept_multiple_files=True, type="csv")

if uploaded_files:
    st.header("Data Visualizations")
    
    # Dictionary to store dataframes
    dfs = {}

    for uploaded_file in uploaded_files:
        try:
            # Read CSV with semicolon separator
            df = pd.read_csv(uploaded_file, sep=';')
            dfs[uploaded_file.name] = df
        except Exception as e:
            st.error(f"Error reading {uploaded_file.name}: {e}")

    # Visualizations based on file content
    
    # 1. Daily Activity
    if 'dailyactivity.csv' in dfs:
        st.subheader("Daily Activity")
        df_activity = dfs['dailyactivity.csv']
        df_activity['day'] = pd.to_datetime(df_activity['day'])
        
        # Steps and Calories
        fig_activity = px.bar(df_activity, x='day', y='steps', title='Daily Steps', color='steps')
        st.plotly_chart(fig_activity, use_container_width=True)
        
        fig_cal = px.line(df_activity, x='day', y=['active_calories', 'total_calories'], title='Calories Burned')
        st.plotly_chart(fig_cal, use_container_width=True)

        # Activity Score
        fig_score = px.line(df_activity, x='day', y='score', title='Activity Score', markers=True)
        fig_score.update_yaxes(range=[0, 100])
        st.plotly_chart(fig_score, use_container_width=True)

    # 2. Daily Sleep
    if 'dailysleep.csv' in dfs:
        st.subheader("Daily Sleep")
        df_sleep = dfs['dailysleep.csv']
        df_sleep['day'] = pd.to_datetime(df_sleep['day'])
        
        # Sleep Score
        fig_sleep = px.line(df_sleep, x='day', y='score', title='Sleep Score', markers=True)
        fig_sleep.update_yaxes(range=[0, 100])
        st.plotly_chart(fig_sleep, use_container_width=True)
        
        # Parse contributors if possible
        try:
            # Example of parsing one contributor if needed, but score is good for now
            pass
        except:
            pass

    # 3. Heart Rate
    if 'heartrate.csv' in dfs:
        st.subheader("Heart Rate")
        df_hr = dfs['heartrate.csv']
        df_hr['timestamp'] = pd.to_datetime(df_hr['timestamp'])
        
        # Downsample if too big (e.g., take every 10th point or aggregate)
        # For now, let's just plot it. If it's huge, it might be slow.
        # Let's aggregate by hour to make it readable and fast
        df_hr['hour'] = df_hr['timestamp'].dt.floor('h')
        df_hr_agg = df_hr.groupby('hour')['bpm'].mean().reset_index()
        
        fig_hr = px.line(df_hr_agg, x='hour', y='bpm', title='Average Hourly Heart Rate')
        st.plotly_chart(fig_hr, use_container_width=True)

    # 4. Daily Stress
    if 'dailystress.csv' in dfs:
        st.subheader("Daily Stress")
        df_stress = dfs['dailystress.csv']
        df_stress['day'] = pd.to_datetime(df_stress['day'])
        
        fig_stress = px.bar(df_stress, x='day', y=['stress_high', 'recovery_high'], title='Stress vs Recovery High Minutes', barmode='group')
        st.plotly_chart(fig_stress, use_container_width=True)

    # 5. Daily Readiness
    if 'dailyreadiness.csv' in dfs:
        st.subheader("Daily Readiness")
        df_readiness = dfs['dailyreadiness.csv']
        df_readiness['day'] = pd.to_datetime(df_readiness['day'])
        
        fig_readiness = px.line(df_readiness, x='day', y='score', title='Readiness Score', markers=True)
        fig_readiness.update_yaxes(range=[0, 100])
        st.plotly_chart(fig_readiness, use_container_width=True)

    # 6. Daily SpO2
    if 'dailyspo2.csv' in dfs:
        st.subheader("Daily SpO2")
        df_spo2 = dfs['dailyspo2.csv']
        df_spo2['day'] = pd.to_datetime(df_spo2['day'])
        
        # Parse JSON column
        def get_spo2_avg(x):
            try:
                return json.loads(x).get('average')
            except:
                return None
                
        df_spo2['spo2_avg'] = df_spo2['spo2_percentage'].apply(get_spo2_avg)
        
        fig_spo2 = px.line(df_spo2, x='day', y='spo2_avg', title='Average SpO2 Percentage', markers=True)
        fig_spo2.update_yaxes(range=[80, 100])
        st.plotly_chart(fig_spo2, use_container_width=True)
        
        fig_breathing = px.bar(df_spo2, x='day', y='breathing_disturbance_index', title='Breathing Disturbance Index')
        st.plotly_chart(fig_breathing, use_container_width=True)

    # 7. Daily Resilience
    if 'dailyresilience.csv' in dfs:
        st.subheader("Daily Resilience")
        df_resilience = dfs['dailyresilience.csv']
        df_resilience['day'] = pd.to_datetime(df_resilience['day'])
        
        # Parse contributors
        def parse_resilience(x):
            try:
                return json.loads(x)
            except:
                return {}
        
        resilience_data = df_resilience['contributors'].apply(parse_resilience).apply(pd.Series)
        df_resilience = pd.concat([df_resilience, resilience_data], axis=1)
        
        # Plot contributors
        if not resilience_data.empty:
            fig_resilience = px.line(df_resilience, x='day', y=resilience_data.columns, title='Resilience Contributors')
            st.plotly_chart(fig_resilience, use_container_width=True)
            
        st.write("Resilience Levels:")
        st.dataframe(df_resilience[['day', 'level']].sort_values('day', ascending=False))

    # 8. Workouts
    if 'workout.csv' in dfs:
        st.subheader("Workouts")
        df_workout = dfs['workout.csv']
        df_workout['day'] = pd.to_datetime(df_workout['day'])
        
        fig_workout = px.bar(df_workout, x='day', y='calories', color='activity', title='Workout Calories by Activity')
        st.plotly_chart(fig_workout, use_container_width=True)
        
        st.dataframe(df_workout[['day', 'activity', 'calories', 'distance', 'intensity', 'start_datetime']])

    # 9. Temperature
    if 'temperature.csv' in dfs:
        st.subheader("Skin Temperature")
        df_temp = dfs['temperature.csv']
        df_temp['timestamp'] = pd.to_datetime(df_temp['timestamp'])
        
        # Aggregate by hour
        df_temp['hour'] = df_temp['timestamp'].dt.floor('h')
        df_temp_agg = df_temp.groupby('hour')['skin_temp'].mean().reset_index()
        
        fig_temp = px.line(df_temp_agg, x='hour', y='skin_temp', title='Average Hourly Skin Temperature')
        st.plotly_chart(fig_temp, use_container_width=True)

    # 10. VO2 Max
    if 'vo2max.csv' in dfs:
        df_vo2 = dfs['vo2max.csv']
        if not df_vo2.empty and 'vo2_max' in df_vo2.columns:
            st.subheader("VO2 Max")
            df_vo2['day'] = pd.to_datetime(df_vo2['day'])
            fig_vo2 = px.line(df_vo2, x='day', y='vo2_max', title='VO2 Max Trend', markers=True)
            st.plotly_chart(fig_vo2, use_container_width=True)

    # Generic File Viewer
    st.header("Raw Data Explorer")
    selected_file = st.selectbox("Select a file to view raw data", list(dfs.keys()))
    if selected_file:
        st.write(dfs[selected_file])

else:
    st.info("Please upload CSV files to begin.")

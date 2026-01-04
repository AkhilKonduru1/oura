import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import datetime

# --- Page Configuration ---
st.set_page_config(
    page_title="Oura Health Dashboard",
    page_icon="💍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Sidebar Theme Settings ---
with st.sidebar:
    st.header("🎨 Customization")
    with st.expander("Theme Settings", expanded=False):
        theme_mode = st.radio("Preset", ["Light", "Dark", "Custom"], horizontal=True)
        
        if theme_mode == "Light":
            bg_start = "#f5f7fa"
            bg_end = "#c3cfe2"
            card_bg = "#ffffff"
            text_color = "#32325d"
        elif theme_mode == "Dark":
            bg_start = "#1a1a2e"
            bg_end = "#16213e"
            card_bg = "#0f3460"
            text_color = "#e94560"
        else:
            bg_start = st.color_picker("Background Gradient Start", "#f5f7fa")
            bg_end = st.color_picker("Background Gradient End", "#c3cfe2")
            card_bg = st.color_picker("Card Background", "#ffffff")
            text_color = st.color_picker("Text Color", "#32325d")

# --- Tailwind CSS Integration ---
st.markdown(f"""
<script src="https://cdn.tailwindcss.com"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Main Background */
    .stApp {{
        background: linear-gradient(135deg, {bg_start} 0%, {bg_end} 100%);
        font-family: 'Inter', sans-serif;
        color: {text_color};
    }}
    
    /* Override Streamlit defaults */
    .stTabs [data-baseweb="tab-list"] {{
        gap: 2rem;
    }}
    
    .stTabs [data-baseweb="tab"] {{
        height: 3rem;
        font-weight: 600;
        font-size: 1rem;
    }}
    
    /* Metrics */
    div[data-testid="stMetricValue"] {{
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }}
</style>
""", unsafe_allow_html=True)

# --- Helper Functions ---
def load_data(uploaded_file):
    try:
        df = pd.read_csv(uploaded_file, sep=';')
        return df
    except Exception as e:
        st.error(f"Error reading {uploaded_file.name}: {e}")
        return None

def parse_json_col(df, col_name, key):
    def extract(x):
        try:
            return json.loads(x).get(key)
        except:
            return None
    return df[col_name].apply(extract)

def parse_contributors(json_str):
    """Parse contributor JSON string into dictionary"""
    try:
        return json.loads(json_str)
    except:
        return {}

def render_contributor_card(label, value, description=""):
    """Render a contributor score card using Tailwind CSS classes"""
    color_class = "bg-green-500" if value >= 80 else "bg-orange-500" if value >= 60 else "bg-red-500"
    border_color = "border-green-500" if value >= 80 else "border-orange-500" if value >= 60 else "border-red-500"
    
    return f"""
    <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 {border_color} rounded-lg p-4 my-2 transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <div class="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">{label.replace('_', ' ').title()}</div>
        <div class="text-3xl font-bold text-gray-800 mb-2">{value}</div>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div class="{color_class} h-2 rounded-full transition-all duration-300" style="width: {value}%"></div>
        </div>
        {f'<p class="text-xs text-gray-600 mt-2">{description}</p>' if description else ''}
    </div>
    """

# --- Main App ---

st.title("💍 Oura Health Dashboard")
st.markdown("### Your personal health data, visualized.")

# Sidebar for Uploads
with st.sidebar:
    st.header("Data Import")
    uploaded_files = st.file_uploader("Upload Oura CSV Exports", accept_multiple_files=True, type="csv")
    st.markdown("---")
    st.markdown("**Instructions:**\n1. Export your data from Oura Cloud.\n2. Upload the CSV files here.\n3. Explore your health trends.")

if uploaded_files:
    # Load Data
    dfs = {}
    for uploaded_file in uploaded_files:
        df = load_data(uploaded_file)
        if df is not None:
            dfs[uploaded_file.name] = df

    # --- Dashboard Overview Section ---
    st.markdown("## 📊 Overview")
    
    # Calculate Key Metrics
    col1, col2, col3, col4 = st.columns(4)
    
    # 1. Sleep Score
    if 'dailysleep.csv' in dfs:
        df_sleep = dfs['dailysleep.csv']
        df_sleep['day'] = pd.to_datetime(df_sleep['day'])
        latest_sleep = df_sleep.sort_values('day').iloc[-1]
        avg_sleep = df_sleep['score'].mean()
        
        with col1:
            st.metric("Avg Sleep Score", f"{avg_sleep:.0f}", delta=f"{latest_sleep['score'] - avg_sleep:.0f} vs avg")
            
    # 2. Activity Score
    if 'dailyactivity.csv' in dfs:
        df_activity = dfs['dailyactivity.csv']
        df_activity['day'] = pd.to_datetime(df_activity['day'])
        latest_activity = df_activity.sort_values('day').iloc[-1]
        avg_activity = df_activity['score'].mean()
        
        with col2:
            st.metric("Avg Activity Score", f"{avg_activity:.0f}", delta=f"{latest_activity['score'] - avg_activity:.0f} vs avg")

    # 3. Readiness Score
    if 'dailyreadiness.csv' in dfs:
        df_readiness = dfs['dailyreadiness.csv']
        df_readiness['day'] = pd.to_datetime(df_readiness['day'])
        latest_readiness = df_readiness.sort_values('day').iloc[-1]
        avg_readiness = df_readiness['score'].mean()
        
        with col3:
            st.metric("Avg Readiness Score", f"{avg_readiness:.0f}", delta=f"{latest_readiness['score'] - avg_readiness:.0f} vs avg")

    # 4. Steps
    if 'dailyactivity.csv' in dfs:
        avg_steps = df_activity['steps'].mean()
        latest_steps = df_activity.sort_values('day').iloc[-1]['steps']
        with col4:
            st.metric("Avg Daily Steps", f"{avg_steps:,.0f}", delta=f"{latest_steps - avg_steps:,.0f} vs avg")

    st.markdown("---")

    # --- Detailed Visualizations ---
    
    # Tabs for better organization
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["😴 Sleep", "🏃 Activity", "❤️ Heart & Stress", "🌬️ SpO2 & Resilience", "📋 Raw Data"])

    # --- Tab 1: Sleep ---
    with tab1:
        if 'dailysleep.csv' in dfs:
            st.subheader("😴 Sleep Analysis")
            
            # Parse contributors for all sleep data
            df_sleep['contributors_parsed'] = df_sleep['contributors'].apply(parse_contributors)
            
            # Extract individual contributor scores
            for contributor in ['deep_sleep', 'efficiency', 'latency', 'rem_sleep', 'restfulness', 'timing', 'total_sleep']:
                df_sleep[contributor] = df_sleep['contributors_parsed'].apply(lambda x: x.get(contributor, 0))
            
            # Main Sleep Score Chart with enhanced interactivity
            fig_sleep = go.Figure()
            
            # Add main score line
            fig_sleep.add_trace(go.Scatter(
                x=df_sleep['day'],
                y=df_sleep['score'],
                mode='lines+markers',
                name='Sleep Score',
                line=dict(color='#667eea', width=3),
                marker=dict(size=8),
                hovertemplate='<b>%{x|%B %d, %Y}</b><br>' +
                              'Sleep Score: %{y}<br>' +
                              '<extra></extra>'
            ))
            
            fig_sleep.update_layout(
                plot_bgcolor=card_bg,
                paper_bgcolor=card_bg,
                font_color=text_color,
                title='Daily Sleep Score Trend',
                xaxis_title="Date",
                yaxis_title="Score",
                hovermode="x unified",
                yaxis=dict(range=[0, 100], gridcolor='rgba(0,0,0,0.1)'),
                xaxis=dict(gridcolor='rgba(0,0,0,0.1)')
            )
            
            st.plotly_chart(fig_sleep, use_container_width=True)
            
            # Interactive Sleep Detail Selector
            st.markdown("### 🔍 Detailed Sleep Insights")
            selected_date = st.selectbox(
                "Select a date to view detailed breakdown:",
                options=df_sleep.sort_values('day', ascending=False)['day'].dt.strftime('%Y-%m-%d').tolist()
            )
            
            if selected_date:
                selected_row = df_sleep[df_sleep['day'].dt.strftime('%Y-%m-%d') == selected_date].iloc[0]
                contributors = selected_row['contributors_parsed']
                
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.markdown(render_contributor_card(
                        "Deep Sleep",
                        contributors.get('deep_sleep', 0),
                        "Restorative sleep phase"
                    ), unsafe_allow_html=True)
                    
                with col2:
                    st.markdown(render_contributor_card(
                        "REM Sleep",
                        contributors.get('rem_sleep', 0),
                        "Dream and memory consolidation"
                    ), unsafe_allow_html=True)
                    
                with col3:
                    st.markdown(render_contributor_card(
                        "Efficiency",
                        contributors.get('efficiency', 0),
                        "Time asleep vs time in bed"
                    ), unsafe_allow_html=True)
                    
                with col4:
                    st.markdown(render_contributor_card(
                        "Latency",
                        contributors.get('latency', 0),
                        "Time to fall asleep"
                    ), unsafe_allow_html=True)
                
                col5, col6, col7 = st.columns(3)
                
                with col5:
                    st.markdown(render_contributor_card(
                        "Restfulness",
                        contributors.get('restfulness', 0),
                        "Sleep disruptions"
                    ), unsafe_allow_html=True)
                    
                with col6:
                    st.markdown(render_contributor_card(
                        "Timing",
                        contributors.get('timing', 0),
                        "Sleep schedule consistency"
                    ), unsafe_allow_html=True)
                    
                with col7:
                    st.markdown(render_contributor_card(
                        "Total Sleep",
                        contributors.get('total_sleep', 0),
                        "Duration of sleep"
                    ), unsafe_allow_html=True)
                
                # Contributor breakdown chart
                with st.expander("📊 Full Screen - Sleep Contributors Over Time"):
                    fig_contributors = go.Figure()
                    
                    contributors_to_plot = ['deep_sleep', 'rem_sleep', 'efficiency', 'latency', 'restfulness', 'timing', 'total_sleep']
                    colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140']
                    
                    for i, contrib in enumerate(contributors_to_plot):
                        fig_contributors.add_trace(go.Scatter(
                            x=df_sleep['day'],
                            y=df_sleep[contrib],
                            mode='lines',
                            name=contrib.replace('_', ' ').title(),
                            line=dict(color=colors[i], width=2),
                            hovertemplate='<b>%{x|%B %d}</b><br>Score: %{y}<extra></extra>'
                        ))
                    
                    fig_contributors.update_layout(
                        plot_bgcolor=card_bg,
                        paper_bgcolor=card_bg,
                        font_color=text_color,
                        title='Sleep Contributors Trend',
                        xaxis_title="Date",
                        yaxis_title="Score",
                        height=600,
                        yaxis=dict(range=[0, 100])
                    )
                    
                    st.plotly_chart(fig_contributors, use_container_width=True)
                    
        else:
            st.info("📁 Upload 'dailysleep.csv' to view sleep data.")


    # --- Tab 2: Activity ---
    with tab2:
        if 'dailyactivity.csv' in dfs:
            st.subheader("🏃 Activity Analysis")
            
            # Parse activity contributors
            df_activity['contributors_parsed'] = df_activity['contributors'].apply(parse_contributors)
            
            col_a, col_b = st.columns(2)
            
            with col_a:
                # Enhanced Steps Chart
                fig_steps = go.Figure()
                fig_steps.add_trace(go.Bar(
                    x=df_activity['day'],
                    y=df_activity['steps'],
                    marker=dict(
                        color=df_activity['steps'],
                        colorscale='Viridis',
                        showscale=True,
                        colorbar=dict(title="Steps")
                    ),
                    hovertemplate='<b>%{x|%B %d}</b><br>Steps: %{y:,}<extra></extra>'
                ))
                fig_steps.update_layout(
                    plot_bgcolor=card_bg,
                    paper_bgcolor=card_bg,
                    font_color=text_color,
                    title='Daily Steps',
                    xaxis_title="Date",
                    yaxis_title="Steps"
                )
                st.plotly_chart(fig_steps, use_container_width=True)
                
            with col_b:
                # Enhanced Calories Chart
                fig_cal = go.Figure()
                fig_cal.add_trace(go.Scatter(
                    x=df_activity['day'],
                    y=df_activity['total_calories'],
                    fill='tonexty',
                    name='Total Calories',
                    line=dict(color='#635bff', width=0),
                    fillcolor='rgba(99, 91, 255, 0.3)'
                ))
                fig_cal.add_trace(go.Scatter(
                    x=df_activity['day'],
                    y=df_activity['active_calories'],
                    fill='tozeroy',
                    name='Active Calories',
                    line=dict(color='#00d4ff', width=2),
                    fillcolor='rgba(0, 212, 255, 0.5)'
                ))
                fig_cal.update_layout(
                    plot_bgcolor=card_bg,
                    paper_bgcolor=card_bg,
                    font_color=text_color,
                    title='Calories Burned',
                    xaxis_title="Date",
                    yaxis_title="Calories"
                )
                st.plotly_chart(fig_cal, use_container_width=True)
            
            # Activity Detail Selector
            st.markdown("### 🔍 Detailed Activity Breakdown")
            selected_activity_date = st.selectbox(
                "Select a date for activity details:",
                options=df_activity.sort_values('day', ascending=False)['day'].dt.strftime('%Y-%m-%d').tolist(),
                key='activity_date'
            )
            
            if selected_activity_date:
                selected_activity = df_activity[df_activity['day'].dt.strftime('%Y-%m-%d') == selected_activity_date].iloc[0]
                activity_contributors = selected_activity['contributors_parsed']
                
                col1, col2, col3, col4, col5 = st.columns(5)
                
                with col1:
                    st.markdown(render_contributor_card(
                        "Stay Active",
                        activity_contributors.get('stay_active', 0),
                        "Movement throughout day"
                    ), unsafe_allow_html=True)
                    
                with col2:
                    st.markdown(render_contributor_card(
                        "Move Every Hour",
                        activity_contributors.get('move_every_hour', 0),
                        "Hourly movement"
                    ), unsafe_allow_html=True)
                    
                with col3:
                    st.markdown(render_contributor_card(
                        "Daily Targets",
                        activity_contributors.get('meet_daily_targets', 0),
                        "Goal achievement"
                    ), unsafe_allow_html=True)
                    
                with col4:
                    st.markdown(render_contributor_card(
                        "Training Volume",
                        activity_contributors.get('training_volume', 0),
                        "Exercise intensity"
                    ), unsafe_allow_html=True)
                    
                with col5:
                    st.markdown(render_contributor_card(
                        "Recovery Time",
                        activity_contributors.get('recovery_time', 0),
                        "Rest periods"
                    ), unsafe_allow_html=True)

            # Workouts
            if 'workout.csv' in dfs:
                st.markdown("### 🏋️ Recent Workouts")
                df_workout = dfs['workout.csv']
                df_workout['day'] = pd.to_datetime(df_workout['day'])
                df_workout['calories'] = df_workout['calories'].fillna(0)
                
                fig_workout = px.scatter(df_workout, x='day', y='calories', size='calories', color='activity',
                                         title='Workout Intensity & Type', hover_data=['distance', 'intensity'],
                                         color_discrete_sequence=px.colors.qualitative.Bold)
                fig_workout.update_layout(plot_bgcolor=card_bg, paper_bgcolor=card_bg, font_color=text_color)
                st.plotly_chart(fig_workout, use_container_width=True)
        else:
            st.info("📁 Upload 'dailyactivity.csv' to view activity data.")

    # --- Tab 3: Heart & Stress ---
    with tab3:
        col_h1, col_h2 = st.columns(2)
        
        with col_h1:
            if 'heartrate.csv' in dfs:
                st.subheader("Heart Rate Patterns")
                df_hr = dfs['heartrate.csv']
                df_hr['timestamp'] = pd.to_datetime(df_hr['timestamp'])
                df_hr['hour'] = df_hr['timestamp'].dt.floor('h')
                df_hr_agg = df_hr.groupby('hour')['bpm'].mean().reset_index()
                
                fig_hr = px.line(df_hr_agg, x='hour', y='bpm', title='Avg Hourly Heart Rate',
                                 color_discrete_sequence=['#ef5350'])
                fig_hr.update_layout(plot_bgcolor=card_bg, paper_bgcolor=card_bg, font_color=text_color)
                st.plotly_chart(fig_hr, use_container_width=True)
        
        with col_h2:
            if 'dailystress.csv' in dfs:
                st.subheader("Stress vs Recovery")
                df_stress = dfs['dailystress.csv']
                df_stress['day'] = pd.to_datetime(df_stress['day'])
                
                fig_stress = px.bar(df_stress, x='day', y=['stress_high', 'recovery_high'], 
                                    title='Stress vs Recovery Minutes', barmode='group',
                                    color_discrete_map={'stress_high': '#ff9800', 'recovery_high': '#4caf50'})
                fig_stress.update_layout(plot_bgcolor=card_bg, paper_bgcolor=card_bg, font_color=text_color)
                st.plotly_chart(fig_stress, use_container_width=True)

    # --- Tab 4: SpO2 & Resilience ---
    with tab4:
        if 'dailyspo2.csv' in dfs:
            st.subheader("Blood Oxygen (SpO2)")
            df_spo2 = dfs['dailyspo2.csv']
            df_spo2['day'] = pd.to_datetime(df_spo2['day'])
            df_spo2['spo2_avg'] = parse_json_col(df_spo2, 'spo2_percentage', 'average')
            
            fig_spo2 = px.line(df_spo2, x='day', y='spo2_avg', title='Daily Average SpO2', markers=True,
                               color_discrete_sequence=['#00d4ff'])
            fig_spo2.update_layout(plot_bgcolor=card_bg, paper_bgcolor=card_bg, font_color=text_color)
            fig_spo2.update_yaxes(range=[90, 100])
            st.plotly_chart(fig_spo2, use_container_width=True)
            
        if 'dailyresilience.csv' in dfs:
            st.subheader("Resilience")
            df_resilience = dfs['dailyresilience.csv']
            df_resilience['day'] = pd.to_datetime(df_resilience['day'])
            st.dataframe(df_resilience[['day', 'level']].sort_values('day', ascending=False), use_container_width=True)

    # --- Tab 5: Raw Data ---
    with tab5:
        st.subheader("Raw Data Explorer")
        selected_file = st.selectbox("Select File", list(dfs.keys()))
        if selected_file:
            st.write(f"Showing data for: **{selected_file}**")
            st.dataframe(dfs[selected_file], use_container_width=True)

else:
    # Empty State / Landing Page
    st.markdown("""
    <div style='text-align: center; padding: 50px;'>
        <h2>Welcome to your Oura Dashboard</h2>
        <p style='font-size: 1.2rem; color: #666;'>Upload your data to get started.</p>
    </div>
    """, unsafe_allow_html=True)

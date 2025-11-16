import requests
import time
import datetime

def keep_render_awake():
    print("🚀 Starting Render Keep-Alive Service!")
    print("📡 Monitoring: https://loan-default-jo8s.onrender.com")
    print("⏰ Pinging every 5 minutes...")
    print("🛑 Press Ctrl+C to stop\n")
    
    ping_count = 0
    
    while True:
        try:
            # Ping the health endpoint
            response = requests.get('https://loan-default-jo8s.onrender.com/health', timeout=10)
            current_time = datetime.datetime.now().strftime("%H:%M:%S")
            ping_count += 1
            
            if response.status_code == 200:
                print(f"✅ #{ping_count} - {current_time} - Backend is HEALTHY!")
            else:
                print(f"⚠️ #{ping_count} - {current_time} - Backend responded with: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            current_time = datetime.datetime.now().strftime("%H:%M:%S")
            ping_count += 1
            print(f"❌ #{ping_count} - {current_time} - Ping failed: {e}")
        
        # Wait 5 minutes (300 seconds) before next ping
        print("💤 Sleeping for 5 minutes...\n")
        time.sleep(300)

if __name__ == "__main__":
    try:
        keep_render_awake()
    except KeyboardInterrupt:
        print("\n👋 Keep-alive service stopped. Your backend may go to sleep.")
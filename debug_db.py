import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("VITE_SUPABASE_URL")
# Use ANON key specifically
key: str = os.getenv("VITE_SUPABASE_ANON_KEY")

def check_anon_access():
    print(f"Checking ANON access to: {url}")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

    # Fetch opinions
    res = requests.get(f"{url}/rest/v1/opinions?select=*", headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(f"ANON key can read {len(data)} opinions.")
    else:
        print(f"ANON key failed: {res.status_code} - {res.text}")

if __name__ == "__main__":
    check_anon_access()

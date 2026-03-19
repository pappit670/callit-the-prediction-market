import os
import requests
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_keys():
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

    # Fetch one opinion
    res = requests.get(f"{url}/rest/v1/opinions?limit=1", headers=headers)
    if res.status_code == 200:
        data = res.json()
        if data:
            print("Opinion columns:", list(data[0].keys()))

    # Fetch one profile
    res = requests.get(f"{url}/rest/v1/profiles?limit=1", headers=headers)
    if res.status_code == 200:
        data = res.json()
        if data:
            print("Profile columns:", list(data[0].keys()))

if __name__ == "__main__":
    check_keys()

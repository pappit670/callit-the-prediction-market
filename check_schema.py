import os
import requests
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_schema():
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

    # Fetch one opinion
    res = requests.get(f"{url}/rest/v1/opinions?limit=1", headers=headers)
    if res.status_code == 200:
        print("Opinion row:", res.json())
    else:
        print("Error opinion:", res.status_code, res.text)

    # Fetch one profile
    res = requests.get(f"{url}/rest/v1/profiles?limit=1", headers=headers)
    if res.status_code == 200:
        print("Profile row:", res.json())
    else:
        print("Error profile:", res.status_code, res.text)

    # Fetch one topic
    res = requests.get(f"{url}/rest/v1/topics?limit=1", headers=headers)
    if res.status_code == 200:
        print("Topic row:", res.json())
    else:
        print("Error topic:", res.status_code, res.text)

if __name__ == "__main__":
    check_schema()

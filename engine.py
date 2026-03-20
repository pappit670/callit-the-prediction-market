import requests
from datetime import datetime, timedelta
import json
import time
import xml.etree.ElementTree as ET
import os
import hashlib
import re
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════════════════════
load_dotenv()

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WORLDNEWS_KEY  = os.getenv("WORLDNEWS_API_KEY")
FOOTBALL_KEY   = os.getenv("FOOTBALL_API_KEY")
SEARCHAPI_KEY  = os.getenv("SEARCHAPI_API_KEY")
RAPIDAPI_KEY   = os.getenv("RAPIDAPI_API_KEY")
SUPABASE_URL   = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"[INIT] Supabase:   {SUPABASE_URL}")
print(f"[INIT] Groq:       {'✓' if GROQ_API_KEY else '✗'}")
print(f"[INIT] WorldNews:  {'✓' if WORLDNEWS_KEY else '✗'}")
print(f"[INIT] Football:   {'✓' if FOOTBALL_KEY else '✗'}")
print(f"[INIT] SearchAPI:  {'✓' if SEARCHAPI_KEY else '✗'}")

SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search"
KPL_LEAGUE_ID  = 692

# ── Topic IDs ──────────────────────────────────────────
TOPIC_IDS = {
    "sports":             "141f2cd1-15ca-4994-8022-b85c059e4a4a",
    "politics":           "08372f93-25ea-4300-bc20-c88d459a8db6",
    "business":           "cfe0e786-7db4-4954-b2bc-0f1affd98e70",
    "tech":               "4f0f99d2-462c-4de3-a25d-7b776da123c8",
    "entertainment":      "b53d326b-4904-449f-a257-0451ec43f024",
    "world":              "6d7080dc-297f-4c90-81c5-52302331501b",
    "kpl":                "d902dba9-3548-4536-8e46-07703af45de5",
    "epl":                "5db924b2-dce3-4935-8164-a16123ea2283",
    "nba":                "4035b994-bcbf-4f87-a9ec-eec108ff191e",
    "ucl":                "807e9aa7-927a-4be2-b736-9b4b0cb5fdca",
    "la-liga":            "983adf79-cfb7-4133-b3fd-d1067e88a863",
    "bundesliga":         "3d85ffa2-3de8-4cbf-997f-dffa1fbee0ec",
    "crypto-bitcoin":     "39a94231-b025-4dd2-93a8-a1a6456c1880",
    "crypto-ethereum":    "5a100055-7284-430a-aeec-c3cd5e3ea84e",
    "crypto-altcoins":    "afc48809-329a-4321-83bc-c0cf2c90a4bc",
    "tech-ai":            "b9675f06-2e99-4951-952f-f9b8b97d260d",
    "business-kenya":     "e70540b8-e072-4780-992f-e2da06489641",
    "politics-kenya":     "cea4d881-f6ca-421a-9f6f-b2c154575f16",
    "politics-elections": "2c5076e2-e483-41c8-b3ab-fea1ac45574b",
    "business-stocks":    "0b9342e8-54d4-4346-b99f-f53b7a272090",
    "world-conflict":     "d857e33e-4b92-474a-ae32-9d08be129db1",
    "business-energy":    "7c081ac1-228b-43f7-9803-b2b3231c0089",
    "tech-gaming":        "1c53a8b9-b24c-4e9a-8b18-49a9aff292ae",
    "business-forex":     "434d40fe-49a0-4e0f-b041-30c4a1f6eb23",
    "business-vc":        "c6176c96-7dfa-481f-bb66-2c17db37fdd4",
    "tech-startups":      "b5bc4d1d-8d98-4a37-ae84-a8ee174c2019",
    "tech-tesla":         "df65e096-6651-4d2e-a27c-744419bf2795",
    "tech-apple":         "88847188-9453-4d52-8279-2d192ba1f4e2",
    "tech-google":        "2befcd8f-c802-475e-9c17-651eb3c90eec",
    "tech-social":        "f0aec887-122f-427d-b631-d7735173b3b2",
    "tech-space":         "b726c3cf-20eb-466a-a034-462cb9b3b6b5",
    "world-climate":      "8f90d39b-6de5-4b4b-bda2-11027f9518b7",
}

CATEGORY_TO_SLUG = {
    "Kenya Politics": "politics",
    "Kenya Economy":  "business-kenya",
    "Kenya Sports":   "kpl",
    "Crypto":         "crypto-bitcoin",
    "Technology":     "tech",
    "Global Events":  "world",
    "Esports":        "tech-gaming",
    "Sports":         "sports",
    "Politics":       "politics",
    "Business":       "business",
    "World":          "world",
}

# ═══════════════════════════════════════════════════════
#  AI PROVIDER SETUP
#  Priority: Groq → OpenRouter → Gemini
# ═══════════════════════════════════════════════════════
AI_PROVIDER    = None
AI_MODEL       = None
_GEMINI_CLIENT = None

# ── 1. Groq (primary — 14,400 req/day free) ───────────
if GROQ_API_KEY:
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5},
            timeout=10
        )
        if r.ok:
            AI_PROVIDER = "groq"
            AI_MODEL    = "llama-3.1-8b-instant"
            print(f"[INIT] AI ✓  Provider=Groq  Model={AI_MODEL}")
        else:
            print(f"[INIT] Groq failed: {r.status_code} — {r.text[:100]}")
    except Exception as e:
        print(f"[INIT] Groq error: {e}")

# ── 2. OpenRouter (fallback — free models) ─────────────
if not AI_PROVIDER and OPENROUTER_KEY:
    for model in [
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "google/gemma-3-12b-it:free",
    ]:
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json",
                         "HTTP-Referer": "https://callit.app", "X-Title": "Callit"},
                json={"model": model, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5},
                timeout=10
            )
            if r.ok:
                AI_PROVIDER = "openrouter"
                AI_MODEL    = model
                print(f"[INIT] AI ✓  Provider=OpenRouter  Model={AI_MODEL}")
                break
        except:
            continue

# ── 3. Gemini (last resort) ─────────────────────────────
if not AI_PROVIDER and GEMINI_API_KEY:
    try:
        from google import genai as _genai
        from google.genai import types as _gtypes
        _gc = _genai.Client(api_key=GEMINI_API_KEY)
        for gm in ["gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-2.0-flash"]:
            try:
                t = _gc.models.generate_content(model=gm, contents="Say OK")
                if t.text:
                    AI_PROVIDER = "gemini"
                    AI_MODEL    = gm
                    _GEMINI_CLIENT = _gc
                    print(f"[INIT] AI ✓  Provider=Gemini  Model={AI_MODEL}")
                    break
            except Exception as ge:
                if "429" in str(ge):
                    print(f"[INIT] Gemini {gm} quota exceeded")
                continue
    except ImportError:
        pass

if not AI_PROVIDER:
    print("[INIT] ✗ NO AI PROVIDER — add GROQ_API_KEY to .env")
    print("[INIT]   Free key: https://console.groq.com")


# ═══════════════════════════════════════════════════════
#  UNIFIED AI CALL
# ═══════════════════════════════════════════════════════
def ai_generate(prompt: str, max_tokens: int = 512) -> str | None:
    if not AI_PROVIDER:
        return None
    for attempt in range(3):
        try:
            if AI_PROVIDER == "groq":
                r = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={"model": AI_MODEL, "messages": [{"role": "user", "content": prompt}],
                          "max_tokens": max_tokens, "temperature": 0.75},
                    timeout=30
                )
                if r.ok:
                    return r.json()["choices"][0]["message"]["content"].strip()
                elif r.status_code == 429:
                    wait = 30
                    try:
                        msg = r.json().get("error", {}).get("message", "")
                        m   = re.search(r"try again in ([\d.]+)s", msg)
                        if m: wait = int(float(m.group(1))) + 2
                    except: pass
                    print(f"    [!] Groq rate limit — waiting {wait}s...")
                    time.sleep(wait)
                    continue
                else:
                    print(f"    [!] Groq {r.status_code}: {r.text[:100]}")
                    return None

            elif AI_PROVIDER == "openrouter":
                r = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json",
                             "HTTP-Referer": "https://callit.app", "X-Title": "Callit"},
                    json={"model": AI_MODEL, "messages": [{"role": "user", "content": prompt}],
                          "max_tokens": max_tokens, "temperature": 0.75},
                    timeout=30
                )
                if r.ok:
                    return r.json()["choices"][0]["message"]["content"].strip()
                elif r.status_code == 429:
                    time.sleep(20); continue
                else:
                    print(f"    [!] OpenRouter {r.status_code}: {r.text[:100]}")
                    return None

            elif AI_PROVIDER == "gemini":
                from google.genai import types as _gt
                resp = _GEMINI_CLIENT.models.generate_content(
                    model=AI_MODEL, contents=prompt,
                    config=_gt.GenerateContentConfig(temperature=0.75, max_output_tokens=max_tokens)
                )
                return resp.text.strip() if resp.text else None

        except Exception as e:
            err = str(e)
            if "429" in err:
                time.sleep(30); continue
            print(f"    [!] AI error: {err[:120]}")
            return None
    return None


# ═══════════════════════════════════════════════════════
#  DEDUPLICATION
# ═══════════════════════════════════════════════════════
_seen: set = set()

def is_duplicate(text: str) -> bool:
    h = hashlib.md5(text.lower().strip()[:120].encode()).hexdigest()
    if h in _seen: return True
    _seen.add(h); return False


# ═══════════════════════════════════════════════════════
#  SUPABASE
# ═══════════════════════════════════════════════════════
def sb_headers():
    return {"Content-Type": "application/json", "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"}

def sb_get(table, params):
    try:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", params=params,
                         headers=sb_headers(), timeout=10)
        return r.json() if r.ok else []
    except: return []

def sb_post(table, payload, prefer="return=representation"):
    try:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", json=payload,
                          headers={**sb_headers(), "Prefer": prefer}, timeout=10)
        return r.json() if r.ok else None
    except: return None


# ═══════════════════════════════════════════════════════
#  SLUGIFY
# ═══════════════════════════════════════════════════════
def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[-\s]+", "-", text)[:60]


# ═══════════════════════════════════════════════════════
#  AUTO-SUBTOPIC CREATOR
# ═══════════════════════════════════════════════════════
_subtopic_cache: dict = {}

def get_or_create_subtopic(name, slug, parent_slug, icon="📌", color="#F5C518", source_event=""):
    if slug in _subtopic_cache:
        return _subtopic_cache[slug]
    existing = sb_get("topics", {"slug": f"eq.{slug}", "select": "id"})
    if existing and isinstance(existing, list) and existing:
        tid = existing[0]["id"]
        _subtopic_cache[slug] = tid
        return tid
    result = sb_post("topics", {
        "name": name, "slug": slug, "type": "subtopic",
        "subtopic_of": parent_slug, "parent_id": TOPIC_IDS.get(parent_slug),
        "icon": icon, "color": color, "active": True,
        "auto_update": True, "auto_created": True, "source_event": source_event,
    })
    if result and isinstance(result, list) and result:
        tid = result[0]["id"]
        _subtopic_cache[slug] = tid
        print(f"  [NEW SUBTOPIC] {name} ({slug}) → '{parent_slug}'")
        return tid
    fallback = TOPIC_IDS.get(parent_slug, TOPIC_IDS["world"])
    _subtopic_cache[slug] = fallback
    return fallback


# ═══════════════════════════════════════════════════════
#  CATEGORY AUTO-DETECT
# ═══════════════════════════════════════════════════════
def auto_cat_from_text(text: str) -> tuple:
    t = text.lower()
    # Kenya economy FIRST before generic checks
    if any(k in t for k in ["kenya", "nairobi", "kenyan"]):
        if any(k in t for k in ["fuel","petrol","diesel","shilling","kes","inflation",
                                  "nse","safaricom","kcb","equity bank","budget","tax",
                                  "mpesa","economy","gdp kenya","imf kenya"]):
            return "Kenya Economy", "Macroeconomics"
        if any(k in t for k in ["ruto","parliament","election","iebc","protest",
                                  "odinga","governor","senate","court","judge"]):
            return "Kenya Politics", "Government"
        if any(k in t for k in ["gor mahia","afc leopards","harambee","kpl",
                                  "rugby kenya","athletics kenya"]):
            return "Kenya Sports", "Football"
    # Sports (non-Kenya)
    if any(k in t for k in ["vs ", " fc", "champions league", "premier league",
                              "bundesliga","la liga","serie a","nba","basketball",
                              "wimbledon","tennis","ufc","boxing","f1","grand prix",
                              "world cup","europa league"]):
        return "Kenya Sports", "Global Sports"
    # Crypto
    if any(k in t for k in ["bitcoin","btc","ethereum","eth","crypto","solana",
                              "bnb","defi","nft","token","blockchain"]):
        return "Crypto", "Markets"
    # Tech
    if any(k in t for k in ["openai","chatgpt","gpt","ai model","nvidia","apple",
                              "google","microsoft","startup","silicon"]):
        return "Technology", "Innovation"
    # Global politics/finance
    if any(k in t for k in ["fed","federal reserve","interest rate","recession",
                              "gdp","imf","world bank","inflation"]):
        return "Global Events", "Finance"
    if any(k in t for k in ["election","president","prime minister","parliament",
                              "congress","senate","vote"]):
        return "Global Events", "Politics"
    if any(k in t for k in ["war","conflict","ceasefire","missile","military",
                              "attack","troops","invasion"]):
        return "Global Events", "Conflict"
    if any(k in t for k in ["africa","african union"]):
        return "Global Events", "Africa"
    return "Global Events", "World Affairs"


# ═══════════════════════════════════════════════════════
#  SUBTOPIC INFERENCE
# ═══════════════════════════════════════════════════════
def infer_subtopic(item: dict, category: str) -> tuple:
    title  = item.get("title", "").lower()
    source = item.get("source", "")
    meta   = item.get("meta", {})

    if category == "Kenya Sports":
        home = meta.get("home", "")
        away = meta.get("away", "")
        if home and away and source in ("API-Football", "TheSportsDB"):
            slug = slugify(f"kpl-{home}-vs-{away}")
            tid  = get_or_create_subtopic(f"{home} vs {away}", slug, "kpl", "⚽", "#006600")
            return tid, f"{home} vs {away}", slug, "⚽", "#006600"
        if any(k in title for k in ["gor mahia","afc leopards","kogalo","ingwe"]):
            tid = get_or_create_subtopic("KPL Derbies", "kpl-derbies", "kpl", "🔥", "#C9082A")
            return tid, "KPL Derbies", "kpl-derbies", "🔥", "#C9082A"
        if any(k in title for k in ["harambee stars","kenya national"]):
            tid = get_or_create_subtopic("Harambee Stars", "harambee-stars", "sports", "🇰🇪", "#006600")
            return tid, "Harambee Stars", "harambee-stars", "🇰🇪", "#006600"
        if any(k in title for k in ["marathon","athletics","track","field"]):
            tid = get_or_create_subtopic("Kenya Athletics", "kenya-athletics", "sports", "🏃", "#FFD700")
            return tid, "Kenya Athletics", "kenya-athletics", "🏃", "#FFD700"
        if any(k in title for k in ["premier league","epl","man city","liverpool","chelsea","arsenal","man utd","tottenham"]):
            return TOPIC_IDS.get("epl"), "English Premier League", "epl", "⚽", "#3B0764"
        if any(k in title for k in ["champions league","ucl","atalanta","atletico"]):
            return TOPIC_IDS.get("ucl"), "UEFA Champions League", "ucl", "⚽", "#1A237E"
        if any(k in title for k in ["nba","basketball","lakers","warriors","celtics","lebron"]):
            return TOPIC_IDS.get("nba"), "NBA", "nba", "🏀", "#C9082A"
        if any(k in title for k in ["bundesliga","bayern","dortmund","leverkusen"]):
            return TOPIC_IDS.get("bundesliga"), "Bundesliga", "bundesliga", "⚽", "#D62828"
        if any(k in title for k in ["la liga","barcelona","real madrid","sevilla"]):
            return TOPIC_IDS.get("la-liga"), "La Liga", "la-liga", "⚽", "#FF4500"
        if any(k in title for k in ["rugby","sevens"]):
            tid = get_or_create_subtopic("Kenya Rugby", "kenya-rugby", "sports", "🏉", "#006600")
            return tid, "Kenya Rugby", "kenya-rugby", "🏉", "#006600"
        if any(k in title for k in ["wimbledon","tennis","djokovic","alcaraz"]):
            tid = get_or_create_subtopic("Tennis", "tennis-global", "sports", "🎾", "#006400")
            return tid, "Tennis", "tennis-global", "🎾", "#006400"
        if any(k in title for k in ["ufc","boxing","mma","fight"]):
            tid = get_or_create_subtopic("Combat Sports", "combat-sports", "sports", "🥊", "#EF4444")
            return tid, "Combat Sports", "combat-sports", "🥊", "#EF4444"
        if any(k in title for k in ["f1","formula 1","grand prix","verstappen","hamilton"]):
            tid = get_or_create_subtopic("Formula 1", "formula-1", "sports", "🏎️", "#E10600")
            return tid, "Formula 1", "formula-1", "🏎️", "#E10600"
        return TOPIC_IDS.get("kpl"), "Kenya Premier League", "kpl", "⚽", "#006600"

    if category == "Crypto":
        if any(k in title for k in ["bitcoin","btc"]):
            return TOPIC_IDS.get("crypto-bitcoin"), "Bitcoin", "crypto-bitcoin", "₿", "#F7931A"
        if any(k in title for k in ["ethereum","eth","defi","smart contract"]):
            return TOPIC_IDS.get("crypto-ethereum"), "Ethereum", "crypto-ethereum", "⟠", "#627EEA"
        if any(k in title for k in ["solana","sol"]):
            tid = get_or_create_subtopic("Solana", "crypto-solana", "tech", "◎", "#9945FF")
            return tid, "Solana", "crypto-solana", "◎", "#9945FF"
        if any(k in title for k in ["xrp","ripple"]):
            tid = get_or_create_subtopic("XRP / Ripple", "crypto-xrp", "tech", "💧", "#346AA9")
            return tid, "XRP / Ripple", "crypto-xrp", "💧", "#346AA9"
        if any(k in title for k in ["binance","bnb"]):
            tid = get_or_create_subtopic("Binance", "crypto-binance", "tech", "🟡", "#F3BA2F")
            return tid, "Binance", "crypto-binance", "🟡", "#F3BA2F"
        if any(k in title for k in ["dogecoin","doge"]):
            tid = get_or_create_subtopic("Dogecoin", "crypto-doge", "tech", "🐕", "#C2A633")
            return tid, "Dogecoin", "crypto-doge", "🐕", "#C2A633"
        if any(k in title for k in ["cardano","ada"]):
            tid = get_or_create_subtopic("Cardano", "crypto-cardano", "tech", "🔵", "#0033AD")
            return tid, "Cardano", "crypto-cardano", "🔵", "#0033AD"
        if any(k in title for k in ["nft","opensea"]):
            tid = get_or_create_subtopic("NFTs", "crypto-nfts", "tech", "🖼️", "#E24B4A")
            return tid, "NFTs", "crypto-nfts", "🖼️", "#E24B4A"
        if any(k in title for k in ["regulation","sec ","ban","legal"]):
            tid = get_or_create_subtopic("Crypto Regulation", "crypto-regulation", "tech", "⚖️", "#888780")
            return tid, "Crypto Regulation", "crypto-regulation", "⚖️", "#888780"
        return TOPIC_IDS.get("crypto-altcoins"), "Altcoins", "crypto-altcoins", "🪙", "#F5C518"

    if category == "Kenya Politics":
        if any(k in title for k in ["election","vote","ballot","2027","iebc"]):
            return TOPIC_IDS.get("politics-elections"), "Kenya Elections", "politics-elections", "🗳️", "#534AB7"
        if any(k in title for k in ["ruto","william ruto","state house"]):
            tid = get_or_create_subtopic("President Ruto", "ruto-presidency", "politics", "🏛️", "#534AB7")
            return tid, "President Ruto", "ruto-presidency", "🏛️", "#534AB7"
        if any(k in title for k in ["odinga","raila","azimio"]):
            tid = get_or_create_subtopic("Raila Odinga", "raila-odinga", "politics", "🏛️", "#EF4444")
            return tid, "Raila Odinga", "raila-odinga", "🏛️", "#EF4444"
        if any(k in title for k in ["parliament","senate"," mp ","bill","legislation","assembly"]):
            tid = get_or_create_subtopic("Kenya Parliament", "kenya-parliament", "politics", "🏛️", "#534AB7")
            return tid, "Kenya Parliament", "kenya-parliament", "🏛️", "#534AB7"
        if any(k in title for k in ["protest","demonstration","gen z","finance bill","strike","march"]):
            tid = get_or_create_subtopic("Kenya Protests", "kenya-protests", "politics", "✊", "#EF4444")
            return tid, "Kenya Protests", "kenya-protests", "✊", "#EF4444"
        if any(k in title for k in ["court","supreme court","judiciary","ruling","judge","verdict"]):
            tid = get_or_create_subtopic("Kenya Judiciary", "kenya-judiciary", "politics", "⚖️", "#534AB7")
            return tid, "Kenya Judiciary", "kenya-judiciary", "⚖️", "#534AB7"
        if any(k in title for k in ["county","governor","devolution","ward"]):
            tid = get_or_create_subtopic("County Government", "kenya-counties", "politics", "🗺️", "#3B82F6")
            return tid, "County Government", "kenya-counties", "🗺️", "#3B82F6"
        return TOPIC_IDS.get("politics-kenya"), "Kenya Politics", "politics-kenya", "🏛️", "#534AB7"

    if category == "Kenya Economy":
        if any(k in title for k in ["safaricom","mpesa","m-pesa"]):
            tid = get_or_create_subtopic("Safaricom", "safaricom", "business", "📱", "#4CAF50")
            return tid, "Safaricom", "safaricom", "📱", "#4CAF50"
        if any(k in title for k in ["fuel","petrol","diesel","pump price","epra"]):
            tid = get_or_create_subtopic("Kenya Fuel Prices", "kenya-fuel", "business", "⛽", "#FF6B35")
            return tid, "Kenya Fuel Prices", "kenya-fuel", "⛽", "#FF6B35"
        if any(k in title for k in ["shilling","kes","exchange rate","forex","dollar"]):
            return TOPIC_IDS.get("business-forex"), "Kenyan Shilling", "business-forex", "💱", "#185FA5"
        if any(k in title for k in ["inflation","cost of living","cpi"]):
            tid = get_or_create_subtopic("Kenya Inflation", "kenya-inflation", "business", "📊", "#EF4444")
            return tid, "Kenya Inflation", "kenya-inflation", "📊", "#EF4444"
        if any(k in title for k in ["nse","stock","shares","equity","nairobi stock"]):
            return TOPIC_IDS.get("business-stocks"), "NSE Stock Market", "business-stocks", "📈", "#1D9E75"
        if any(k in title for k in ["kcb","equity bank","co-op","ncba","absa","bank kenya"]):
            tid = get_or_create_subtopic("Kenya Banking", "kenya-banking", "business", "🏦", "#185FA5")
            return tid, "Kenya Banking", "kenya-banking", "🏦", "#185FA5"
        if any(k in title for k in ["imf","world bank","debt","eurobond","loan"]):
            tid = get_or_create_subtopic("Kenya Public Debt", "kenya-debt", "business", "💰", "#EF4444")
            return tid, "Kenya Public Debt", "kenya-debt", "💰", "#EF4444"
        if any(k in title for k in ["budget","tax","kra","revenue","treasury"]):
            tid = get_or_create_subtopic("Kenya Budget & Tax", "kenya-budget", "business", "📋", "#534AB7")
            return tid, "Kenya Budget & Tax", "kenya-budget", "📋", "#534AB7"
        return TOPIC_IDS.get("business-kenya"), "Kenya Economy", "business-kenya", "🇰🇪", "#006600"

    if category == "Technology":
        if any(k in title for k in ["openai","chatgpt","gpt","llm","claude","gemini","deepseek","copilot"]):
            return TOPIC_IDS.get("tech-ai"), "AI Models", "tech-ai", "🤖", "#534AB7"
        if any(k in title for k in ["tesla","elon musk","spacex","neuralink"]):
            return TOPIC_IDS.get("tech-tesla"), "Tesla & Elon Musk", "tech-tesla", "⚡", "#E31937"
        if any(k in title for k in ["apple","iphone","ipad","mac","ios"]):
            return TOPIC_IDS.get("tech-apple"), "Apple", "tech-apple", "🍎", "#555555"
        if any(k in title for k in ["google","alphabet","android","youtube","deepmind"]):
            return TOPIC_IDS.get("tech-google"), "Google", "tech-google", "🔍", "#4285F4"
        if any(k in title for k in ["startup","funding","series a","series b","silicon savannah","venture"]):
            return TOPIC_IDS.get("tech-startups"), "Tech Startups", "tech-startups", "🚀", "#F5C518"
        if any(k in title for k in ["gaming","esports","video game","playstation","xbox"]):
            return TOPIC_IDS.get("tech-gaming"), "Gaming", "tech-gaming", "🎮", "#9945FF"
        if any(k in title for k in ["space","nasa","satellite","rocket","starlink"]):
            return TOPIC_IDS.get("tech-space"), "Space", "tech-space", "🛸", "#0a1128"
        if any(k in title for k in ["social media","twitter","tiktok","instagram","facebook","meta"]):
            return TOPIC_IDS.get("tech-social"), "Social Media", "tech-social", "📱", "#1DA1F2"
        if any(k in title for k in ["nvidia","chip","semiconductor","gpu"]):
            tid = get_or_create_subtopic("Chips & AI Hardware", "tech-chips", "tech", "🔬", "#76B900")
            return tid, "Chips & AI Hardware", "tech-chips", "🔬", "#76B900"
        return TOPIC_IDS.get("tech"), "Technology", "tech", "💻", "#185FA5"

    if category == "Global Events":
        if any(k in title for k in ["war","conflict","military","attack","bomb","missile","invasion"]):
            return TOPIC_IDS.get("world-conflict"), "Global Conflict", "world-conflict", "⚔️", "#EF4444"
        if any(k in title for k in ["climate","global warming","emissions","cop","carbon","flood","drought"]):
            return TOPIC_IDS.get("world-climate"), "Climate", "world-climate", "🌱", "#1D9E75"
        if any(k in title for k in ["fed","federal reserve","interest rate","recession","gdp","imf"]):
            return TOPIC_IDS.get("business-stocks"), "Global Finance", "business-stocks", "📊", "#1D9E75"
        if any(k in title for k in ["election","president","prime minister","vote"]):
            return TOPIC_IDS.get("politics-elections"), "Global Elections", "politics-elections", "🗳️", "#534AB7"
        if any(k in title for k in ["usa","united states","washington","white house","trump","biden","congress"]):
            tid = get_or_create_subtopic("USA Politics", "world-usa", "world", "🇺🇸", "#B22234")
            return tid, "USA Politics", "world-usa", "🇺🇸", "#B22234"
        if any(k in title for k in ["china","beijing","xi jinping"]):
            tid = get_or_create_subtopic("China", "world-china", "world", "🇨🇳", "#DE2910")
            return tid, "China", "world-china", "🇨🇳", "#DE2910"
        if any(k in title for k in ["africa","au ","african union","east africa"]):
            tid = get_or_create_subtopic("Africa News", "world-africa-news", "world", "🌍", "#FFD700")
            return tid, "Africa News", "world-africa-news", "🌍", "#FFD700"
        return TOPIC_IDS.get("world"), "World Events", "world", "🌍", "#3B6D11"

    slug = CATEGORY_TO_SLUG.get(category, "world")
    return TOPIC_IDS.get(slug, TOPIC_IDS["world"]), category, slug, "📌", "#888888"


# ═══════════════════════════════════════════════════════
#  VARIATION TEMPLATES
# ═══════════════════════════════════════════════════════
VARIATION_TEMPLATES = {
    "sports_match": [
        {"angle": "match_result",  "prompt": "Who wins this match? Use the team names as outcomes."},
        {"angle": "goals",         "prompt": "Over or under 2.5 goals in this match?"},
        {"angle": "btts",          "prompt": "Will both teams score (BTTS)? Outcomes: [Yes - BTTS, No - Clean sheet]."},
        {"angle": "clean_sheet",   "prompt": "Will either team keep a clean sheet? Outcomes: [Home clean sheet, Away clean sheet, Neither]."},
        {"angle": "red_card",      "prompt": "Will there be a red card? Outcomes: [Yes - red card, No - no red card]."},
        {"angle": "first_scorer",  "prompt": "Which team scores first? Outcomes: [Home team first, Away team first, No goals]."},
    ],
    "crypto": [
        {"angle": "price_30d",     "prompt": "Will this crypto reach 10% above current price within 30 days?"},
        {"angle": "price_90d",     "prompt": "Will this crypto reach 20% above current price within 90 days?"},
        {"angle": "momentum",      "prompt": "Will this crypto continue its current price trend this week?"},
        {"angle": "dominance",     "prompt": "Generate a market dominance or adoption prediction for this cryptocurrency."},
    ],
    "politics": [
        {"angle": "approval",       "prompt": "Generate a public approval/confidence prediction about this political news."},
        {"angle": "policy_outcome", "prompt": "Will the policy or decision mentioned actually be implemented?"},
        {"angle": "timeline",       "prompt": "When will this political situation resolve? Generate a timeline prediction."},
        {"angle": "impact",         "prompt": "What economic or social impact will this political news have?"},
    ],
    "economy": [
        {"angle": "direction",       "prompt": "Which direction will this economic indicator move — up or down?"},
        {"angle": "timeline",        "prompt": "When will this economic situation improve or change?"},
        {"angle": "consumer_impact", "prompt": "How will this affect everyday Kenyans — cost of living, jobs, etc.?"},
        {"angle": "comparison",      "prompt": "Will this metric be better or worse than the same period last year?"},
    ],
    "general": [
        {"angle": "main",     "prompt": "Generate a direct prediction about the main outcome in this headline."},
        {"angle": "timeline", "prompt": "When will this situation resolve or change? Generate a timeline prediction."},
        {"angle": "impact",   "prompt": "What is the broader consequence or impact of this news?"},
    ],
}

def get_variation_type(category: str, item: dict) -> str:
    if item.get("meta", {}).get("home") and item.get("meta", {}).get("away"):
        return "sports_match"
    if category == "Crypto": return "crypto"
    if category in ("Kenya Politics", "Global Events"): return "politics"
    if category == "Kenya Economy": return "economy"
    return "general"


# ═══════════════════════════════════════════════════════
#  MULTI-VARIATION GENERATOR
# ═══════════════════════════════════════════════════════
def generate_variations(item: dict, category: str, subtopic_name: str,
                        topic_id: str, event_cluster: str) -> list:
    if not AI_PROVIDER:
        return []

    var_type  = get_variation_type(category, item)
    templates = VARIATION_TEMPLATES.get(var_type, VARIATION_TEMPLATES["general"])
    title     = item.get("title", "")
    text      = item.get("text", "")[:300]
    source    = item.get("source", "")
    meta      = item.get("meta", {})
    results   = []

    base = f"""You write prediction questions for Callit — a Kenyan social prediction market.

EVENT: {title}
DETAIL: {text}
SOURCE: {source} | CATEGORY: {category} | SUBTOPIC: {subtopic_name}"""

    if meta.get("home") and meta.get("away"):
        base += f"\nHOME: {meta['home']} | AWAY: {meta['away']}"

    for i, template in enumerate(templates):
        angle  = template["angle"]
        prompt = template["prompt"]

        if is_duplicate(f"{event_cluster}:{angle}"):
            continue

        full_prompt = f"""{base}

TASK: {prompt}

STRICT RULES — follow exactly:
1. The question MUST be about a real, unresolved future event
2. Do NOT reference past events (no 2023, 2022, 2024 matches already played)
3. Do NOT generate weather questions (temperature, rainfall etc)
4. Do NOT copy the headline literally — transform it into a genuine debate
5. Question must be specific: include real names, real numbers, real timeframes
6. For Kenya news: always frame it from a Kenyan perspective
7. The context paragraph must be REAL educational facts, not placeholders like "R", "A", "T"
8. Binary: "Will...?" → outcomes ["YES", "NO"]
9. Multi: "Who/Which will...?" → use real named options

Respond ONLY with valid JSON, no markdown, no extra text:
{{
  "question":     "Will...?",
  "outcomes":     ["YES", "NO"],
  "context":      "Real 2-3 sentence explanation with actual facts about this topic...",
  "expires_days": 30
}}"""

        raw = ai_generate(full_prompt, max_tokens=400)
        if not raw:
            continue

        try:
            # Strip markdown fences
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw.strip())
            q    = data.get("question", "").strip()
            if not q or len(q) < 10 or is_duplicate(q):
                continue
            results.append({
                "question":        q,
                "outcomes":        data.get("outcomes", ["YES", "NO"]),
                "context":         data.get("context", "").strip(),
                "expires_days":    int(data.get("expires_days", 30)),
                "category":        category,
                "subcategory":     subtopic_name,
                "source":          source,
                "source_url":      item.get("url", ""),
                "source_headline": title,
                "image_url":       item.get("image_url", ""),
                "topic_id":        topic_id,
                "event_cluster":   event_cluster,
                "variation_index": i,
                "variation_angle": angle,
            })
            time.sleep(0.4)
        except Exception as e:
            print(f"    [!] Parse error [{angle}]: {e} | raw: {raw[:80]}")
            time.sleep(0.2)

    return results


# ═══════════════════════════════════════════════════════
#  SAVE TO SUPABASE
# ═══════════════════════════════════════════════════════
def save_opinion(pred: dict) -> bool:
    expires = (datetime.utcnow() + timedelta(days=pred.get("expires_days", 30))).isoformat() + "Z"
    payload = {
        "statement":       pred["question"],
        "description":     pred.get("context", ""),
        "options":         pred.get("outcomes", ["YES", "NO"]),
        "end_time":        expires,
        "status":          "open",
        "ai_generated":    True,
        "auto_generated":  True,
        "topic_id":        pred.get("topic_id"),
        "source_url":      pred.get("source_url", ""),
        "source_name":     pred.get("source", ""),
        "source_headline": pred.get("source_headline", ""),
        "image_url":       pred.get("image_url", ""),
        "event_cluster":   pred.get("event_cluster", ""),
        "variation_index": pred.get("variation_index", 0),
    }
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/opinions",
            json=payload,
            headers={**sb_headers(), "Prefer": "return=minimal"},
            timeout=10
        )
        if not r.ok:
            print(f"    [!] Supabase {r.status_code}: {r.text[:150]}")
        return r.ok
    except Exception as e:
        print(f"    [!] Supabase: {e}")
        return False


# ═══════════════════════════════════════════════════════
#  ITEM PIPELINE
# ═══════════════════════════════════════════════════════
def process_item(item: dict, default_cat: str, default_sub: str, stats: dict):
    title = item.get("title", "")
    if not title or is_duplicate(title):
        return

    cat = item.get("category") or default_cat
    sub = item.get("subcategory") or default_sub
    if not cat:
        cat, sub = auto_cat_from_text(title)

    print(f"\n  ▶ [{item.get('source','?')}] {title[:78]}")
    topic_id, sub_name, sub_slug, icon, color = infer_subtopic(item, cat)
    print(f"    → Subtopic: {sub_name}")

    event_cluster = slugify(f"{sub_slug}-{title[:40]}")
    variations    = generate_variations(item, cat, sub_name, topic_id, event_cluster)
    stats["fetched"] += 1

    if not variations:
        stats["failed"] += 1
        return

    saved = 0
    for pred in variations:
        stats["generated"] += 1
        if save_opinion(pred):
            stats["saved"] += 1
            saved += 1
            print(f"    ✓ [{pred['variation_angle']}] {pred['question'][:70]}")
        else:
            print(f"    ✗ [{pred['variation_angle']}] save failed")

    print(f"    → {saved}/{len(variations)} saved")

def process_batch(items: list, default_cat: str, default_sub: str,
                  stats: dict, max_items: int = 10):
    for item in items[:max_items]:
        process_item(item, default_cat, default_sub, stats)


# ═══════════════════════════════════════════════════════
#  DATA SOURCES
# ═══════════════════════════════════════════════════════
def searchapi_call(engine: str, params: dict) -> dict:
    if not SEARCHAPI_KEY: return {}
    try:
        r = requests.get(SEARCHAPI_BASE,
                         params={"engine": engine, "api_key": SEARCHAPI_KEY, **params},
                         timeout=15)
        return r.json() if r.ok else {}
    except: return {}

def fetch_worldnews(query: str, number: int = 3) -> list:
    if not WORLDNEWS_KEY: return []
    try:
        r = requests.get("https://api.worldnewsapi.com/search-news",
                         params={"text": query, "source-country": "ke",
                                 "language": "en", "number": number,
                                 "api-key": WORLDNEWS_KEY}, timeout=10)
        return [{"title": a.get("title",""), "text": a.get("text","")[:400],
                 "url": a.get("url",""), "source": "WorldNewsAPI"}
                for a in r.json().get("news",[]) if a.get("title")]
    except Exception as e:
        print(f"  [!] WorldNews: {e}"); return []

def fetch_kpl_fixtures() -> list:
    if not FOOTBALL_KEY: return []
    try:
        r = requests.get("https://v3.football.api-sports.io/fixtures",
                         params={"league": KPL_LEAGUE_ID, "next": 8},
                         headers={"x-apisports-key": FOOTBALL_KEY}, timeout=10)
        items = []
        for f in r.json().get("response", []):
            home  = f["teams"]["home"]["name"]
            away  = f["teams"]["away"]["name"]
            venue = f["fixture"].get("venue", {}).get("name", "TBD")
            items.append({
                "title":    f"{home} vs {away} — KPL",
                "text":     f"KPL fixture at {venue}.",
                "url":      "https://ke.soccerway.com",
                "source":   "API-Football",
                "category": "Kenya Sports",
                "subcategory": "Football",
                "meta":     {"home": home, "away": away},
            })
        print(f"  [KPL] {len(items)} fixtures")
        return items
    except Exception as e:
        print(f"  [!] KPL: {e}"); return []

def fetch_rss(url: str, source_name: str, max_items: int = 5) -> list:
    try:
        r    = requests.get(url, timeout=10, headers={"User-Agent": "Callit/1.0"})
        root = ET.fromstring(r.content)
        items = []
        for item in root.findall(".//item")[:max_items]:
            t = item.findtext("title","").strip()
            d = item.findtext("description","").strip()
            l = item.findtext("link","").strip()
            if t:
                items.append({"title": t, "text": d[:300], "url": l, "source": source_name})
        return items
    except: return []

def fetch_all_rss() -> list:
    feeds = [
        ("Nation",     "https://nation.africa/kenya/rss.xml"),
        ("Standard",   "https://www.standardmedia.co.ke/rss/headlines.php"),
        ("Citizen",    "https://www.citizen.digital/feed"),
        ("EastAfrica", "https://www.theeastafrican.co.ke/tea/rss.xml"),
        ("BBC Africa", "https://feeds.bbci.co.uk/news/world/africa/rss.xml"),
        ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
        ("Reuters",    "https://feeds.reuters.com/reuters/AFRICANews"),
    ]
    all_items = []
    for source, url in feeds:
        items = fetch_rss(url, source, max_items=5)
        all_items.extend(items)
        print(f"  [RSS] {source}: {len(items)} items")
    return all_items

def fetch_coingecko() -> list:
    items = []
    try:
        r = requests.get(
            "https://api.coingecko.com/api/v3/coins/markets"
            "?vs_currency=usd&order=volume_desc&per_page=10&price_change_percentage=24h",
            timeout=10)
        if r.ok:
            for c in r.json():
                chg   = round(c.get("price_change_percentage_24h", 0), 2)
                price = c["current_price"]
                price_str = f"${price:,.2f}" if price >= 1 else f"${price:.6f}"
                items.append({
                    "title":       f"{c['name']} {price_str} ({'+' if chg>=0 else ''}{chg}% 24h)",
                    "text":        f"{c['name']} at {price_str}, {chg}% 24h. Market cap ${c['market_cap']:,.0f}.",
                    "url":         f"https://www.coingecko.com/en/coins/{c['id']}",
                    "source":      "CoinGecko",
                    "category":    "Crypto",
                    "subcategory": "Markets",
                    "coin_id":     c["id"],
                    "price":       price,
                    "change":      chg,
                })
        print(f"  [CoinGecko] {len(items)} coins")
    except Exception as e:
        print(f"  [!] CoinGecko: {e}")
    return items

def fetch_polymarket(limit: int = 25) -> list:
    """Only pull high-quality, Kenya-relevant or major global markets."""
    try:
        r = requests.get("https://gamma-api.polymarket.com/markets",
                         params={"active":"true","closed":"false","limit":limit,
                                 "order":"volume","ascending":"false"}, timeout=15)
        raw     = r.json()
        markets = raw if isinstance(raw, list) else raw.get("data", [])
        items   = []

        # Keywords that make a good Callit question
        GOOD_TOPICS = [
            "bitcoin","ethereum","crypto","solana","fed rate","inflation",
            "election","president","prime minister","war","ceasefire",
            "openai","ai model","elon musk","tesla","apple","google",
            "world cup","champions league","premier league","nba champion",
            "africa","kenya","nairobi","ruto","gdp","recession",
        ]
        # Keywords to skip — too niche, expired, or weather/sports-line betting
        BAD_TOPICS = [
            "temperature","°c","weather","rainfall","o/u","over/under",
            "handicap","spread","map ","2023","2022","ncaa","ncaab",
            "nfl draft","small islands","fossil fuel transition",
            "super bowl lvii","lxx","lxvi",
        ]

        for m in markets:
            q      = m.get("question","").strip()
            volume = float(m.get("volume", 0))
            if not q or volume < 5000:  # Higher threshold — only big markets
                continue

            q_lower = q.lower()

            # Skip bad topics
            if any(bad in q_lower for bad in BAD_TOPICS):
                continue

            # Only include if it matches a good topic OR has very high volume
            is_relevant = any(good in q_lower for good in GOOD_TOPICS) or volume > 50000
            if not is_relevant:
                continue

            outcomes_raw = m.get("outcomes","[]")
            outcomes     = json.loads(outcomes_raw) if isinstance(outcomes_raw,str) else outcomes_raw
            cat, sub     = auto_cat_from_text(q)

            items.append({
                "title":      q,
                "text":       m.get("description","")[:300] or f"${volume:,.0f} staked on Polymarket",
                "url":        f"https://polymarket.com/event/{m.get('slug','')}",
                "source":     "Polymarket",
                "category":   cat,
                "subcategory":sub,
                "outcomes":   outcomes,
                "volume_usd": volume,
            })

        items.sort(key=lambda x: x["volume_usd"], reverse=True)
        print(f"  [Polymarket] {len(items)} quality markets (filtered from {len(markets)})")
        return items[:15]  # Cap at 15
    except Exception as e:
        print(f"  [!] Polymarket: {e}"); return []

def fetch_google_trends() -> list:
    data  = searchapi_call("google_trends_trending_now", {"geo": "KE"})
    items = []
    for t in data.get("trends", [])[:10]:
        q   = t.get("query","")
        v   = t.get("search_volume", 0)
        pct = t.get("percentage_increase", 0)
        if not q: continue
        cat, sub = auto_cat_from_text(q)
        items.append({
            "title":       f'"{q}" trending in Kenya — {v:,} searches (+{pct}%)',
            "text":        f'"{q}" is surging in Kenya with {v:,} searches, up {pct}% recently.',
            "url":         f"https://trends.google.com/trends/explore?q={q}&geo=KE",
            "source":      "Google Trends",
            "category":    cat,
            "subcategory": sub,
        })
    print(f"  [Google Trends] {len(items)} trends")
    return items

def fetch_google_news(query: str, num: int = 3) -> list:
    data = searchapi_call("google_news", {"q": query, "gl": "ke", "hl": "en", "num": num})
    return [{"title": r.get("title",""), "text": r.get("snippet",""),
             "url": r.get("link",""), "source": "Google News"}
            for r in data.get("organic_results",[])[:num] if r.get("title")]

NEWS_QUERIES = [
    ("Kenya politics Ruto parliament 2025",        "Kenya Politics", "Government"),
    ("Kenya economy inflation shilling fuel 2025", "Kenya Economy",  "Macroeconomics"),
    ("Kenya elections 2027 IEBC",                  "Kenya Politics", "Elections"),
    ("Safaricom KCB equity NSE Nairobi stock",     "Kenya Economy",  "Capital Markets"),
    ("Kenya AI startup Silicon Savannah tech",     "Technology",     "Innovation"),
    ("Kenya football KPL Gor Mahia AFC Leopards",  "Kenya Sports",   "Football"),
    ("Kenya floods drought climate 2025",          "Global Events",  "Climate"),
    ("Africa geopolitics conflict 2025",           "Global Events",  "World Affairs"),
]


# ═══════════════════════════════════════════════════════
#  MAIN RUN
# ═══════════════════════════════════════════════════════
def run():
    print("\n" + "═"*65)
    print("  CALLIT PREDICTION ENGINE")
    print("  Auto-Subtopics + Multi-Variation + Groq AI")
    print("═"*65)
    stats = {"fetched": 0, "generated": 0, "saved": 0, "failed": 0}
    start = time.time()

    print("\n[1/7] RSS FEEDS")
    process_batch(fetch_all_rss(), "Kenya Politics", "Government", stats, max_items=8)

    print("\n[2/7] WORLDNEWS API")
    for query, cat, sub in NEWS_QUERIES:
        process_batch(fetch_worldnews(query, number=2), cat, sub, stats, max_items=2)
        time.sleep(0.3)

    print("\n[3/7] GOOGLE NEWS")
    for query, cat, sub in NEWS_QUERIES[:5]:
        process_batch(fetch_google_news(query, num=2), cat, sub, stats, max_items=2)
        time.sleep(0.3)

    print("\n[4/7] KPL FIXTURES")
    process_batch(fetch_kpl_fixtures(), "Kenya Sports", "Football", stats, max_items=8)

    print("\n[5/7] COINGECKO CRYPTO")
    process_batch(fetch_coingecko(), "Crypto", "Markets", stats, max_items=8)

    print("\n[6/7] POLYMARKET")
    process_batch(fetch_polymarket(limit=25), "Global Events", "Prediction Markets", stats, max_items=12)

    print("\n[7/7] GOOGLE TRENDS KENYA")
    process_batch(fetch_google_trends(), "", "", stats, max_items=6)

    elapsed = round(time.time() - start, 1)
    print("\n" + "═"*65)
    print(f"  DONE in {elapsed}s")
    print(f"  Processed:  {stats['fetched']}")
    print(f"  Generated:  {stats['generated']}")
    print(f"  Saved:      {stats['saved']}")
    print(f"  Failed:     {stats['failed']}")
    print("═"*65 + "\n")

if __name__ == "__main__":
    run()
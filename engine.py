import requests
import google.generativeai as genai
from datetime import datetime, timedelta
import json
import time
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus

# ═══════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════
GEMINI_API_KEY   = "AIzaSyAaHQ2Y_D0dJyH6wtTAN62jc23tQWCMzww"
WORLDNEWS_KEY    = "219ae2287c8e44019ec82bd6c554c419"
FOOTBALL_KEY     = "44b75ff978d048988ba88a39694779f8"
SEARCHAPI_KEY    = "Hwg23MPnEEF4V5KEodaSe3Qi"
SPORTSDB_KEY     = "e89ad8a315f14bd49c6bb19013ae8aa6"   # TheSportsDB v2 (esports + gaming)
RAPIDAPI_KEY     = "18d10f848cmshaff837ebc4d403cp167e19jsnb513356cfea8"  # NSE RapidAPI

SUPABASE_URL     = "https://rzfyhkksaolyodlddrpo.supabase.co"
SUPABASE_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Znloa2tzYW9seW9kbGRkcnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzc4OTUsImV4cCI6MjA4ODkxMzg5NX0.VT7xBnWpjEBz6-9Mr5Bj0WCgv57gx8qgl5oFOlqfv-U"

KPL_LEAGUE_ID    = 692
SPORTSDB_BASE    = "https://www.thesportsdb.com/api/v2/json"

# TheSportsDB league IDs for esports / gaming tournaments
ESPORTS_LEAGUES = [
    ("4479", "League of Legends World Championship", "Esports", "MOBA"),
    ("4480", "Dota 2 The International",             "Esports", "MOBA"),
    ("4481", "CS:GO / CS2 Major Championship",       "Esports", "FPS"),
    ("4482", "FIFA eWorld Cup",                       "Esports", "Sports Gaming"),
    ("4483", "Call of Duty League",                  "Esports", "FPS"),
    ("4484", "Valorant Champions Tour",              "Esports", "FPS"),
    ("4485", "NBA 2K League",                        "Esports", "Sports Gaming"),
]

# NSE top stocks to track via RapidAPI
NSE_STOCKS = [
    "SCOM",  # Safaricom
    "EQTY",  # Equity Group
    "KCB",   # KCB Group
    "COOP",  # Co-op Bank
    "BAMB",  # Bamburi Cement
    "EABL",  # East African Breweries
    "BAT",   # British American Tobacco Kenya
    "ABSA",  # Absa Bank Kenya
    "NCBA",  # NCBA Group
    "DTK",   # Diamond Trust Bank
]

SEARCHAPI_BASE  = "https://www.searchapi.io/api/v1/search"

# ── Finance symbols to track ──
KE_FINANCE_QUERIES = [
    ("SCOM:NAIROBI", "Safaricom",       "Kenya Economy", "Capital Markets"),
    ("KCB:NAIROBI",  "KCB Group",       "Kenya Economy", "Capital Markets"),
    ("EQTY:NAIROBI", "Equity Bank",     "Kenya Economy", "Capital Markets"),
    ("KES-USD",      "Kenyan Shilling", "Kenya Economy", "Currency"),
    ("BTC-USD",      "Bitcoin",         "Crypto",        "Markets"),
    ("ETH-USD",      "Ethereum",        "Crypto",        "Markets"),
    ("SOL-USD",      "Solana",          "Crypto",        "Markets"),
]

NEWS_QUERIES = [
    ("Kenya politics Ruto parliament 2025",   "Kenya Politics", "Government"),
    ("Kenya economy inflation shilling 2025", "Kenya Economy",  "Macroeconomics"),
    ("Kenya elections 2025",                  "Kenya Politics", "Elections"),
    ("Safaricom KCB NSE Kenya",               "Kenya Economy",  "Capital Markets"),
    ("Kenya technology startup",              "Technology",     "Innovation"),
    ("Kenya climate floods 2025",             "Global Events",  "Climate"),
    ("Africa geopolitics 2025",               "Global Events",  "World Affairs"),
    ("Kenya football KPL",                    "Kenya Sports",   "Football"),
]

EVENTS_QUERIES = [
    ("Sports events Nairobi Kenya",  "Kenya Sports",  "Events"),
    ("Business conferences Nairobi", "Kenya Economy", "Business"),
    ("Political events Kenya 2025",  "Kenya Politics","Government"),
]

YOUTUBE_QUERIES = [
    ("Kenya news today",           "Kenya Politics", "Media"),
    ("Kenyan music trending 2025", "Global Events",  "Entertainment"),
    ("Kenya business finance",     "Kenya Economy",  "Business"),
]

# ═══════════════════════════════════════════════════════
#  GEMINI SETUP
# ═══════════════════════════════════════════════════════
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')


# ═══════════════════════════════════════════════════════
#  SEARCHAPI HELPER
# ═══════════════════════════════════════════════════════
def searchapi(engine, extra_params):
    params = {"engine": engine, "api_key": SEARCHAPI_KEY, **extra_params}
    try:
        r = requests.get(SEARCHAPI_BASE, params=params, timeout=15)
        if r.status_code == 200:
            return r.json()
        print(f"    [!] SearchAPI {engine} → {r.status_code}: {r.text[:100]}")
        return {}
    except Exception as e:
        print(f"    [!] SearchAPI {engine}: {e}")
        return {}


# ═══════════════════════════════════════════════════════
#  SOURCE 1 — WORLDNEWS
# ═══════════════════════════════════════════════════════
def fetch_worldnews(query, number=2):
    params = {"text": query, "source-country": "ke", "language": "en",
              "number": number, "api-key": WORLDNEWS_KEY}
    try:
        r = requests.get("https://api.worldnewsapi.com/search-news", params=params, timeout=10)
        return [
            {"title": a.get("title",""), "text": a.get("text","")[:400],
             "url": a.get("url",""), "source": "WorldNewsAPI", "pub": a.get("publish_date","")}
            for a in r.json().get("news", []) if a.get("title")
        ]
    except Exception as e:
        print(f"    [!] WorldNewsAPI: {e}"); return []


# ═══════════════════════════════════════════════════════
#  SOURCE 2 — API-FOOTBALL
# ═══════════════════════════════════════════════════════
def fetch_kpl_fixtures(next_n=6):
    try:
        r = requests.get("https://v3.football.api-sports.io/fixtures",
                         params={"league": KPL_LEAGUE_ID, "next": next_n},
                         headers={"x-apisports-key": FOOTBALL_KEY}, timeout=10)
        items = []
        for f in r.json().get("response", []):
            home  = f["teams"]["home"]["name"]
            away  = f["teams"]["away"]["name"]
            date  = f["fixture"]["date"]
            venue = f["fixture"].get("venue", {}).get("name", "TBD")
            fd    = datetime.fromisoformat(date.replace("Z","+00:00")).strftime("%A %d %B %Y")
            items.append({
                "title": f"{home} vs {away} — KPL",
                "text":  f"KPL fixture on {fd} at {venue}.",
                "url":   "https://ke.soccerway.com",
                "source": "API-Football", "pub": date,
                "category": "Kenya Sports", "subcategory": "Football",
                "meta": {"home": home, "away": away},
            })
        return items
    except Exception as e:
        print(f"    [!] API-Football fixtures: {e}"); return []


def fetch_kpl_results(last_n=4):
    try:
        r = requests.get("https://v3.football.api-sports.io/fixtures",
                         params={"league": KPL_LEAGUE_ID, "last": last_n, "status": "FT"},
                         headers={"x-apisports-key": FOOTBALL_KEY}, timeout=10)
        items = []
        for f in r.json().get("response", []):
            home = f["teams"]["home"]["name"]; away = f["teams"]["away"]["name"]
            hg   = f["goals"]["home"];         ag   = f["goals"]["away"]
            winner = home if hg > ag else (away if ag > hg else "Draw")
            items.append({
                "title": f"{home} {hg}-{ag} {away} — KPL result",
                "text":  f"Final: {home} {hg} - {ag} {away}. Winner: {winner}.",
                "url":   "https://ke.soccerway.com",
                "source": "API-Football", "pub": f["fixture"]["date"],
                "category": "Kenya Sports", "subcategory": "Football",
            })
        return items
    except Exception as e:
        print(f"    [!] API-Football results: {e}"); return []


# ═══════════════════════════════════════════════════════
#  SOURCE 3 — GOOGLE FINANCE
# ═══════════════════════════════════════════════════════
def fetch_google_finance():
    items = []
    for query, name, cat, sub in KE_FINANCE_QUERIES:
        data    = searchapi("google_finance", {"q": query})
        summary = data.get("summary", {})
        if not summary: continue
        price   = summary.get("price", 0)
        change  = summary.get("price_change", {})
        pct     = change.get("percentage", 0)
        move    = change.get("movement", "")
        items.append({
            "title":  f"{name} {'up' if move=='Up' else 'down'} {abs(pct):.2f}% — at {price}",
            "text":   f"{name} ({query}): {price}. Change: {move} {abs(pct):.2f}%.",
            "url":    f"https://www.google.com/finance/quote/{query}",
            "source": "Google Finance", "pub": datetime.utcnow().isoformat(),
            "category": cat, "subcategory": sub,
            "price": price, "change_pct": pct,
        })
        time.sleep(0.4)
    return items


# ═══════════════════════════════════════════════════════
#  SOURCE 4 — GOOGLE NEWS
# ═══════════════════════════════════════════════════════
def fetch_google_news(query, num=2):
    data = searchapi("google_news", {"q": query, "gl": "ke", "hl": "en", "num": num})
    return [
        {"title": r.get("title",""), "text": r.get("snippet",""),
         "url": r.get("link",""), "source": "Google News", "pub": r.get("date","")}
        for r in data.get("organic_results", [])[:num] if r.get("title")
    ]


# ═══════════════════════════════════════════════════════
#  SOURCE 5 — GOOGLE EVENTS
# ═══════════════════════════════════════════════════════
def fetch_google_events(query):
    data = searchapi("google_events", {"q": query, "location": "Kenya", "gl": "ke"})
    items = []
    for e in data.get("events", [])[:4]:
        title = e.get("title","")
        if not title: continue
        d = e.get("date", {})
        items.append({
            "title":  f"{title} — {e.get('address','Kenya')}",
            "text":   f"Event: {title}. {e.get('duration','')}. {e.get('address','')}.",
            "url":    e.get("link",""), "source": "Google Events",
            "pub":    f"{d.get('month','')} {d.get('day','')} 2025",
        })
    return items


# ═══════════════════════════════════════════════════════
#  SOURCE 6 — GOOGLE TRENDS
# ═══════════════════════════════════════════════════════
def fetch_google_trends():
    data = searchapi("google_trends_trending_now", {"geo": "KE"})
    items = []
    for t in data.get("trends", [])[:8]:
        q = t.get("query",""); v = t.get("search_volume",0); pct = t.get("percentage_increase",0)
        if not q: continue
        items.append({
            "title": f'"{q}" trending in Kenya — {v:,} searches (+{pct}%)',
            "text":  f'"{q}" is surging in Kenya with {v:,} searches, up {pct}%.',
            "url":   f"https://trends.google.com/trends/explore?q={q}&geo=KE",
            "source": "Google Trends", "pub": datetime.utcnow().isoformat(),
        })
    return items


# ═══════════════════════════════════════════════════════
#  SOURCE 7 — YOUTUBE
# ═══════════════════════════════════════════════════════
def fetch_youtube(query, num=2):
    data = searchapi("youtube", {"q": query, "gl": "KE", "num": num})
    items = []
    for v in data.get("video_results", [])[:num]:
        title = v.get("title",""); ch = v.get("channel",{}).get("name","")
        if not title: continue
        items.append({
            "title":  f'YouTube: "{title}" by {ch}',
            "text":   f'{v.get("description","")[:200]} — {v.get("views","")} views',
            "url":    v.get("link","https://youtube.com"),
            "source": "YouTube", "pub": v.get("published_date",""),
        })
    return items


# ═══════════════════════════════════════════════════════
#  SOURCE 8 — POLYMARKET
# ═══════════════════════════════════════════════════════
def fetch_polymarket(limit=40):
    print("    Fetching from Gamma API (questions + volume)…")
    gamma_url = "https://gamma-api.polymarket.com/markets"
    params = {"active": "true", "closed": "false", "limit": limit, "order": "volume", "ascending": "false"}
    try:
        r = requests.get(gamma_url, params=params, timeout=15)
        raw = r.json()
        markets = raw if isinstance(raw, list) else raw.get("data", [])
    except Exception as e:
        print(f"    [!] Gamma API: {e}"); return []
    if not markets:
        print("    [!] Gamma API returned no markets"); return []
    print(f"    Gamma API ✓ {len(markets)} markets")

    print("    Fetching live probabilities from CLOB API…")
    clob_map = {}
    try:
        clob_url = "https://clob.polymarket.com/simplified-markets"
        clob_r   = requests.get(clob_url, timeout=15)
        clob_data = clob_r.json().get("data", [])
        for m in clob_data:
            cid    = m.get("condition_id","")
            tokens = m.get("tokens", [])
            if cid and tokens:
                clob_map[cid] = [
                    {"outcome": t.get("outcome",""), "probability": round(t.get("price", 0) * 100, 1),
                     "token_id": t.get("token_id",""), "winner": t.get("winner", False)}
                    for t in tokens
                ]
        print(f"    CLOB API ✓ {len(clob_map)} markets with live probabilities")
    except Exception as e:
        print(f"    [!] CLOB API: {e} — continuing without live probabilities")

    items = []
    for m in markets:
        question   = m.get("question","").strip()
        volume     = float(m.get("volume", 0))
        end_date   = m.get("endDate","")
        slug       = m.get("slug","")
        cid        = m.get("conditionId","") or m.get("condition_id","")
        desc       = m.get("description","")
        outcomes_raw = m.get("outcomes","[]")
        tags       = [t.get("label","") for t in m.get("tags", [])] if m.get("tags") else []

        if not question or volume < 500:
            continue

        outcomes = []
        if isinstance(outcomes_raw, str):
            try: outcomes = json.loads(outcomes_raw)
            except: outcomes = []
        elif isinstance(outcomes_raw, list):
            outcomes = outcomes_raw

        if len(outcomes) == 2 and set(o.upper() for o in outcomes) == {"YES", "NO"}:
            q_type = "binary"
        elif len(outcomes) > 2:
            q_type = "multi"
        else:
            q_type = "binary"

        clob_outcomes = clob_map.get(cid, [])
        outcome_probs = {}
        for co in clob_outcomes:
            outcome_probs[co["outcome"]] = co["probability"]

        if clob_outcomes:
            prob_str = " | ".join(f"{co['outcome']}: {co['probability']}%"
                                  for co in sorted(clob_outcomes, key=lambda x: x["probability"], reverse=True))
        else:
            prob_str = "probabilities unavailable"

        expires_days = 30
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z",""))
                delta  = (end_dt - datetime.utcnow()).days
                expires_days = max(1, min(delta, 90))
            except: pass

        cat, sub = polymarket_category(question, tags)

        items.append({
            "title":        question,
            "text":         desc[:400] if desc else f"Active Polymarket market with ${volume:,.0f} volume. Current odds: {prob_str}",
            "url":          f"https://polymarket.com/event/{slug}",
            "source":       "Polymarket",
            "pub":          datetime.utcnow().isoformat(),
            "volume_usd":   volume,
            "expires_days": expires_days,
            "question_type": q_type,
            "outcomes":     outcomes,
            "outcome_probs": outcome_probs,
            "prob_str":     prob_str,
            "condition_id": cid,
            "tags":         tags,
            "category":     cat,
            "subcategory":  sub,
        })
    items.sort(key=lambda x: x["volume_usd"], reverse=True)
    print(f"    Built {len(items)} Polymarket items")
    return items

def polymarket_category(question, tags):
    q = question.lower()
    t = " ".join(tags).lower()
    combined = q + " " + t
    if any(k in combined for k in ["bitcoin","btc","ethereum","eth","crypto","solana","bnb","defi","token"]):
        return "Crypto", "Markets"
    if any(k in combined for k in ["kenya","nairobi","ruto","odinga","kpl","safaricom"]):
        return auto_category(question)
    if any(k in combined for k in ["football","soccer","nba","nfl","premier league","champions league","world cup","ufc","f1"]):
        return "Kenya Sports", "Global Sports"
    if any(k in combined for k in ["election","president","senate","congress","prime minister","parliament","vote","poll"]):
        return "Global Events", "Politics"
    if any(k in combined for k in ["fed","interest rate","inflation","gdp","recession","stock","nasdaq","s&p"]):
        return "Global Events", "Finance"
    if any(k in combined for k in ["ai","openai","tech","apple","google","microsoft","startup"]):
        return "Technology", "Innovation"
    if any(k in combined for k in ["war","conflict","ukraine","israel","military","nato"]):
        return "Global Events", "Conflict"
    return "Global Events", "Prediction Markets"


# ═══════════════════════════════════════════════════════
#  SOURCE 9 — KALSHI 
# ═══════════════════════════════════════════════════════
KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2"
KALSHI_SERIES = [
    ("KXBTC",      "Crypto",       "Bitcoin Markets"),
    ("KXETH",      "Crypto",       "Ethereum Markets"),
    ("KXFED",      "Global Events","Interest Rates"),
    ("KXINFL",     "Global Events","Inflation"),
    ("KXNASDAQ",   "Global Events","Finance"),
    ("KXOIL",      "Kenya Economy","Energy"),
    ("KXPOTUS",    "Global Events","Politics"),
    ("KXUKPOL",    "Global Events","Politics"),
    ("KXAIPOL",    "Technology",   "AI Policy"),
    ("KXNBA",      "Kenya Sports", "Global Sports"),
    ("KXSOCCER",   "Kenya Sports", "Global Sports"),
    ("KXUFC",      "Kenya Sports", "Global Sports"),
    ("KXAI",       "Technology",   "AI"),
    ("KXTECH",     "Technology",   "Innovation"),
    ("KXUNEMP",    "Global Events","Employment"),
    ("KXGDP",      "Global Events","Finance"),
]

def fetch_kalshi_markets(limit=50):
    headers = {"Content-Type": "application/json"}
    all_markets = []
    seen_tickers = set()

    for series_ticker, cat, sub in KALSHI_SERIES:
        try:
            url = f"{KALSHI_BASE}/markets?series_ticker={series_ticker}&status=open&limit=5"
            r   = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200: continue
            for m in r.json().get("markets", []):
                ticker = m.get("ticker","")
                if ticker in seen_tickers: continue
                seen_tickers.add(ticker)
                all_markets.append({**m, "_cat": cat, "_sub": sub})
            time.sleep(0.2)
        except: continue

    try:
        url = f"{KALSHI_BASE}/markets?status=open&limit={limit}&order_by=volume"
        r   = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            for m in r.json().get("markets", []):
                ticker = m.get("ticker","")
                if ticker in seen_tickers: continue
                seen_tickers.add(ticker)
                all_markets.append(m)
    except: pass

    items = []
    for m in all_markets:
        title       = m.get("title","").strip()
        subtitle    = m.get("subtitle","") or ""
        yes_bid     = m.get("yes_bid",0) or 0
        yes_ask     = m.get("yes_ask",0) or 0
        no_bid      = m.get("no_bid",0) or 0
        volume      = float(m.get("volume",0) or m.get("volume_fp",0) or 0)
        open_int    = float(m.get("open_interest",0) or 0)
        close_time  = m.get("close_time","") or m.get("expiration_time","")
        ticker      = m.get("ticker","")
        event_tick  = m.get("event_ticker","")
        rules       = m.get("rules_primary","") or ""
        cat         = m.get("_cat") or kalshi_category(title)
        sub         = m.get("_sub") or "Prediction Markets"
        if not title or volume < 100: continue
        
        yes_prob = round((yes_bid + yes_ask) / 2, 1) if yes_bid and yes_ask else yes_bid
        no_prob  = round(100 - yes_prob, 1)
        result_type = m.get("result_type","binary") or "binary"
        q_type      = "multi" if result_type in ("scalar","multi") else "binary"
        outcomes    = ["YES","NO"] if q_type == "binary" else []

        expires_days = 30
        if close_time:
            try:
                close_dt = datetime.fromisoformat(close_time.replace("Z",""))
                delta    = (close_dt - datetime.utcnow()).days
                expires_days = max(1, min(delta, 90))
            except: pass

        items.append({
            "title":         title,
            "text":          f"{subtitle} {rules[:300]}".strip() or f"Kalshi market: {title}. YES probability: {yes_prob}%. Volume: ${volume:,.0f}. Open interest: ${open_int:,.0f}.",
            "url":           f"https://kalshi.com/markets/{event_tick}/{ticker}",
            "source":        "Kalshi",
            "pub":           datetime.utcnow().isoformat(),
            "category":      cat,
            "subcategory":   sub,
            "question_type": q_type,
            "outcomes":      outcomes,
            "outcome_probs": {"YES": yes_prob, "NO": no_prob},
            "prob_str":      f"YES: {yes_prob}% | NO: {no_prob}%",
            "volume_usd":    volume,
            "open_interest": open_int,
            "expires_days":  expires_days,
            "ticker":        ticker,
            "event_ticker":  event_tick,
        })
    items.sort(key=lambda x: x["volume_usd"], reverse=True)
    return items

def kalshi_category(title):
    t = title.lower()
    if any(k in t for k in ["bitcoin","btc","ethereum","eth","crypto","solana"]): return "Crypto", "Markets"
    if any(k in t for k in ["fed","interest rate","fomc","inflation","cpi","gdp","recession","unemployment"]): return "Global Events", "Finance"
    if any(k in t for k in ["election","president","congress","senate","prime minister","vote","poll","party"]): return "Global Events", "Politics"
    if any(k in t for k in ["nba","nfl","mlb","nhl","soccer","ufc","mma","golf","tennis","world cup"]): return "Kenya Sports", "Global Sports"
    if any(k in t for k in ["ai","openai","gpt","llm","nvidia","tech","apple","google","microsoft","amazon"]): return "Technology", "Innovation"
    if any(k in t for k in ["oil","crude","gas","energy","opec"]): return "Kenya Economy", "Energy"
    if any(k in t for k in ["weather","hurricane","temperature","rainfall","climate"]): return "Global Events", "Climate"
    if any(k in t for k in ["kenya","africa","nairobi"]): return auto_category(title)
    return "Global Events", "Prediction Markets"


# ═══════════════════════════════════════════════════════
#  SOURCE 9 — THESPORTSDB v2 
# ═══════════════════════════════════════════════════════
def fetch_sportsdb_esports():
    headers = {"X-API-KEY": SPORTSDB_KEY, "Content-Type": "application/json"}
    items = []
    for league_id, league_name, cat, sub in ESPORTS_LEAGUES:
        try:
            url = f"{SPORTSDB_BASE}/schedule/next/league/{league_id}"
            r   = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200: continue
            events = r.json().get("schedule", []) or r.json().get("events", [])
            for e in events[:3]:
                home  = e.get("strHomeTeam","")
                away  = e.get("strAwayTeam","")
                date  = e.get("dateEvent","")
                title = e.get("strEvent", f"{home} vs {away}")
                sport = e.get("strSport", league_name)
                thumb = e.get("strThumb","") or e.get("strBanner","")
                if not title: continue
                items.append({
                    "title":      f"{title} — {league_name}",
                    "text":       f"Upcoming {sport} event: {home} vs {away} on {date}. Part of {league_name}.",
                    "url":        f"https://www.thesportsdb.com/event/{e.get('idEvent','')}",
                    "source":     "TheSportsDB",
                    "pub":        date,
                    "category":   cat,
                    "subcategory": sub,
                    "image_url":  thumb,
                    "meta":       {"home": home, "away": away, "league": league_name},
                })
            time.sleep(0.3)
        except Exception as e: print(f"    [!] TheSportsDB {league_name}: {e}")
    return items

def fetch_sportsdb_livescores():
    headers = {"X-API-KEY": SPORTSDB_KEY, "Content-Type": "application/json"}
    items, sports = [], ["soccer", "basketball", "tennis", "cricket", "esports"]
    for sport in sports:
        try:
            url = f"{SPORTSDB_BASE}/livescore/{sport}"
            r   = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200: continue
            scores = r.json().get("livescore", []) or []
            for s in scores[:4]:
                home, away = s.get("strHomeTeam",""), s.get("strAwayTeam","")
                hgoals, agoals = s.get("intHomeScore","?"), s.get("intAwayScore","?")
                league, status = s.get("strLeague",""), s.get("strStatus","")
                if not home or not away: continue
                items.append({
                    "title":      f"{home} {hgoals}-{agoals} {away} [{status}] — {league}",
                    "text":       f"Live {sport}: {home} vs {away}. Score: {hgoals}-{agoals}. Status: {status}.",
                    "url":        "https://www.thesportsdb.com",
                    "source":     "TheSportsDB",
                    "pub":        datetime.utcnow().isoformat(),
                    "category":   "Kenya Sports",
                    "subcategory": sport.title(),
                })
            time.sleep(0.3)
        except Exception as e: print(f"    [!] TheSportsDB livescore/{sport}: {e}")
    return items

# ═══════════════════════════════════════════════════════
#  SOURCE 10 — NSE via RapidAPI
# ═══════════════════════════════════════════════════════
def fetch_nse_stocks():
    headers = {"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "nairobi-stock-exchange-nse.p.rapidapi.com"}
    items = []
    try:
        r = requests.get("https://nairobi-stock-exchange-nse.p.rapidapi.com/stocks", headers=headers, timeout=10)
        if r.status_code == 200:
            stocks = r.json()
            if isinstance(stocks, dict): stocks = stocks.get("stocks", [])
            for s in (stocks or [])[:20]:
                ticker = s.get("ticker","") or s.get("symbol","")
                name   = s.get("name","") or ticker
                price  = s.get("price","") or s.get("current","")
                change = s.get("change","") or s.get("change_pct","")
                if not ticker or not price: continue
                items.append({
                    "title":      f"{name} ({ticker}) at KSh {price} — NSE {change}",
                    "text":       f"NSE stock: {name} trading at KSh {price}. Change: {change}. Volume: {s.get('volume','')}.",
                    "url":        f"https://www.nse.co.ke/market-statistics/equity-statistics/",
                    "source":     "NSE",
                    "pub":        datetime.utcnow().isoformat(),
                    "category":   "Kenya Economy",
                    "subcategory": "Capital Markets",
                    "price":      price,
                    "change_pct": change,
                })
            if items: return items
    except: pass

    for ticker in NSE_STOCKS[:8]:
        query = f"{ticker}:NAIROBI"
        s = searchapi("google_finance", {"q": query}).get("summary", {})
        if not s: continue
        price, change = s.get("price", 0), s.get("price_change", {})
        pct, move = change.get("percentage", 0), change.get("movement","")
        items.append({
            "title":      f"{ticker} (NSE) {'▲' if move=='Up' else '▼'} {abs(pct):.2f}% — KSh {price}",
            "text":       f"NSE stock {ticker} trading at KSh {price}. {move} {abs(pct):.2f}% today.",
            "url":        f"https://www.google.com/finance/quote/{query}",
            "source":     "NSE (via Google Finance)",
            "pub":        datetime.utcnow().isoformat(),
            "category":   "Kenya Economy",
            "subcategory": "Capital Markets",
        })
        time.sleep(0.3)
    return items

# ═══════════════════════════════════════════════════════
#  SOURCE 11 — IEBC
# ═══════════════════════════════════════════════════════
def fetch_iebc_data():
    items = []
    try:
        r = requests.get("https://iebc-api.mynttech.com/counties", timeout=10)
        if r.status_code == 200:
            counties = r.json()
            if isinstance(counties, dict): counties = counties.get("counties", [])
            for c in (counties or [])[:10]:
                name, voters = c.get("name",""), c.get("registered_voters", 0) or c.get("voters","")
                seats = c.get("constituencies", 0) or c.get("seats","")
                if not name: continue
                items.append({
                    "title":      f"{name} County — {voters:,} registered voters" if isinstance(voters, int) else f"{name} County electoral data",
                    "text":       f"{name} County has {voters} registered voters across {seats} constituencies. Kenya 2027 elections approaching.",
                    "url":        "https://www.iebc.or.ke",
                    "source":     "IEBC",
                    "pub":        datetime.utcnow().isoformat(),
                    "category":   "Kenya Politics",
                    "subcategory": "Elections",
                    "county":     name,
                })
            if items: return items
    except: pass
    election_queries = ["Kenya 2027 elections candidates", "Kenya voter registration IEBC 2025", "Kenya county governor election", "Kenya political parties alliances 2025"]
    for q in election_queries:
        for n in fetch_google_news(q, num=1):
            n["category"], n["subcategory"] = "Kenya Politics", "Elections"
            items.append(n)
    return items

# ═══════════════════════════════════════════════════════
#  IMAGE THUMBNAIL
# ═══════════════════════════════════════════════════════
def fetch_image_url(query):
    data = searchapi("google_images", {"q": query, "num": 1, "safe": "active"})
    images = data.get("images", [])
    if images: return images[0].get("thumbnail", images[0].get("original",""))
    return ""

def auto_category(title):
    t = title.lower()
    if any(k in t for k in ["bitcoin","crypto","ethereum","btc","eth","defi","nft","solana","binance"]): return "Crypto", "Markets"
    if any(k in t for k in ["league of legends","valorant","cs2","csgo","dota","call of duty","fifa esport","nba 2k","esport","gaming tournament"]): return "Esports", "Gaming"
    if any(k in t for k in ["gor mahia","afc leopard","kpl","tusker","bandari","harambee","football","rugby","marathon"]): return "Kenya Sports", "Football"
    if any(k in t for k in ["ruto","odinga","parliament","senate","governor","cabinet","minister","election","uhuru","gachagua"]): return "Kenya Politics", "Government"
    if any(k in t for k in ["shilling","kes","fuel","kcb","equity","safaricom","mpesa","nse","cbk","inflation","budget","tax"]): return "Kenya Economy", "Macroeconomics"
    if any(k in t for k in ["ai","startup","5g","tech","innovation","silicon savannah"]): return "Technology", "Innovation"
    if any(k in t for k in ["kenya","nairobi","mombasa","kisumu"]): return "Kenya Politics", "Government"
    return "Global Events", "World Affairs"


# ═══════════════════════════════════════════════════════
#  FREE CONTEXT SOURCES
# ═══════════════════════════════════════════════════════
def fetch_rss(url, max_items=3):
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "Callit/1.0"})
        root = ET.fromstring(r.content)
        ns   = {"atom": "http://www.w3.org/2005/Atom"}
        items = []
        for item in root.findall(".//item")[:max_items]:
            t, d, l, p = item.findtext("title","").strip(), item.findtext("description","").strip(), item.findtext("link","").strip(), item.findtext("pubDate","").strip()
            if t: items.append({"title":t, "summary":d[:300], "url":l, "pub":p})
        if not items:
            for entry in root.findall("atom:entry", ns)[:max_items]:
                t, s, l_node, p = entry.findtext("atom:title","",ns).strip(), entry.findtext("atom:summary","",ns).strip(), entry.find("atom:link",ns), entry.findtext("atom:updated","",ns).strip()
                l = l_node.get("href","") if l_node is not None else ""
                if t: items.append({"title":t, "summary":s[:300], "url":l, "pub":p})
        return items
    except: return []

def ctx_bbc_africa(query=""):
    items = fetch_rss("https://feeds.bbci.co.uk/news/world/africa/rss.xml", max_items=5)
    if query: items = [i for i in items if any(w in (i["title"]+i["summary"]).lower() for w in query.lower().split())]
    return [{"source":"BBC Africa","title":i["title"],"text":i["summary"],"url":i["url"]} for i in items[:3]]

def ctx_guardian_africa(query=""):
    items = fetch_rss("https://www.theguardian.com/world/africa/rss", max_items=5)
    if query: items = [i for i in items if any(w in (i["title"]+i["summary"]).lower() for w in query.lower().split())]
    return [{"source":"The Guardian","title":i["title"],"text":i["summary"],"url":i["url"]} for i in items[:3]]

def ctx_reuters(query=""):
    items = fetch_rss("https://feeds.reuters.com/reuters/AFRICANews", max_items=5)
    if not items: items = fetch_rss("https://feeds.reuters.com/reuters/topNews", max_items=5)
    if query: items = [i for i in items if any(w in (i["title"]+i["summary"]).lower() for w in query.lower().split())]
    return [{"source":"Reuters","title":i["title"],"text":i["summary"],"url":i["url"]} for i in items[:3]]

def ctx_nation():
    items = []
    for feed in ["https://nation.africa/kenya/rss.xml", "https://nation.africa/kenya/news/rss.xml", "https://nation.africa/kenya/business/rss.xml", "https://nation.africa/kenya/sports/rss.xml"]:
        items.extend(fetch_rss(feed, max_items=3))
        if len(items) >= 8: break
    return [{"source":"Nation Africa","title":i["title"],"text":i["summary"],"url":i["url"]} for i in items[:5]]

def ctx_standard():
    items = []
    for feed in ["https://www.standardmedia.co.ke/rss/headlines.php", "https://www.standardmedia.co.ke/rss/business.php", "https://www.standardmedia.co.ke/rss/sports.php"]:
        items.extend(fetch_rss(feed, max_items=3))
        if len(items) >= 6: break
    return [{"source":"Standard Media","title":i["title"],"text":i["summary"],"url":i["url"]} for i in items[:4]]

def ctx_citizen():
    return [{"source":"Citizen Digital","title":i["title"],"text":i["summary"],"url":i["url"]} for i in fetch_rss("https://www.citizen.digital/feed", max_items=5)[:3]]

def ctx_eastafrican():
    return [{"source":"The East African","title":i["title"],"text":i["summary"],"url":i["url"]} for i in fetch_rss("https://www.theeastafrican.co.ke/tea/rss.xml", max_items=5)[:3]]

def ctx_aljazeera():
    items = fetch_rss("https://www.aljazeera.com/xml/rss/all.xml", max_items=6)
    af = [i for i in items if any(k in (i["title"]+i["summary"]).lower() for k in ["africa","kenya","nairobi","east africa"])]
    return [{"source":"Al Jazeera","title":i["title"],"text":i["summary"],"url":i["url"]} for i in (af or items)[:3]]

def ctx_world_bank(indicator="NY.GDP.MKTP.KD.ZG", label="GDP growth"):
    try:
        url = f"https://api.worldbank.org/v2/country/KE/indicator/{indicator}?format=json&mrv=3&per_page=3"
        r = requests.get(url, timeout=10)
        d = r.json()
        if not d or len(d) < 2: return []
        entries = [e for e in d[1] if e.get("value") is not None]
        if not entries: return []
        latest = entries[0]
        val, year = round(latest["value"], 2), latest["date"]
        return [{
            "source": "World Bank",
            "title":  f"Kenya {label}: {val}% ({year})",
            "text":   f"World Bank data: Kenya's {label} was {val}% in {year}. Previous: {round(entries[1]['value'],2) if len(entries)>1 else 'N/A'}% ({entries[1]['date'] if len(entries)>1 else ''}).",
            "url":    f"https://data.worldbank.org/indicator/{indicator}?locations=KE",
        }]
    except: return []

def ctx_world_bank_all():
    indicators = [("NY.GDP.MKTP.KD.ZG", "GDP growth rate"), ("FP.CPI.TOTL.ZG", "inflation rate"), ("SL.UEM.TOTL.ZS", "unemployment rate"), ("BX.KLT.DINV.WD.GD.ZS","foreign direct investment"), ("GC.DOD.TOTL.GD.ZS", "government debt % of GDP")]
    results = []
    for ind, label in indicators:
        results.extend(ctx_world_bank(ind, label))
        time.sleep(0.2)
    return results

def ctx_coingecko_news():
    items = []
    try:
        r = requests.get("https://api.coingecko.com/api/v3/search/trending", timeout=10)
        if r.ok:
            for c in r.json().get("coins", [])[:5]:
                coin = c.get("item", {})
                items.append({
                    "source": "CoinGecko Trending",
                    "title":  f"{coin.get('name','')} ({coin.get('symbol','')}) — trending #{coin.get('score',0)+1} globally",
                    "text":   f"{coin.get('name','')} is one of the most searched cryptocurrencies on CoinGecko right now.",
                    "url":    f"https://www.coingecko.com/en/coins/{coin.get('id','')}",
                })
    except: pass
    try:
        r = requests.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=5&page=1&price_change_percentage=24h", timeout=10)
        if r.ok:
            for c in r.json():
                chg = round(c.get("price_change_percentage_24h",0), 2)
                items.append({
                    "source": "CoinGecko",
                    "title":  f"{c['name']} ${c['current_price']:,.2f} ({'+' if chg>=0 else ''}{chg}% 24h)",
                    "text":   f"{c['name']} trading at ${c['current_price']:,.2f} with {chg}% change in 24h.",
                    "url":    f"https://www.coingecko.com/en/coins/{c['id']}",
                })
    except: pass
    return items

def ctx_hackernews():
    try:
        r = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=8)
        items = []
        for sid in r.json()[:8]:
            s = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5).json()
            if s.get("title") and s.get("score", 0) > 100:
                items.append({
                    "source": "HackerNews",
                    "title":  f"{s.get('title','')} ({s.get('score',0)} points)",
                    "text":   f"Trending on HackerNews with {s.get('score',0)} points and {s.get('descendants',0)} comments.",
                    "url":    s.get("url","") or f"https://news.ycombinator.com/item?id={sid}",
                })
            time.sleep(0.1)
        return items[:4]
    except: return []

def ctx_reddit(subreddit="Kenya", limit=5):
    try:
        r = requests.get(f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}", timeout=10, headers={"User-Agent": "Callit/1.0"})
        items = []
        for p in r.json()["data"]["children"]:
            d = p["data"]
            if not d.get("stickied"):
                items.append({
                    "source": f"Reddit r/{subreddit}",
                    "title":  d.get("title",""),
                    "text":   d.get("selftext","")[:300] or d.get("title",""),
                    "url":    f"https://reddit.com{d.get('permalink','')}",
                    "score":  d.get("score", 0),
                    "comments": d.get("num_comments", 0),
                })
        return items
    except: return []

def ctx_reddit_all():
    items = []
    for sub in ["Kenya","nairobi","africa","CryptoCurrency","worldnews","soccer","GlobalMarkets"]:
        items.extend(ctx_reddit(sub, limit=3))
        time.sleep(0.3)
    return items

def ctx_wikipedia(topic):
    try:
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + quote_plus(topic)
        r = requests.get(url, timeout=8)
        if r.ok:
            d = r.json()
            return [{"source": "Wikipedia", "title": d.get("title",""), "text": d.get("extract","")[:500], "url": d.get("content_urls",{}).get("desktop",{}).get("page","")}]
    except: pass
    return []

def ctx_kenya_weather():
    try:
        url = "https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current=temperature_2m,precipitation,weathercode&daily=temperature_2m_max,precipitation_sum&forecast_days=7&timezone=Africa/Nairobi"
        r = requests.get(url, timeout=8)
        if r.ok:
            d = r.json()
            cur = d.get("current",{})
            return [{"source": "Open-Meteo", "title": f"Nairobi weather: {cur.get('temperature_2m','')}°C, {cur.get('precipitation','')}mm", "text": "Current conditions.", "url": "https://open-meteo.com"}]
    except: pass
    return []

_rss_cache = {}
def get_cached_rss(key, fetch_fn):
    if key not in _rss_cache: _rss_cache[key] = fetch_fn()
    return _rss_cache[key]

def build_context(item, category):
    title = item.get("title","")
    keywords = extract_keywords(title, category)
    ctx = []
    bbc = get_cached_rss("bbc", ctx_bbc_africa)
    guardian = get_cached_rss("guardian", ctx_guardian_africa)
    reuters = get_cached_rss("reuters", ctx_reuters)
    nation = get_cached_rss("nation", ctx_nation)
    standard = get_cached_rss("standard", ctx_standard)
    citizen = get_cached_rss("citizen", ctx_citizen)
    eastaf = get_cached_rss("eastaf", ctx_eastafrican)
    alj = get_cached_rss("alj", ctx_aljazeera)
    reddit = get_cached_rss("reddit", ctx_reddit_all)
    all_news = bbc + guardian + reuters + nation + standard + citizen + eastaf + alj
    relevant_news = [n for n in all_news if any(kw in (n["title"]+n.get("text","")).lower() for kw in keywords)]
    ctx.extend(relevant_news[:6])
    relevant_reddit = [r for r in reddit if any(kw in (r["title"]+r.get("text","")).lower() for kw in keywords)]
    ctx.extend(relevant_reddit[:3])
    if category == "Crypto":
        cg = get_cached_rss("coingecko", ctx_coingecko_news)
        ctx.extend([c for c in cg if any(kw in (c["title"]+c.get("text","")).lower() for kw in keywords)][:3])
    if category == "Technology": ctx.extend(get_cached_rss("hackernews", ctx_hackernews)[:3])
    if category in ("Kenya Economy", "Kenya Politics", "Global Events"): ctx.extend(get_cached_rss("worldbank", ctx_world_bank_all)[:3])
    if category in ("Kenya Economy", "Global Events"): ctx.extend(get_cached_rss("weather", ctx_kenya_weather)[:1])
    wiki_topic = get_wiki_topic(title, category)
    if wiki_topic: ctx.extend(ctx_wikipedia(wiki_topic)[:1])
    if not ctx: ctx = all_news[:4]
    return ctx[:12]

def extract_keywords(title, category):
    cat_kw = {
        "Kenya Politics":  ["kenya","ruto","odinga","parliament"],
        "Kenya Economy":   ["kenya","economy","shilling","inflation"],
        "Kenya Sports":    ["kenya","football","kpl","sport"],
        "Crypto":          ["bitcoin","btc","ethereum","eth","crypto"],
        "Technology":      ["ai","tech","startup","innovation"],
        "Global Events":   ["africa","world","global"],
        "Esports":         ["esports","gaming","league","valorant"],
    }.get(category, ["kenya","africa"])
    stop = {"the","and","for","are","was","with","this","that","from","will","has","have","been","its","not","but","they"}
    title_words = [w.lower() for w in title.replace("-"," ").split() if len(w) > 3 and w.lower() not in stop]
    return list(set(cat_kw + title_words))

def get_wiki_topic(title, category):
    import re
    for pat in [r"(Safaricom|KCB|Equity Bank|Gor Mahia|AFC Leopards|Tusker FC|Bitcoin|Ethereum|Solana)", r"(Ruto|Odinga|Gachagua|Uhuru)"]:
        m = re.search(pat, title, re.IGNORECASE)
        if m: return m.group(1)
    return {"Kenya Politics":"Politics of Kenya", "Kenya Economy":"Economy of Kenya", "Kenya Sports":"Kenyan Premier League", "Crypto":"Cryptocurrency", "Technology":"Technology in Kenya", "Global Events":"Africa", "Esports":"Esports"}.get(category, "")


# ═══════════════════════════════════════════════════════
#  GEMINI — GENERATE PREDICTION QUESTION
# ═══════════════════════════════════════════════════════
def generate_prediction(item, category, subcategory):
    is_polymarket = item.get("source") == "Polymarket"
    q_type        = item.get("question_type", "binary")
    outcomes      = item.get("outcomes", [])
    prob_str      = item.get("prob_str", "")
    volume_usd    = item.get("volume_usd", 0)

    if q_type == "binary":
        type_instruction = """- YES/NO question only\n- outcomes: ["YES", "NO"]\n- question starts with "Will..." """
    elif q_type == "multi":
        type_instruction = f"- MULTI-OUTCOME question\n- outcomes: {json.dumps(outcomes[:6]) if outcomes else '[\"Option A\",\"Option B\",\"Option C\"]'}\n- question starts with \"Who/Which/What will...\""
    else: type_instruction = "- Pick the most appropriate type for this item"

    poly_note = f"\n- From Polymarket — ${volume_usd:,.0f} staked globally. Current odds: {prob_str}\n- Localise for Kenya if US/EU politics." if is_polymarket else ""

    context_snippets = build_context(item, category)
    context_block = ""
    if context_snippets:
        context_block = "\n\nADDITIONAL CONTEXT FROM MULTIPLE SOURCES:\n"
        for i, s in enumerate(context_snippets, 1): context_block += f"{i}. [{s['source']}] {s['title']}: {s.get('text','')[:200]}\n"

    prompt = f"""
You are the prediction question writer for Callit, a social prediction market in Kenya.
Your job:
1. Write ONE compelling prediction question users can stake on
2. Write a rich "context" paragraph (4-6 sentences) that EDUCATES the user about this topic.

Question type: {q_type}
{type_instruction}
{poly_note}

Main item: Title: {item['title']} - Detail: {item.get('text','')[:400]}
Source: {item.get('source','')} - Category: {category}
{context_block}

Respond ONLY with valid JSON, no markdown:
{{
  "question":      "...",
  "question_type": "{q_type}",
  "outcomes":      {json.dumps(outcomes if outcomes else ["YES","NO"])},
  "context":       "4-6 sentence educational paragraph here...",
  "expires_days":  30
}}
"""
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"): raw = raw[4:]
        data = json.loads(raw.strip())
        return {
            "question":      data.get("question","").strip(),
            "question_type": data.get("question_type", q_type),
            "outcomes":      data.get("outcomes", outcomes or ["YES","NO"]),
            "context":       data.get("context","").strip(),
            "expires_days":  int(data.get("expires_days", 30)),
            "category":      item.get("category", category),
            "subcategory":   item.get("subcategory", subcategory),
            "source":        item.get("source",""),
            "source_url":    item.get("url",""),
            "ai_provider":   "gemini-1.5-flash",
            "poly_volume":   item.get("volume_usd"),
            "outcome_probs": item.get("outcome_probs"),
            "condition_id":  item.get("condition_id"),
        }
    except Exception as e:
        print(f"      [!] Gemini failed: {e}"); return None

# ═══════════════════════════════════════════════════════
#  SUPABASE
# ═══════════════════════════════════════════════════════
def push_to_supabase(pred):
    now = datetime.utcnow().isoformat() + "Z"
    expires = (datetime.utcnow() + timedelta(days=pred["expires_days"])).isoformat() + "Z"
    payload = {
        "question":      pred["question"],
        "question_type": pred.get("question_type", "binary"),
        "outcomes":      json.dumps(pred.get("outcomes", ["YES","NO"])),
        "outcome_probs": json.dumps(pred.get("outcome_probs")) if pred.get("outcome_probs") else None,
        "category":      pred["category"],
        "subcategory":   pred["subcategory"],
        "source":        pred["source"],
        "source_url":    pred["source_url"],
        "context":       pred.get("context"),
        "ai_provider":   pred.get("ai_provider"),
        "image_url":     pred.get("image_url"),
        "poly_volume":   pred.get("poly_volume"),
        "condition_id":  pred.get("condition_id"),
        "created_at":    now,
        "expires_at":    expires,
    }
    headers = {"Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Prefer": "return=minimal"}
    try:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/calls", json=payload, headers=headers, timeout=10)
        return r.ok
    except Exception as e:
        print(f"      [!] Supabase: {e}"); return False

def process_items(items, default_cat, default_sub, stats, fetch_images=True):
    for item in items:
        title = item.get("title","")
        if not title: continue
        cat = item.get("category") or default_cat
        sub = item.get("subcategory") or default_sub
        if not cat: cat, sub = auto_category(title)
        q_type = item.get("question_type","binary")
        print(f"    • [{q_type}] {title[:68]}")
        pred = generate_prediction(item, cat, sub)
        if not pred or not pred["question"]:
            print(f"      [!] Skipped"); stats["failed"] += 1
            time.sleep(1); continue
        stats["generated"] += 1
        print(f"      Q: {pred['question'][:75]}")
        if fetch_images:
            img = fetch_image_url(f"{cat} {title[:35]} Kenya")
            if img: pred["image_url"] = img
            time.sleep(0.3)
        if push_to_supabase(pred):
            stats["saved"] += 1; print(f"      ✓ Saved to Supabase")
        else: print(f"      ✗ Save failed")
        time.sleep(1.5)

def run():
    print("  CALLIT PREDICTION ENGINE STARTING...")
    stats = {"fetched": 0, "generated": 0, "saved": 0, "failed": 0}
    
    # Very short run test
    WN_TOPICS = [("Kenya politics Ruto", "Kenya Politics", "Government")]
    for query, cat, sub in WN_TOPICS:
        items = fetch_worldnews(query, number=1)
        if not items: continue
        stats["fetched"] += len(items)
        process_items(items, cat, sub, stats)

    print("  PIPELINE COMPLETE")

if __name__ == "__main__":
    run()

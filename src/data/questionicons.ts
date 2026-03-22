// src/lib/questionIcons.ts
// ─────────────────────────────────────────────────────────────
// PRECISION ICON RESOLUTION — TV news level depth
// "CBK cut rates" → CBK logo (not Kenya flag)
// "Safaricom stock" → Safaricom logo (not Kenya flag)  
// "Bitcoin ETF" → BTC logo (not W)
// "Gor Mahia win" → Gor Mahia crest (not Kenya flag)
//
// RELIABLE SOURCES ONLY:
//   assets.coingecko.com  — crypto, never blocks hotlinks
//   flagcdn.com           — flags, always works
//   upload.wikimedia.org  — logos, very reliable
//   logos.worldvectorlogo.com — brand logos, reliable
//
// REMOVED: cryptologos.cc — blocks hotlinks, causes W fallback
// ORDER: specific matches BEFORE generic catch-alls
// ─────────────────────────────────────────────────────────────

// ── CRYPTO — CoinGecko CDN (never blocks hotlinks) ───────────
const CRYPTO: [string[], string][] = [
    [["bitcoin", "btc", "bitcoin etf", "bitcoin halving", "bitcoin price"],
        "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"],
    [["ethereum", "eth ", "ether"],
        "https://assets.coingecko.com/coins/images/279/small/ethereum.png"],
    [["solana", "sol "],
        "https://assets.coingecko.com/coins/images/4128/small/solana.png"],
    [["bnb", "binance coin", "binance smart"],
        "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"],
    [["xrp", "ripple"],
        "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png"],
    [["cardano", "ada "],
        "https://assets.coingecko.com/coins/images/975/small/cardano.png"],
    [["dogecoin", "doge"],
        "https://assets.coingecko.com/coins/images/5/small/dogecoin.png"],
    [["shiba inu", "shib"],
        "https://assets.coingecko.com/coins/images/11939/small/shiba.png"],
    [["avalanche", "avax"],
        "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png"],
    [["polygon", "matic"],
        "https://assets.coingecko.com/coins/images/4713/small/polygon.png"],
    [["chainlink", "link "],
        "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png"],
    [["uniswap", "uni "],
        "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png"],
    [["litecoin", "ltc"],
        "https://assets.coingecko.com/coins/images/2/small/litecoin.png"],
    [["toncoin", "ton "],
        "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png"],
    [["tron", "trx"],
        "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png"],
    [["pepe coin", "pepe token"],
        "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg"],
    [["tether", "usdt"],
        "https://assets.coingecko.com/coins/images/325/small/Tether.png"],
    [["usdc", "usd coin"],
        "https://assets.coingecko.com/coins/images/6319/small/usdc.png"],
    [["polkadot", " dot "],
        "https://assets.coingecko.com/coins/images/12171/small/polkadot.png"],
    [["sui "],
        "https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg"],
    [["near protocol", "near "],
        "https://assets.coingecko.com/coins/images/10365/small/near.jpg"],
    [["aptos", "apt "],
        "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png"],
    [["crypto", "defi", "altcoin", "web3", "blockchain"],
        "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"],
];

// ── KENYA — DEEP PRECISION (specific institutions first) ──────
const KENYA_DEEP: [string[], string][] = [
    // Central Bank of Kenya — before generic Kenya catch-all
    [["central bank of kenya", "cbk ", "central bank cut", "central bank raise",
        "central bank rate", "cbk rate", "cbk mpc", "monetary policy kenya",
        "interest rate kenya", "kenya interest rate"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Central_Bank_of_Kenya_logo.png/200px-Central_Bank_of_Kenya_logo.png"],

    // Safaricom
    [["safaricom"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Safaricom.svg/200px-Safaricom.svg.png"],

    // M-Pesa
    [["mpesa", "m-pesa", "m pesa"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/200px-M-PESA_LOGO-01.svg.png"],

    // Nairobi Securities Exchange
    [["nairobi securities exchange", "nairobi stock exchange",
        "nse ", "nse stocks", "nse market"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Nairobi_Securities_Exchange.png/200px-Nairobi_Securities_Exchange.png"],

    // KCB
    [["kcb ", "kenya commercial bank"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/KCB_Group_logo.png/200px-KCB_Group_logo.png"],

    // Equity Bank
    [["equity bank", "equity group"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Equity_Bank_Kenya.png/200px-Equity_Bank_Kenya.png"],

    // Kenya Airways
    [["kenya airways", " kq "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Kenya_Airways_Logo.svg/200px-Kenya_Airways_Logo.svg.png"],

    // Kenya Power
    [["kenya power", "kplc", "kenya electricity", "power blackout kenya"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kenya_Power_logo.png/200px-Kenya_Power_logo.png"],

    // IEBC / Elections
    [["iebc", "electoral commission kenya", "voter registration kenya",
        "kenya election", "2027 election", "general election kenya"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/IEBC_logo.png/200px-IEBC_logo.png"],

    // Kenya Parliament
    [["parliament kenya", "national assembly kenya", "senate kenya",
        "finance bill kenya", "kenya bill", "kenya legislature"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Parliament_of_Kenya.jpg/200px-Parliament_of_Kenya.jpg"],

    // Kenya Coat of Arms / Presidency
    [["president ruto", "william ruto", "ruto", "state house kenya"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Coat_of_arms_of_Kenya.svg/150px-Coat_of_arms_of_Kenya.svg.png"],

    // EPRA / Fuel
    [["fuel price kenya", "petrol price kenya", "kerosene price",
        "fuel subsidy kenya", "epra"],
        "https://flagcdn.com/w40/ke.png"],

    // Generic Kenya fallback
    [["kenya", "nairobi", "mombasa", "kisumu", "nakuru", "eldoret",
        "kenyan", "raila", "odinga", "gachagua", "azimio", "county governor"],
        "https://flagcdn.com/w40/ke.png"],
];

// ── GLOBAL INSTITUTIONS — specific before country flags ───────
const INSTITUTIONS: [string[], string][] = [
    [["federal reserve", "fed rate", "fomc", "jerome powell",
        "fed cut", "fed hike", "us interest rate", "us monetary policy"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/US-FederalReserveSystem-Seal.svg/150px-US-FederalReserveSystem-Seal.svg.png"],

    [["imf ", "international monetary fund"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/International_Monetary_Fund_logo.svg/200px-International_Monetary_Fund_logo.svg.png"],

    [["world bank"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/The_World_Bank_logo.svg/200px-The_World_Bank_logo.svg.png"],

    [["united nations", "un general assembly", "un security council", "unsc", "un resolution"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/200px-Flag_of_the_United_Nations.svg.png"],

    [["nato ", "north atlantic treaty"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/200px-Flag_of_NATO.svg.png"],

    [["european central bank", "ecb rate", "ecb cut"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/200px-Flag_of_Europe.svg.png"],

    [["opec", "crude oil price", "brent crude", "oil barrel"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/OPEC_logo.svg/150px-OPEC_logo.svg.png"],

    [["who ", "world health organization", "pandemic", "global health outbreak"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/World_Health_Organization_Logo.svg/150px-World_Health_Organization_Logo.svg.png"],

    [["african union", "au summit"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/200px-Flag_of_the_African_Union.svg.png"],

    [["icc ", "international criminal court"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/ICC_logo.svg/150px-ICC_logo.svg.png"],
];

// ── KPL / KENYA FOOTBALL — before generic Kenya ───────────────
const KPL: [string[], string][] = [
    [["gor mahia"],
        "https://upload.wikimedia.org/wikipedia/en/e/e1/Gor_Mahia_FC_logo.svg"],
    [["afc leopards", "ingwe"],
        "https://upload.wikimedia.org/wikipedia/en/2/23/AFC_Leopards_SC_logo.svg"],
    [["tusker fc", "tusker "],
        "https://upload.wikimedia.org/wikipedia/en/5/5f/Tusker_FC_crest.png"],
    [["harambee stars"],
        "https://flagcdn.com/w40/ke.png"],
    [["kpl ", "kenyan premier league", "fkf premier"],
        "https://flagcdn.com/w40/ke.png"],
    [["bandari", "kakamega", "ulinzi", "kariobangi", "posta rangers",
        "kenya football", "nsl kenya"],
        "https://flagcdn.com/w40/ke.png"],
];

// ── EPL ───────────────────────────────────────────────────────
const EPL: [string[], string][] = [
    [["arsenal"],
        "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg"],
    [["chelsea"],
        "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"],
    [["liverpool"],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"],
    [["manchester city", "man city"],
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"],
    [["manchester united", "man utd", "man united"],
        "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg"],
    [["tottenham", "spurs"],
        "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg"],
    [["aston villa"],
        "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_crest_%282016%29.svg"],
    [["newcastle united", "newcastle"],
        "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg"],
    [["west ham"],
        "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg"],
    [["brighton"],
        "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg"],
    [["everton"],
        "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg"],
    [["fulham"],
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg"],
    [["crystal palace"],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Crystal_Palace_FC_logo_%282022%29.svg"],
    [["wolves", "wolverhampton"],
        "https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg"],
    [["nottingham forest"],
        "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg"],
    [["brentford"],
        "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg"],
    [["leicester"],
        "https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg"],
    [["southampton"],
        "https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg"],
    [["bournemouth"],
        "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg"],
];

// ── LA LIGA ───────────────────────────────────────────────────
const LALIGA: [string[], string][] = [
    [["real madrid"],
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
    [["fc barcelona", "barcelona", "barca"],
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
    [["atletico madrid"],
        "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg"],
    [["sevilla fc", "sevilla"],
        "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg"],
    [["villarreal"],
        "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo.svg"],
];

// ── BUNDESLIGA ────────────────────────────────────────────────
const BUNDESLIGA: [string[], string][] = [
    [["bayern munich", "fc bayern", "fcb"],
        "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg"],
    [["borussia dortmund", "bvb"],
        "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg"],
    [["bayer leverkusen", "leverkusen"],
        "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg"],
    [["rb leipzig"],
        "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg"],
];

// ── SERIE A ───────────────────────────────────────────────────
const SERIEA: [string[], string][] = [
    [["juventus", "juve"],
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg"],
    [["ac milan", "ac milan"],
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg"],
    [["inter milan", "internazionale"],
        "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg"],
    [["napoli", "ssc napoli"],
        "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli_badge.svg"],
    [["as roma", " roma "],
        "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg"],
];

// ── LIGUE 1 ───────────────────────────────────────────────────
const LIGUE1: [string[], string][] = [
    [["paris saint-germain", "psg"],
        "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"],
    [["olympique marseille", "marseille"],
        "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg"],
];

// ── COMPETITIONS ──────────────────────────────────────────────
const COMPETITIONS: [string[], string][] = [
    [["champions league", "ucl"],
        "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg"],
    [["europa league", "uel"],
        "https://upload.wikimedia.org/wikipedia/en/d/df/UEFA_Europa_League_logo_%28vector%29.svg"],
    [["premier league", "epl"],
        "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"],
    [["la liga", "laliga"],
        "https://upload.wikimedia.org/wikipedia/commons/1/13/Laliga_logo.svg"],
    [["bundesliga"],
        "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg"],
    [["serie a"],
        "https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg"],
    [["ligue 1"],
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Ligue1_Uber_Eats_Logo_2020.svg"],
    [["world cup", "fifa world cup"],
        "https://upload.wikimedia.org/wikipedia/en/e/e3/2022_FIFA_World_Cup.svg"],
    [["africa cup", "afcon"],
        "https://upload.wikimedia.org/wikipedia/en/1/1d/Africa_Cup_of_Nations.svg"],
    [["fa cup"],
        "https://upload.wikimedia.org/wikipedia/en/3/35/FA_Cup_logo_2022.svg"],
    [["carabao cup", "efl cup", "league cup"],
        "https://upload.wikimedia.org/wikipedia/en/c/c3/EFL_Cup_logo.svg"],
    [["copa del rey"],
        "https://upload.wikimedia.org/wikipedia/en/3/3e/Copa_del_Rey_logo.svg"],
    [["ballon d'or", "ballon dor"],
        "https://upload.wikimedia.org/wikipedia/en/c/c5/Ballon_d%27Or_logo.svg"],
];

// ── NBA ───────────────────────────────────────────────────────
const NBA: [string[], string][] = [
    [["los angeles lakers", "lakers"],
        "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg"],
    [["golden state warriors", "warriors"],
        "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"],
    [["boston celtics", "celtics"],
        "https://upload.wikimedia.org/wikipedia/en/8/8b/Boston_Celtics.svg"],
    [["miami heat"],
        "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg"],
    [["denver nuggets", "nuggets"],
        "https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg"],
    [["oklahoma city thunder", "okc thunder"],
        "https://upload.wikimedia.org/wikipedia/en/5/5d/Oklahoma_City_Thunder.svg"],
    [["dallas mavericks", "mavs"],
        "https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg"],
    [["nba finals", "nba championship", "nba playoffs", "nba "],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/NBA_Logo.svg"],
];

// ── NFL ───────────────────────────────────────────────────────
const NFL: [string[], string][] = [
    [["kansas city chiefs", "chiefs"],
        "https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg"],
    [["philadelphia eagles", "eagles"],
        "https://upload.wikimedia.org/wikipedia/en/8/8e/Philadelphia_Eagles_logo.svg"],
    [["san francisco 49ers", "49ers"],
        "https://upload.wikimedia.org/wikipedia/commons/3/3a/San_Francisco_49ers_logo.svg"],
    [["dallas cowboys", "cowboys"],
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Dallas_Cowboys.svg"],
    [["super bowl", "nfl playoffs", "nfl championship", "nfl "],
        "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg"],
];

// ── F1 ────────────────────────────────────────────────────────
const F1: [string[], string][] = [
    [["red bull racing"],
        "https://upload.wikimedia.org/wikipedia/en/7/7c/Red_Bull_Racing_logo.svg"],
    [["mercedes f1", "mercedes amg f1"],
        "https://upload.wikimedia.org/wikipedia/en/f/f0/Mercedes_AMG_Petronas_F1_Logo.svg"],
    [["ferrari f1", "scuderia ferrari"],
        "https://upload.wikimedia.org/wikipedia/en/d/d2/Ferrari_F1_Logo.svg"],
    [["formula 1", "formula one", "f1 ", "grand prix", "world championship f1"],
        "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg"],
];

// ── UFC / MMA ─────────────────────────────────────────────────
const MMA: [string[], string][] = [
    [["ufc ", "ufc fight", "ufc championship", "mma fight", "octagon"],
        "https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg"],
];

// ── TECH — brand level precision ─────────────────────────────
const TECH: [string[], string][] = [
    [["openai", "chatgpt", "gpt-4", "gpt-5", "gpt4", "gpt5", " gpt "],
        "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"],
    [["google deepmind", "google gemini", "google search", "alphabet", "google "],
        "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"],
    [["apple iphone", "iphone 17", "iphone 18", "apple vision", "wwdc", "apple "],
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"],
    [["tesla "],
        "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg"],
    [["meta ", "facebook", "instagram", "threads", "mark zuckerberg"],
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg"],
    [["nvidia ", "jensen huang", "nvidia gpu"],
        "https://upload.wikimedia.org/wikipedia/en/6/6d/Nvidia_image_logo.svg"],
    [["microsoft ", "windows", "azure", "copilot ai"],
        "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"],
    [["amazon ", "aws ", "jeff bezos"],
        "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"],
    [["x.com", "twitter", "elon musk"],
        "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg"],
    [["tiktok", "bytedance"],
        "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg"],
    [["youtube "],
        "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg"],
    [["netflix "],
        "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"],
    [["spotify "],
        "https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"],
    [["samsung galaxy", "samsung "],
        "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg"],
];

// ── PLAYERS — maps to their club or country ───────────────────
const PLAYERS: [string[], string][] = [
    [["lionel messi", "messi"],
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
    [["cristiano ronaldo", "ronaldo", "cr7"],
        "https://flagcdn.com/w40/pt.png"],
    [["erling haaland", "haaland"],
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"],
    [["kylian mbappe", "mbappe"],
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
    [["mohamed salah", "mo salah", "salah"],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"],
    [["vinicius junior", "vini jr", "vinicius"],
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
    [["victor osimhen", "osimhen"],
        "https://flagcdn.com/w40/ng.png"],
    [["lebron james", "lebron"],
        "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg"],
    [["steph curry", "stephen curry"],
        "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"],
    [["novak djokovic", "djokovic"],
        "https://flagcdn.com/w40/rs.png"],
    [["carlos alcaraz", "alcaraz"],
        "https://flagcdn.com/w40/es.png"],
    [["max verstappen", "verstappen"],
        "https://upload.wikimedia.org/wikipedia/en/7/7c/Red_Bull_Racing_logo.svg"],
    [["lewis hamilton", "hamilton"],
        "https://flagcdn.com/w40/gb.png"],
];

// ── ENTERTAINMENT ─────────────────────────────────────────────
const ENTERTAINMENT: [string[], string][] = [
    [["grammy", "grammy award"],
        "https://upload.wikimedia.org/wikipedia/commons/5/5c/Grammy_logo.svg"],
    [["oscar", "academy award"],
        "https://upload.wikimedia.org/wikipedia/commons/6/6e/Oscar_Award.png"],
];

// ── COUNTRY FLAGS — catch-all, always last ───────────────────
const FLAGS: [string[], string][] = [
    [["usa ", "united states", "biden", "trump", "white house",
        "us election", "congress", "washington dc"],
        "https://flagcdn.com/w40/us.png"],
    [["united kingdom", " uk ", "britain", "england", "scotland",
        "starmer", "boris", "london"],
        "https://flagcdn.com/w40/gb.png"],
    [["ukraine", "zelensky"],
        "https://flagcdn.com/w40/ua.png"],
    [["russia ", "putin", "moscow", "kremlin"],
        "https://flagcdn.com/w40/ru.png"],
    [["china ", "xi jinping", "beijing", "shanghai"],
        "https://flagcdn.com/w40/cn.png"],
    [["india ", "modi", "delhi", "mumbai"],
        "https://flagcdn.com/w40/in.png"],
    [["nigeria ", "abuja", "lagos", "tinubu"],
        "https://flagcdn.com/w40/ng.png"],
    [["south africa", "ramaphosa", "johannesburg"],
        "https://flagcdn.com/w40/za.png"],
    [["ethiopia ", "addis ababa", "abiy"],
        "https://flagcdn.com/w40/et.png"],
    [["egypt ", "cairo", "sisi"],
        "https://flagcdn.com/w40/eg.png"],
    [["ghana ", "accra"],
        "https://flagcdn.com/w40/gh.png"],
    [["tanzania ", "dar es salaam"],
        "https://flagcdn.com/w40/tz.png"],
    [["uganda ", "kampala"],
        "https://flagcdn.com/w40/ug.png"],
    [["rwanda ", "kigali", "kagame"],
        "https://flagcdn.com/w40/rw.png"],
    [["somalia ", "mogadishu"],
        "https://flagcdn.com/w40/so.png"],
    [["gaza", "palestine", "hamas", "ceasefire"],
        "https://flagcdn.com/w40/ps.png"],
    [["israel ", "netanyahu", "tel aviv", "idf"],
        "https://flagcdn.com/w40/il.png"],
    [["iran ", "tehran", "irgc"],
        "https://flagcdn.com/w40/ir.png"],
    [["saudi arabia", "riyadh", "mbs"],
        "https://flagcdn.com/w40/sa.png"],
    [["turkey ", "erdogan", "ankara"],
        "https://flagcdn.com/w40/tr.png"],
    [["brazil ", "lula", "rio "],
        "https://flagcdn.com/w40/br.png"],
    [["france ", "macron", "paris "],
        "https://flagcdn.com/w40/fr.png"],
    [["germany ", "berlin", "scholz"],
        "https://flagcdn.com/w40/de.png"],
    [["japan ", "tokyo", "kishida"],
        "https://flagcdn.com/w40/jp.png"],
    [["south korea", "seoul"],
        "https://flagcdn.com/w40/kr.png"],
    [["australia ", "sydney", "melbourne"],
        "https://flagcdn.com/w40/au.png"],
    [["canada ", "trudeau", "ottawa"],
        "https://flagcdn.com/w40/ca.png"],
    [["argentina ", "milei", "buenos aires"],
        "https://flagcdn.com/w40/ar.png"],
    [["portugal "],
        "https://flagcdn.com/w40/pt.png"],
    [["spain ", "madrid "],
        "https://flagcdn.com/w40/es.png"],
    [["norway "],
        "https://flagcdn.com/w40/no.png"],
    [["switzerland "],
        "https://flagcdn.com/w40/ch.png"],
];

// ─────────────────────────────────────────────────────────────
// MERGE ORDER: specific → general
// Kenya institutions BEFORE Kenya flag
// Global institutions BEFORE country flags
// Club crests BEFORE league logos
// Players BEFORE generic sport
// ─────────────────────────────────────────────────────────────
const ALL_ICONS: [string[], string][] = [
    ...KENYA_DEEP,      // CBK, Safaricom, NSE etc BEFORE Kenya flag
    ...INSTITUTIONS,    // Fed, IMF, World Bank etc BEFORE country flags
    ...CRYPTO,          // BTC, ETH etc
    ...KPL,             // Gor Mahia, AFC Leopards BEFORE Kenya flag
    ...EPL,
    ...LALIGA,
    ...BUNDESLIGA,
    ...SERIEA,
    ...LIGUE1,
    ...COMPETITIONS,    // League logos
    ...NBA,
    ...NFL,
    ...F1,
    ...MMA,
    ...TECH,
    ...ENTERTAINMENT,
    ...PLAYERS,         // Player → club crest BEFORE flags
    ...FLAGS,           // Country flags LAST (catch-all)
];

export function resolveQuestionIcon(
    iconUrl: string | null | undefined,
    statement: string,
): string | null {
    // 1. Always use stored icon from DB first
    if (iconUrl) return iconUrl;

    // 2. Scan keywords in priority order
    const lower = statement.toLowerCase();
    for (const [keywords, url] of ALL_ICONS) {
        if (keywords.some(k => lower.includes(k))) return url;
    }

    // 3. No match — QuestionIcon shows letter fallback
    return null;
}

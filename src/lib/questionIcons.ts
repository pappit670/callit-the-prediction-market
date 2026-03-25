// src/lib/questionIcons.ts
// NEWS-LEVEL PRECISION — every name gets their actual face
// People = Wikipedia portrait photos. Institutions = official logos.
// Resolution: stored DB url → person portrait → institution logo → team crest → crypto → flag → null

// ── PEOPLE — direct Wikipedia portrait URLs ──────────────────
// These are stable CDN URLs used by news organisations globally
const PEOPLE: [string[], string][] = [
    // Kenya
    [["william ruto", "president ruto", "ruto "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/William_Ruto_official_portrait.jpg/200px-William_Ruto_official_portrait.jpg"],
    [["raila odinga", "raila ", "odinga"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Raila_Odinga_2019_cropped.jpg/200px-Raila_Odinga_2019_cropped.jpg"],
    [["gachagua", "rigathi"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Rigathi_Gachagua_official_portrait.jpg/200px-Rigathi_Gachagua_official_portrait.jpg"],
    [["uhuru kenyatta", "uhuru "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Uhuru_Kenyatta_official_portrait.jpg/200px-Uhuru_Kenyatta_official_portrait.jpg"],
    [["musyoka", "kalonzo"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Kalonzo_Musyoka.jpg/200px-Kalonzo_Musyoka.jpg"],
    [["mudavadi"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Musalia_Mudavadi.jpg/200px-Musalia_Mudavadi.jpg"],
    [["wetangula", "moses wetangula"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Moses_Wetangula.jpg/200px-Moses_Wetangula.jpg"],
    // World leaders
    [["donald trump", "trump "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/200px-Donald_Trump_official_portrait.jpg"],
    [["joe biden", "biden "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/200px-Joe_Biden_presidential_portrait.jpg"],
    [["kamala harris", "harris "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg/200px-Kamala_Harris_Vice_Presidential_Portrait.jpg"],
    [["keir starmer", "starmer"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Keir_Starmer_2020.jpg/200px-Keir_Starmer_2020.jpg"],
    [["emmanuel macron", "macron"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Emmanuel_Macron_in_2019.jpg/200px-Emmanuel_Macron_in_2019.jpg"],
    [["vladimir putin", "putin "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Vladimir_Putin_-_2023.jpg/200px-Vladimir_Putin_-_2023.jpg"],
    [["volodymyr zelensky", "zelensky"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Volodymyr_Zelensky_2023.jpg/200px-Volodymyr_Zelensky_2023.jpg"],
    [["xi jinping"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Xi_Jinping_2019.jpg/200px-Xi_Jinping_2019.jpg"],
    [["narendra modi", "modi "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Narendra_Modi_at_MIKTA.jpg/200px-Narendra_Modi_at_MIKTA.jpg"],
    [["bola tinubu", "tinubu"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bola_Tinubu_official_portrait.jpg/200px-Bola_Tinubu_official_portrait.jpg"],
    [["cyril ramaphosa", "ramaphosa"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Cyril_Ramaphosa_2019.jpg/200px-Cyril_Ramaphosa_2019.jpg"],
    [["paul kagame", "kagame"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Paul_Kagame_2014.jpg/200px-Paul_Kagame_2014.jpg"],
    [["abiy ahmed", "abiy "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Abiy_Ahmed_2018.jpg/200px-Abiy_Ahmed_2018.jpg"],
    [["recep tayyip erdogan", "erdogan"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Recep_Tayyip_Erdoğan_2021.jpg/200px-Recep_Tayyip_Erdoğan_2021.jpg"],
    [["benjamin netanyahu", "netanyahu"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Benjamin_Netanyahu_2023.jpg/200px-Benjamin_Netanyahu_2023.jpg"],
    [["javier milei", "milei "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Javier_Milei_2023.jpg/200px-Javier_Milei_2023.jpg"],
    [["lula", "luiz inácio"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Lula_-_foto_oficial_2023.jpg/200px-Lula_-_foto_oficial_2023.jpg"],
    // Football
    [["lionel messi", "messi "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup.jpg/200px-Lionel-Messi-Argentina-2022-FIFA-World-Cup.jpg"],
    [["cristiano ronaldo", "ronaldo ", "cr7"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/200px-Cristiano_Ronaldo_2018.jpg"],
    [["erling haaland", "haaland"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Haaland_2023.jpg/200px-Haaland_2023.jpg"],
    [["kylian mbappe", "mbappe"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kylian_Mbappé_2019.jpg/200px-Kylian_Mbappé_2019.jpg"],
    [["mohamed salah", "mo salah", "salah "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah_2018.jpg/200px-Mohamed_Salah_2018.jpg"],
    [["vinicius junior", "vinicius", "vini jr"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Vinícius_Júnior_2022.jpg/200px-Vinícius_Júnior_2022.jpg"],
    [["victor osimhen", "osimhen"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Victor_Osimhen_2022.jpg/200px-Victor_Osimhen_2022.jpg"],
    [["jude bellingham", "bellingham"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Jude_Bellingham_2023.jpg/200px-Jude_Bellingham_2023.jpg"],
    [["bukayo saka", "saka "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Saka_2022.jpg/200px-Saka_2022.jpg"],
    // Basketball
    [["lebron james", "lebron "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/LeBron_James_crop.jpg/200px-LeBron_James_crop.jpg"],
    [["stephen curry", "steph curry", "curry "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Stephen_Curry_2022.jpg/200px-Stephen_Curry_2022.jpg"],
    [["luka doncic", "luka ", "doncic"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Luka_Doncic_2022.jpg/200px-Luka_Doncic_2022.jpg"],
    [["nikola jokic", "jokic"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Nikola_Jokic_2022.jpg/200px-Nikola_Jokic_2022.jpg"],
    [["victor wembanyama", "wembanyama"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Victor_Wembanyama_2023.jpg/200px-Victor_Wembanyama_2023.jpg"],
    // F1
    [["max verstappen", "verstappen"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Max_Verstappen_2023.jpg/200px-Max_Verstappen_2023.jpg"],
    [["lewis hamilton", "hamilton "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg/200px-Lewis_Hamilton_2016_Malaysia_2.jpg"],
    [["charles leclerc", "leclerc"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Charles_Leclerc_2023.jpg/200px-Charles_Leclerc_2023.jpg"],
    [["lando norris", "norris "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Lando_Norris_2023.jpg/200px-Lando_Norris_2023.jpg"],
    // Tennis
    [["novak djokovic", "djokovic"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Novak_Djokovic_2023.jpg/200px-Novak_Djokovic_2023.jpg"],
    [["carlos alcaraz", "alcaraz"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Carlos_Alcaraz_2022.jpg/200px-Carlos_Alcaraz_2022.jpg"],
    [["jannik sinner", "sinner "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jannik_Sinner_2023.jpg/200px-Jannik_Sinner_2023.jpg"],
    // Tech
    [["elon musk", "musk "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/200px-Elon_Musk_Royal_Society_%28crop2%29.jpg"],
    [["mark zuckerberg", "zuckerberg"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/200px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg"],
    [["sam altman", "altman "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Sam_Altman_CropEdit.jpg/200px-Sam_Altman_CropEdit.jpg"],
    [["jensen huang", "jensen "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Jensen_Huang_2019_cropped.jpg/200px-Jensen_Huang_2019_cropped.jpg"],
    [["satya nadella", "nadella"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/200px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg"],
];

// ── INSTITUTIONS ─────────────────────────────────────────────
const INSTITUTIONS: [string[], string][] = [
    [["central bank of kenya", "cbk ", "cbk rate", "cbk mpc", "monetary policy kenya", "interest rate kenya"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Central_Bank_of_Kenya_logo.png/200px-Central_Bank_of_Kenya_logo.png"],
    [["safaricom"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Safaricom.svg/200px-Safaricom.svg.png"],
    [["mpesa", "m-pesa"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/200px-M-PESA_LOGO-01.svg.png"],
    [["nairobi securities exchange", "nairobi stock exchange", "nse "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Nairobi_Securities_Exchange.png/200px-Nairobi_Securities_Exchange.png"],
    [["kcb ", "kenya commercial bank"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/KCB_Group_logo.png/200px-KCB_Group_logo.png"],
    [["equity bank", "equity group"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Equity_Bank_Kenya.png/200px-Equity_Bank_Kenya.png"],
    [["kenya airways", " kq "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Kenya_Airways_Logo.svg/200px-Kenya_Airways_Logo.svg.png"],
    [["iebc", "electoral commission kenya", "2027 election", "kenya election"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/IEBC_logo.png/200px-IEBC_logo.png"],
    [["parliament kenya", "national assembly kenya", "finance bill"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Parliament_of_Kenya.jpg/200px-Parliament_of_Kenya.jpg"],
    [["federal reserve", "fed rate", "fomc", "us interest rate"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/US-FederalReserveSystem-Seal.svg/150px-US-FederalReserveSystem-Seal.svg.png"],
    [["imf ", "international monetary fund"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/International_Monetary_Fund_logo.svg/200px-International_Monetary_Fund_logo.svg.png"],
    [["world bank"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/The_World_Bank_logo.svg/200px-The_World_Bank_logo.svg.png"],
    [["united nations", "unsc", "un general"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/200px-Flag_of_the_United_Nations.svg.png"],
    [["nato "],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/200px-Flag_of_NATO.svg.png"],
    [["opec", "crude oil", "brent crude"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/OPEC_logo.svg/150px-OPEC_logo.svg.png"],
    [["african union", "au summit"],
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/200px-Flag_of_the_African_Union.svg.png"],
];

// ── TEAMS / CLUBS ─────────────────────────────────────────────
const TEAMS: [string[], string][] = [
    [["gor mahia"], "https://upload.wikimedia.org/wikipedia/en/e/e1/Gor_Mahia_FC_logo.svg"],
    [["afc leopards", "ingwe"], "https://upload.wikimedia.org/wikipedia/en/2/23/AFC_Leopards_SC_logo.svg"],
    [["tusker fc", "tusker "], "https://upload.wikimedia.org/wikipedia/en/5/5f/Tusker_FC_crest.png"],
    [["arsenal"], "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg"],
    [["chelsea"], "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"],
    [["liverpool"], "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"],
    [["manchester city", "man city"], "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"],
    [["manchester united", "man utd"], "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg"],
    [["tottenham", "spurs"], "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg"],
    [["aston villa"], "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_crest_%282016%29.svg"],
    [["newcastle"], "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg"],
    [["real madrid"], "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
    [["fc barcelona", "barcelona", "barca"], "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
    [["atletico madrid"], "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg"],
    [["bayern munich", "fc bayern"], "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg"],
    [["borussia dortmund", "bvb"], "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg"],
    [["juventus", "juve"], "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg"],
    [["ac milan"], "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg"],
    [["inter milan"], "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg"],
    [["napoli"], "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli_badge.svg"],
    [["psg", "paris saint-germain"], "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"],
    [["lakers"], "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg"],
    [["celtics"], "https://upload.wikimedia.org/wikipedia/en/8/8b/Boston_Celtics.svg"],
    [["warriors"], "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"],
    [["chiefs"], "https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg"],
    [["eagles"], "https://upload.wikimedia.org/wikipedia/en/8/8e/Philadelphia_Eagles_logo.svg"],
    [["red bull racing"], "https://upload.wikimedia.org/wikipedia/en/7/7c/Red_Bull_Racing_logo.svg"],
    [["ferrari f1"], "https://upload.wikimedia.org/wikipedia/en/d/d2/Ferrari_F1_Logo.svg"],
];

// ── COMPETITIONS ──────────────────────────────────────────────
const COMPETITIONS: [string[], string][] = [
    [["champions league", "ucl"], "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg"],
    [["premier league", "epl"], "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"],
    [["la liga"], "https://upload.wikimedia.org/wikipedia/commons/1/13/Laliga_logo.svg"],
    [["bundesliga"], "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg"],
    [["serie a"], "https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg"],
    [["world cup"], "https://upload.wikimedia.org/wikipedia/en/e/e3/2022_FIFA_World_Cup.svg"],
    [["afcon", "africa cup"], "https://upload.wikimedia.org/wikipedia/en/1/1d/Africa_Cup_of_Nations.svg"],
    [["ballon d\'or", "ballon dor"], "https://upload.wikimedia.org/wikipedia/en/c/c5/Ballon_d%27Or_logo.svg"],
    [["nba "], "https://upload.wikimedia.org/wikipedia/en/0/0c/NBA_Logo.svg"],
    [["nfl ", "super bowl"], "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg"],
    [["formula 1", "f1 ", "grand prix"], "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg"],
    [["ufc ", "mma fight"], "https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg"],
    [["grammy"], "https://upload.wikimedia.org/wikipedia/commons/5/5c/Grammy_logo.svg"],
    [["oscar", "academy award"], "https://upload.wikimedia.org/wikipedia/commons/6/6e/Oscar_Award.png"],
];

// ── CRYPTO ────────────────────────────────────────────────────
const CRYPTO: [string[], string][] = [
    [["bitcoin", "btc"], "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"],
    [["ethereum", "eth "], "https://assets.coingecko.com/coins/images/279/small/ethereum.png"],
    [["solana", "sol "], "https://assets.coingecko.com/coins/images/4128/small/solana.png"],
    [["bnb", "binance"], "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"],
    [["xrp", "ripple"], "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png"],
    [["cardano", "ada "], "https://assets.coingecko.com/coins/images/975/small/cardano.png"],
    [["dogecoin", "doge"], "https://assets.coingecko.com/coins/images/5/small/dogecoin.png"],
    [["avalanche", "avax"], "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png"],
    [["polygon", "matic"], "https://assets.coingecko.com/coins/images/4713/small/polygon.png"],
    [["toncoin", "ton "], "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png"],
    [["tether", "usdt"], "https://assets.coingecko.com/coins/images/325/small/Tether.png"],
    [["usdc"], "https://assets.coingecko.com/coins/images/6319/small/usdc.png"],
    [["shiba inu", "shib"], "https://assets.coingecko.com/coins/images/11939/small/shiba.png"],
    [["crypto", "defi", "blockchain", "web3", "altcoin"], "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"],
];

// ── TECH ──────────────────────────────────────────────────────
const TECH: [string[], string][] = [
    [["openai", "chatgpt", "gpt"], "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"],
    [["google ", "alphabet", "gemini"], "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"],
    [["apple ", "iphone"], "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"],
    [["tesla "], "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg"],
    [["meta ", "facebook"], "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg"],
    [["nvidia "], "https://upload.wikimedia.org/wikipedia/en/6/6d/Nvidia_image_logo.svg"],
    [["microsoft "], "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"],
    [["amazon ", "aws "], "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"],
    [["x.com", "twitter"], "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg"],
    [["tiktok"], "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg"],
    [["netflix "], "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"],
    [["spotify "], "https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"],
    [["samsung "], "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg"],
    [["safaricom"], "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Safaricom.svg/200px-Safaricom.svg.png"],
];

// ── FLAGS (always last — catch-all) ───────────────────────────
const FLAGS: [string[], string][] = [
    [["kenya", "nairobi", "mombasa", "kisumu", "kenyan", "harambee", "kpl"], "https://flagcdn.com/w40/ke.png"],
    [["usa ", "united states", "white house", "congress", "us election"], "https://flagcdn.com/w40/us.png"],
    [["united kingdom", " uk ", "britain", "england"], "https://flagcdn.com/w40/gb.png"],
    [["ukraine", "kyiv"], "https://flagcdn.com/w40/ua.png"],
    [["russia ", "moscow"], "https://flagcdn.com/w40/ru.png"],
    [["china ", "beijing"], "https://flagcdn.com/w40/cn.png"],
    [["india ", "delhi"], "https://flagcdn.com/w40/in.png"],
    [["nigeria ", "lagos"], "https://flagcdn.com/w40/ng.png"],
    [["south africa", "johannesburg"], "https://flagcdn.com/w40/za.png"],
    [["ethiopia ", "addis"], "https://flagcdn.com/w40/et.png"],
    [["ghana ", "accra"], "https://flagcdn.com/w40/gh.png"],
    [["tanzania "], "https://flagcdn.com/w40/tz.png"],
    [["uganda "], "https://flagcdn.com/w40/ug.png"],
    [["rwanda "], "https://flagcdn.com/w40/rw.png"],
    [["somalia "], "https://flagcdn.com/w40/so.png"],
    [["gaza", "palestine"], "https://flagcdn.com/w40/ps.png"],
    [["israel "], "https://flagcdn.com/w40/il.png"],
    [["iran "], "https://flagcdn.com/w40/ir.png"],
    [["saudi ", "riyadh"], "https://flagcdn.com/w40/sa.png"],
    [["turkey "], "https://flagcdn.com/w40/tr.png"],
    [["brazil ", "rio "], "https://flagcdn.com/w40/br.png"],
    [["france ", "paris "], "https://flagcdn.com/w40/fr.png"],
    [["germany ", "berlin"], "https://flagcdn.com/w40/de.png"],
    [["japan ", "tokyo"], "https://flagcdn.com/w40/jp.png"],
    [["australia "], "https://flagcdn.com/w40/au.png"],
    [["canada ", "ottawa"], "https://flagcdn.com/w40/ca.png"],
    [["argentina "], "https://flagcdn.com/w40/ar.png"],
    [["portugal "], "https://flagcdn.com/w40/pt.png"],
    [["spain ", "madrid "], "https://flagcdn.com/w40/es.png"],
];

// ── Merged in priority order ───────────────────────────────────
// PEOPLE first — "Ruto" → Ruto face, not Kenya flag
// INSTITUTIONS — "CBK" → CBK logo, not Kenya flag
// TEAMS — "Arsenal" → crest, not UK flag
// COMPETITIONS, CRYPTO, TECH, FLAGS last
const ALL_ICONS: [string[], string][] = [
    ...PEOPLE,
    ...INSTITUTIONS,
    ...TEAMS,
    ...COMPETITIONS,
    ...CRYPTO,
    ...TECH,
    ...FLAGS,
];

export function resolveQuestionIcon(
    iconUrl: string | null | undefined,
    statement: string,
): string | null {
    if (iconUrl) return iconUrl;
    const lower = statement.toLowerCase();
    for (const [keywords, url] of ALL_ICONS) {
        if (keywords.some(k => lower.includes(k))) return url;
    }
    return null;
}

// Icon type detection — used by QuestionIcon component
export function getIconMeta(url: string): { type: "person" | "flag" | "logo-svg" | "logo-png" } {
    if (url.includes("flagcdn.com")) return { type: "flag" };
    // Check if it's a person portrait (jpg/jpeg from commons)
    if (url.includes("commons") && (url.includes(".jpg") || url.includes(".jpeg"))) return { type: "person" };
    if (url.toLowerCase().includes(".svg")) return { type: "logo-svg" };
    return { type: "logo-png" };
}

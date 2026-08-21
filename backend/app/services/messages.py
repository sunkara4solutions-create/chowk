LANGUAGE_MENU = (
    "👋 Welcome to *Chowk* | చౌక్‌కు స్వాగతం | चौक में स्वागत है\n\n"
    "Choose your language / భాష ఎంచుకోండి / भाषा चुनें:\n\n"
    "1. English\n"
    "2. తెలుగు\n"
    "3. हिंदी"
)

LANG_MAP = {"1": "en", "2": "te", "3": "hi"}

MSG = {
    "welcome": {
        "en": "Welcome to *Chowk*!\n\nI help you find daily work as a skilled worker.\n\nWhat is your full name?",
        "te": "*Chowk*కి స్వాగతం!\n\nమీకు రోజువారీ పని కనుగొనడంలో నేను సహాయం చేస్తాను.\n\nమీ పూర్తి పేరు ఏమిటి?",
        "hi": "*Chowk* में आपका स्वागत है!\n\nमैं आपको रोज़ काम खोजने में मदद करता हूं।\n\nआपका पूरा नाम क्या है?",
    },
    "name_too_short": {
        "en": "Please enter your full name.",
        "te": "దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.",
        "hi": "कृपया अपना पूरा नाम दर्ज करें।",
    },
    "skill_menu": {
        "en": (
            "What are your skills? Reply with number(s) — use comma for multiple (e.g. *1,4* for Painter & Plumber):\n"
            "1. Painter\n2. Mason\n3. Electrician\n4. Plumber\n"
            "5. Carpenter\n6. Welder\n7. Tiles Worker\n8. Helper\n9. Construction Laborer"
        ),
        "te": (
            "మీ నైపుణ్యాలు ఏమిటి? నంబర్లతో జవాబివ్వండి — బహుళ నైపుణ్యాలకు కామాతో (ఉదా. *1,4* పెయింటర్ & ప్లంబర్):\n"
            "1. పెయింటర్\n2. మేసన్\n3. ఎలక్ట్రీషియన్\n4. ప్లంబర్\n"
            "5. కార్పెంటర్\n6. వెల్డర్\n7. టైల్స్ వర్కర్\n8. హెల్పర్\n9. కన్స్ట్రక్షన్ లేబర్"
        ),
        "hi": (
            "आपके हुनर क्या हैं? नंबर से जवाब दें — कई हुनर के लिए कॉमा से (जैसे *1,4* पेंटर और प्लंबर):\n"
            "1. पेंटर\n2. राजमिस्त्री\n3. इलेक्ट्रीशियन\n4. प्लंबर\n"
            "5. बढ़ई\n6. वेल्डर\n7. टाइल्स वर्कर\n8. हेल्पर\n9. निर्माण मजदूर"
        ),
    },
    "skill_invalid": {
        "en": "Please reply with a number 1-9.",
        "te": "దయచేసి 1-9 మధ్య నంబర్ తో జవాబివ్వండి.",
        "hi": "कृपया 1 से 9 के बीच नंबर से जवाब दें।",
    },
    "ask_experience": {
        "en": "How many years of experience do you have? (e.g. 3, or 0 if fresher)",
        "te": "మీకు ఎన్ని సంవత్సరాల అనుభవం ఉంది? (ఉదా. 3, లేదా కొత్తగా ఉంటే 0)",
        "hi": "आपको कितने साल का अनुभव है? (जैसे 3, या नए हैं तो 0)",
    },
    "experience_invalid": {
        "en": "Please reply with a number (e.g. 3 for 3 years, 0 if fresher).",
        "te": "దయచేసి నంబర్ తో జవాబివ్వండి (ఉదా. 3 సంవత్సరాలకు 3, కొత్తగా ఉంటే 0).",
        "hi": "कृपया नंबर से जवाब दें (जैसे 3 साल के लिए 3, नए हैं तो 0)।",
    },
    "ask_rate": {
        "en": "What is your daily rate? (in rupees, e.g. 800)",
        "te": "మీ రోజువారీ రేటు ఎంత? (రూపాయలలో, ఉదా. 800)",
        "hi": "आपकी रोज़ की मजदूरी कितनी है? (रुपये में, जैसे 800)",
    },
    "rate_invalid": {
        "en": "Please enter a valid daily rate in rupees (e.g. 800).",
        "te": "దయచేసి సరైన రోజువారీ రేటు నమోదు చేయండి (ఉదా. 800).",
        "hi": "कृपया सही रोज़ की मजदूरी दर्ज करें (जैसे 800)।",
    },
    "ask_city": {
        "en": "Which city are you from?\n\n{cities}\n\nOr type your city name.",
        "te": "మీరు ఏ నగరం నుండి వచ్చారు?\n\n{cities}\n\nలేదా మీ నగరం పేరు టైప్ చేయండి.",
        "hi": "आप किस शहर से हैं?\n\n{cities}\n\nया अपने शहर का नाम टाइप करें।",
    },
    "registered": {
        "en": (
            "*You are registered on Chowk!* ✅\n\n"
            "Name: {name}\nSkill: {skill}\nCity: {city}\nDaily Rate: ₹{rate}\n\n"
            "You will receive job notifications when work is available in {city}.\n\n"
            "Reply *STOP* to unsubscribe anytime."
        ),
        "te": (
            "*మీరు Chowk లో నమోదయ్యారు!* ✅\n\n"
            "పేరు: {name}\nనైపుణ్యం: {skill}\nనగరం: {city}\nరోజువారీ రేటు: ₹{rate}\n\n"
            "{city} లో పని అందుబాటులో ఉన్నప్పుడు మీకు నోటిఫికేషన్లు వస్తాయి.\n\n"
            "ఎప్పుడైనా *STOP* అని రిప్లై చేయండి."
        ),
        "hi": (
            "*आप Chowk पर पंजीकृत हो गए!* ✅\n\n"
            "नाम: {name}\nहुनर: {skill}\nशहर: {city}\nरोज़ की मजदूरी: ₹{rate}\n\n"
            "{city} में काम मिलने पर आपको सूचना मिलेगी।\n\n"
            "कभी भी *STOP* लिखकर अनसब्सक्राइब करें।"
        ),
    },
    "welcome_back": {
        "en": "Welcome back, {name}! 👋\nSkill: {skill}\nCity: {city}\n\nYou will receive job alerts automatically. Reply *STOP* to unsubscribe.",
        "te": "తిరిగి స్వాగతం, {name}! 👋\nనైపుణ్యం: {skill}\nనగరం: {city}\n\nమీకు పని అలర్ట్‌లు స్వయంచాలకంగా వస్తాయి. అన్‌సబ్‌స్క్రైబ్ చేయడానికి *STOP* అని రిప్లై చేయండి.",
        "hi": "वापसी पर स्वागत है, {name}! 👋\nहुनर: {skill}\nशहर: {city}\n\nकाम के अलर्ट अपने आप आएंगे। अनसब्सक्राइब के लिए *STOP* लिखें।",
    },
    "unsubscribed": {
        "en": "You have been unsubscribed from Chowk. Reply *Hi* to re-register.",
        "te": "మీరు Chowk నుండి అన్‌సబ్‌స్క్రైబ్ అయ్యారు. తిరిగి నమోదు చేసుకోవడానికి *Hi* అని రిప్లై చేయండి.",
        "hi": "आप Chowk से अनसब्सक्राइब हो गए। फिर से पंजीकरण के लिए *Hi* लिखें।",
    },
    "marked_available": {
        "en": "You are now marked as available for work! ✅",
        "te": "మీరు ఇప్పుడు పని కోసం అందుబాటులో ఉన్నట్టు మార్కు చేయబడ్డారు! ✅",
        "hi": "आप अब काम के लिए उपलब्ध के रूप में चिह्नित हो गए! ✅",
    },
    "job_notify": {
        "en": (
            "🔔 *New Job Available!*\n\n"
            "Skill: {skill}\nLocation: {location}, {city}\n"
            "Date: {date}\nRate: ₹{rate}/day{start_time}\n\n"
            "Reply *1* = Interested ✅\nReply *2* = Not Interested ❌"
        ),
        "te": (
            "🔔 *కొత్త పని అందుబాటులో ఉంది!*\n\n"
            "నైపుణ్యం: {skill}\nస్థానం: {location}, {city}\n"
            "తేదీ: {date}\nరేటు: ₹{rate}/రోజు{start_time}\n\n"
            "*1* అని రిప్లై చేయండి = ఆసక్తి ఉంది ✅\n*2* అని రిప్లై చేయండి = ఆసక్తి లేదు ❌"
        ),
        "hi": (
            "🔔 *नया काम उपलब्ध है!*\n\n"
            "हुनर: {skill}\nजगह: {location}, {city}\n"
            "तारीख: {date}\nरेट: ₹{rate}/दिन{start_time}\n\n"
            "*1* लिखें = दिलचस्पी है ✅\n*2* लिखें = दिलचस्पी नहीं ❌"
        ),
    },
    "job_confirmed": {
        "en": (
            "*Confirmed!* You are booked. 🎉\n\n"
            "Date: {date}\nLocation: {location}, {city}\nRate: ₹{rate}/day{start_time}\n\n"
            "{contractor_info}"
            "Good luck!"
        ),
        "te": (
            "*కన్ఫర్మ్ అయింది!* మీరు బుక్ చేయబడ్డారు. 🎉\n\n"
            "తేదీ: {date}\nస్థానం: {location}, {city}\nరేటు: ₹{rate}/రోజు{start_time}\n\n"
            "{contractor_info}"
            "శుభాకాంక్షలు!"
        ),
        "hi": (
            "*पक्का हो गया!* आप बुक हो गए। 🎉\n\n"
            "तारीख: {date}\nजगह: {location}, {city}\nरेट: ₹{rate}/दिन{start_time}\n\n"
            "{contractor_info}"
            "शुभकामनाएं!"
        ),
    },
    "con_worker_action": {
        "en": (
            "✅ *{name}* ({skill}) confirmed!\n📱 {phone}\n\n"
            "{confirmed}/{required} workers for {city} on {date}\n\n"
            "What do you want to do?\n"
            "1. Send pickup point to {name}\n"
            "2. Send a message to {name}\n"
            "3. Skip (I'll call directly)"
        ),
        "te": (
            "✅ *{name}* ({skill}) కన్ఫర్మ్ చేశారు!\n📱 {phone}\n\n"
            "{city} లో {date} న {confirmed}/{required} కార్మికులు\n\n"
            "మీరు ఏం చేయాలనుకుంటున్నారు?\n"
            "1. {name}కి పికప్ పాయింట్ పంపండి\n"
            "2. {name}కి మెసేజ్ పంపండి\n"
            "3. దాటవేయి (నేనే కాల్ చేస్తాను)"
        ),
        "hi": (
            "✅ *{name}* ({skill}) ने कन्फर्म किया!\n📱 {phone}\n\n"
            "{city} में {date} को {confirmed}/{required} मजदूर\n\n"
            "आप क्या करना चाहते हैं?\n"
            "1. {name} को पिकअप पॉइंट भेजें\n"
            "2. {name} को मैसेज भेजें\n"
            "3. छोड़ें (मैं खुद call करूंगा)"
        ),
    },
    "con_job_filled_action": {
        "en": "🎉 *Job fully filled!* All {required} {skill} workers confirmed for {city} on {date}.\n\nSend pickup point to all workers? Reply *PICKUP* with the details.",
        "te": "🎉 *పని పూర్తిగా నిండింది!* {city} లో {date} న అన్ని {required} {skill} కార్మికులు కన్ఫర్మ్ చేశారు.\n\nఅందరికీ పికప్ పాయింట్ పంపాలా? వివరాలతో *PICKUP* అని రిప్లై చేయండి.",
        "hi": "🎉 *काम पूरा भर गया!* {city} में {date} को सभी {required} {skill} मजदूर कन्फर्म हो गए।\n\nसभी को पिकअप पॉइंट भेजें? विवरण के साथ *PICKUP* लिखें।",
    },
    "con_ask_message": {
        "en": "Type the message to send to *{name}*:",
        "te": "*{name}*కి పంపాల్సిన మెసేజ్ టైప్ చేయండి:",
        "hi": "*{name}* को भेजने के लिए मैसेज लिखें:",
    },
    "con_message_sent": {
        "en": "✅ Message sent to *{name}*!",
        "te": "✅ *{name}*కి మెసేజ్ పంపబడింది!",
        "hi": "✅ *{name}* को मैसेज भेज दिया!",
    },
    "worker_message_from_contractor": {
        "en": "📩 *Message from your contractor:*\n{message}",
        "te": "📩 *మీ కాంట్రాక్టర్ నుండి మెసేజ్:*\n{message}",
        "hi": "📩 *आपके ठेकेदार का मैसेज:*\n{message}",
    },
    "job_filled": {
        "en": "Sorry, all positions for this job are filled. We'll notify you about the next one!",
        "te": "క్షమించండి, ఈ పని కోసం అన్ని స్థానాలు నిండిపోయాయి. తదుపరి అవకాశం గురించి మీకు తెలియజేస్తాం!",
        "hi": "माफ़ करें, इस काम की सभी जगहें भर गई हैं। अगले मौके पर आपको सूचित करेंगे!",
    },
    "job_not_available": {
        "en": "Sorry, this job is no longer available.",
        "te": "క్షమించండి, ఈ పని ఇకపై అందుబాటులో లేదు.",
        "hi": "माफ़ करें, यह काम अब उपलब्ध नहीं है।",
    },
    "job_rejected": {
        "en": "No problem! We'll notify you about the next job opportunity.",
        "te": "పర్వాలేదు! తదుపరి పని అవకాశం గురించి మీకు తెలియజేస్తాం.",
        "hi": "कोई बात नहीं! अगले काम के मौके पर आपको सूचित करेंगे।",
    },
    "invalid_response": {
        "en": "Please reply *1* for Interested or *2* for Not Interested.",
        "te": "దయచేసి ఆసక్తి ఉంటే *1* లేదా ఆసక్తి లేకపోతే *2* అని రిప్లై చేయండి.",
        "hi": "कृपया दिलचस्पी के लिए *1* या नहीं के लिए *2* लिखें।",
    },
    "job_expired": {
        "en": "Sorry, this job offer has expired.",
        "te": "క్షమించండి, ఈ పని ఆఫర్ గడువు ముగిసింది.",
        "hi": "माफ़ करें, इस काम का ऑफर समाप्त हो गया।",
    },
    "fallback": {
        "en": "You're registered on Chowk ✅\n\nWe'll notify you when a matching job is available.\n\nReply *Hi* to see your profile | *STOP* to unsubscribe.",
        "te": "మీరు Chowk లో నమోదయ్యారు ✅\n\nసరిపోయే పని అందుబాటులో ఉన్నప్పుడు మీకు తెలియజేస్తాము.\n\nమీ ప్రొఫైల్ చూడడానికి *Hi* | అన్‌సబ్‌స్క్రైబ్ చేయడానికి *STOP*",
        "hi": "आप Chowk पर पंजीकृत हैं ✅\n\nमिलता-जुलता काम मिलने पर हम सूचित करेंगे।\n\nप्रोफ़ाइल देखने के लिए *Hi* | अनसब्सक्राइब के लिए *STOP*",
    },
    # ── Contractor messages ──────────────────────────────────────────────
    "ask_role": {
        "en": "Are you looking for work or hiring workers?\n\n1. Looking for work 👷\n2. Hiring workers 🏗️",
        "te": "మీరు పని వెతుకుతున్నారా లేదా కార్మికులను నియమించుకుంటున్నారా?\n\n1. పని వెతుకుతున్నాను 👷\n2. కార్మికులను నియమించుకుంటున్నాను 🏗️",
        "hi": "आप काम ढूंढ रहे हैं या मजदूर रख रहे हैं?\n\n1. काम ढूंढ रहा हूं 👷\n2. मजदूर रख रहा हूं 🏗️",
    },
    "role_invalid": {
        "en": "Please reply 1 or 2.",
        "te": "దయచేసి 1 లేదా 2 అని రిప్లై చేయండి.",
        "hi": "कृपया 1 या 2 लिखें।",
    },
    "con_ask_name": {
        "en": "Great! What is your name?",
        "te": "చాలా మంచిది! మీ పేరు ఏమిటి?",
        "hi": "बढ़िया! आपका नाम क्या है?",
    },
    "con_ask_company": {
        "en": "What is your company or business name? (Type *skip* if none)",
        "te": "మీ కంపెనీ లేదా వ్యాపార పేరు ఏమిటి? (లేకపోతే *skip* అని టైప్ చేయండి)",
        "hi": "आपकी कंपनी या व्यापार का नाम क्या है? (नहीं है तो *skip* लिखें)",
    },
    "con_ask_city": {
        "en": "Which city do you operate in?",
        "te": "మీరు ఏ నగరంలో వ్యాపారం చేస్తున్నారు?",
        "hi": "आप किस शहर में काम करते हैं?",
    },
    "con_registered": {
        "en": (
            "*You are registered as a Contractor on Chowk!* ✅\n\n"
            "Name: {name}\nCity: {city}\n\n"
            "To post a job, just type your requirement naturally. For example:\n"
            "_\"Need 10 painters in Guntur tomorrow, ₹900/day starting 8am\"_\n\n"
            "I'll understand and confirm before posting."
        ),
        "te": (
            "*మీరు Chowk లో కాంట్రాక్టర్‌గా నమోదయ్యారు!* ✅\n\n"
            "పేరు: {name}\nనగరం: {city}\n\n"
            "పని పోస్ట్ చేయడానికి, మీ అవసరాన్ని సాధారణంగా టైప్ చేయండి. ఉదాహరణకు:\n"
            "_\"రేపు గుంటూరులో 10 మంది పెయింటర్లు కావాలి, ₹900/రోజు, 8am కి\"_\n\n"
            "నేను అర్థం చేసుకుని పోస్ట్ చేసే ముందు నిర్ధారిస్తాను."
        ),
        "hi": (
            "*आप Chowk पर ठेकेदार के रूप में पंजीकृत हो गए!* ✅\n\n"
            "नाम: {name}\nशहर: {city}\n\n"
            "काम पोस्ट करने के लिए, बस अपनी ज़रूरत स्वाभाविक रूप से लिखें। उदाहरण:\n"
            "_\"कल गुंटूर में 10 पेंटर चाहिए, ₹900/दिन, सुबह 8 बजे से\"_\n\n"
            "मैं समझकर पोस्ट करने से पहले पुष्टि करूंगा।"
        ),
    },
    "con_confirm_job": {
        "en": (
            "📋 *Confirm Job Posting*\n\n"
            "Skill: {skill}\nWorkers needed: {count}\n"
            "City: {city}\nDate: {date}\nRate: ₹{rate}/day{start_time}\n\n"
            "Reply *YES* to post | *NO* to cancel"
        ),
        "te": (
            "📋 *పని పోస్టింగ్ నిర్ధారించండి*\n\n"
            "నైపుణ్యం: {skill}\nకావలసిన కార్మికులు: {count}\n"
            "నగరం: {city}\nతేదీ: {date}\nరేటు: ₹{rate}/రోజు{start_time}\n\n"
            "*YES* అని రిప్లై చేయండి పోస్ట్ చేయడానికి | *NO* రద్దు చేయడానికి"
        ),
        "hi": (
            "📋 *काम पोस्ट की पुष्टि करें*\n\n"
            "हुनर: {skill}\nमजदूर चाहिए: {count}\n"
            "शहर: {city}\nतारीख: {date}\nरेट: ₹{rate}/दिन{start_time}\n\n"
            "*YES* लिखें पोस्ट करने के लिए | *NO* रद्द करने के लिए"
        ),
    },
    "con_job_posted": {
        "en": "✅ *Job posted!* Notifying matching workers in {city} now...",
        "te": "✅ *పని పోస్ట్ చేయబడింది!* {city} లో సరిపోయే కార్మికులకు ఇప్పుడు తెలియజేస్తున్నాము...",
        "hi": "✅ *काम पोस्ट हो गया!* {city} में मिलते-जुलते मजदूरों को अभी सूचित किया जा रहा है...",
    },
    "con_job_cancelled": {
        "en": "Cancelled. Type your requirement again whenever you're ready.",
        "te": "రద్దు చేయబడింది. మీరు సిద్ధంగా ఉన్నప్పుడు మళ్ళీ మీ అవసరాన్ని టైప్ చేయండి.",
        "hi": "रद्द किया। जब तैयार हों तो अपनी ज़रूरत फिर से लिखें।",
    },
    "con_fallback": {
        "en": "I can help you *post jobs* or check your *active postings*.\n\nSay *Hi* to see your jobs, or type your requirement like:\n_\"10 painters tomorrow ₹800\"_",
        "te": "నేను *పని పోస్ట్* చేయడంలో లేదా *క్రియాశీల పోస్టింగ్‌లు* చూపించడంలో సహాయం చేయగలను.\n\nమీ జాబ్‌లు చూడటానికి *Hi* అని చెప్పండి లేదా మీ అవసరాన్ని టైప్ చేయండి:\n_\"రేపు 10 పెయింటర్లు ₹800\"_",
        "hi": "मैं *काम पोस्ट* करने या *सक्रिय पोस्टिंग* दिखाने में मदद कर सकता हूं।\n\nअपने काम देखने के लिए *Hi* कहें, या अपनी ज़रूरत लिखें:\n_\"कल 10 पेंटर ₹800\"_",
    },
    "con_parse_error": {
        "en": (
            "I couldn't understand that fully. Please include:\n"
            "• Skill (e.g. painters, masons)\n"
            "• Number of workers\n"
            "• City\n"
            "• Date\n"
            "• Daily rate (₹)\n\n"
            "Example: _\"10 painters Guntur tomorrow ₹900\"_"
        ),
        "te": (
            "నాకు అది పూర్తిగా అర్థం కాలేదు. దయచేసి చేర్చండి:\n"
            "• నైపుణ్యం (ఉదా. పెయింటర్లు, మేసన్లు)\n"
            "• కార్మికుల సంఖ్య\n"
            "• నగరం\n"
            "• తేదీ\n"
            "• రోజువారీ రేటు (₹)\n\n"
            "ఉదాహరణ: _\"10 పెయింటర్లు గుంటూరు రేపు ₹900\"_"
        ),
        "hi": (
            "मैं इसे पूरी तरह समझ नहीं पाया। कृपया शामिल करें:\n"
            "• हुनर (जैसे पेंटर, राजमिस्त्री)\n"
            "• मजदूरों की संख्या\n"
            "• शहर\n"
            "• तारीख\n"
            "• रोज़ की मजदूरी (₹)\n\n"
            "उदाहरण: _\"10 पेंटर गुंटूर कल ₹900\"_"
        ),
    },
    "con_worker_accepted": {
        "en": "✅ *{name}* ({skill}) confirmed!\n{confirmed}/{required} workers filled for {city} on {date}.",
        "te": "✅ *{name}* ({skill}) కన్ఫర్మ్ చేశారు!\n{city} లో {date} న {confirmed}/{required} కార్మికులు నిండారు.",
        "hi": "✅ *{name}* ({skill}) ने कन्फर्म किया!\n{city} में {date} को {confirmed}/{required} मजदूर भरे।",
    },
    "ask_missing_city": {
        "en": "Got it! Which *city* do you need these workers in?",
        "te": "అర్థమైంది! ఈ కార్మికులు ఏ *నగరంలో* కావాలి?",
        "hi": "समझ गया! ये मजदूर किस *शहर* में चाहिए?",
    },
    "ask_missing_date": {
        "en": "Got it! Which *date* do you need them? (e.g. tomorrow, 10 Jun)",
        "te": "అర్థమైంది! మీకు ఏ *తేదీన* కావాలి? (ఉదా. రేపు, 10 జూన్)",
        "hi": "समझ गया! किस *तारीख* को चाहिए? (जैसे कल, 10 जून)",
    },
    "ask_missing_rate": {
        "en": "Got it! What is the *daily rate* (₹)?",
        "te": "అర్థమైంది! *రోజువారీ రేటు* (₹) ఎంత?",
        "hi": "समझ गया! *रोज़ की मजदूरी* (₹) कितनी है?",
    },
    "ask_missing_count": {
        "en": "Got it! How many workers do you need?",
        "te": "అర్థమైంది! మీకు ఎంత మంది కార్మికులు కావాలి?",
        "hi": "समझ गया! कितने मजदूर चाहिए?",
    },
    "ask_missing_skill": {
        "en": "Got it! What type of workers do you need?\n\nPainter / Mason / Electrician / Plumber / Carpenter / Welder / Tiles Worker / Helper / Construction Laborer",
        "te": "అర్థమైంది! మీకు ఏ రకమైన కార్మికులు కావాలి?\n\nపెయింటర్ / మేసన్ / ఎలక్ట్రీషియన్ / ప్లంబర్ / కార్పెంటర్ / వెల్డర్ / టైల్స్ వర్కర్ / హెల్పర్ / కన్స్ట్రక్షన్ లేబర్",
        "hi": "समझ गया! किस *तरह के* मजदूर चाहिए?\n\nपेंटर / राजमिस्त्री / इलेक्ट्रीशियन / प्लंबर / बढ़ई / वेल्डर / टाइल्स वर्कर / हेल्पर / निर्माण मजदूर",
    },
    "ask_missing_many": {
        "en": "Almost there! Please also include: *{fields}*",
        "te": "దాదాపు పూర్తైంది! దయచేసి ఇవి కూడా చేర్చండి: *{fields}*",
        "hi": "लगभग हो गया! कृपया यह भी बताएं: *{fields}*",
    },
    "con_job_filled": {
        "en": "🎉 *Job fully filled!* All {required} {skill} workers confirmed for {city} on {date}.",
        "te": "🎉 *పని పూర్తిగా నిండింది!* {city} లో {date} న అన్ని {required} {skill} కార్మికులు కన్ఫర్మ్ చేశారు.",
        "hi": "🎉 *काम पूरा भर गया!* {city} में {date} को सभी {required} {skill} मजदूर कन्फर्म हो गए।",
    },
}


def t(key: str, lang: str, **kwargs) -> str:
    text = MSG.get(key, {}).get(lang) or MSG.get(key, {}).get("en", "")
    return text.format(**kwargs) if kwargs else text

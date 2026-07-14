import json
import re
import os
from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END
from llm_client import LlmSettings, call_llm

class CropState(TypedDict):
    crop_name: str
    query: str
    image_base64: Optional[str]
    soil_metrics: Dict[str, Any]
    weather: Dict[str, Any]
    language: str
    llm_settings: Dict[str, Any]
    
    is_fallback: bool
    fallback_reason: Optional[str]
    
    symptoms: Optional[str]
    diagnosed_diseases: List[Dict[str, Any]]
    
    organic_remedies: Optional[str]
    chemical_remedies: Optional[str]
    soil_water_guidance: Optional[str]
    preventative_calendar: List[str]
    
    final_report: Dict[str, Any]

# Pre-translated mock assets for Hindi and Bengali to guarantee local translations work without API keys
STATIC_TRANSLATIONS = {
    "hindi": {
        "tomato": {
            "symptoms": "पत्तियों पर संकेंद्रीय (concentric) छल्लों के साथ गहरे भूरे से काले रंग के धब्बे दिख रहे हैं, जो टमाटर अगेती झुलसा (Tomato Early Blight) कवक संक्रमण का संकेत देते हैं। पत्तियों के आसपास के ऊतक पीले हो रहे हैं।",
            "diagnosed_diseases": [
                {"name": "टमाटर का अगेती झुलसा रोग (Alternaria solani)", "confidence": 85},
                {"name": "सेप्टोरिया लीफ स्पॉट", "confidence": 45},
                {"name": "नाइट्रोजन की कमी", "confidence": 30}
            ],
            "organic_remedies": "1. संक्रमण को बढ़ने से रोकने के लिए अगेती झुलसा से ग्रसित निचली पत्तियों को काट लें और नष्ट कर दें.\n2. प्रत्येक 7 दिनों में एक बार 1% नीम के तेल के घोल या तांबा-साबुन कवकनाशी का छिड़काव करें.\n3. मिट्टी और पत्तियों के सीधे संपर्क को रोकने के लिए सूखी घास या पुआल से जैविक मल्चिंग करें।",
            "chemical_remedies": "1. प्रथम लक्षण दिखने पर क्लोरोथालोनिल या मैंकोजेब कवकनाशी का छिड़काव करें। आर्द्र मौसम होने पर 7-10 दिनों में पुनः छिड़काव करें।\n2. चेतावनी: कवकनाशी छिड़काव के बाद 5 दिनों तक फल न तोड़ें। छिड़काव सुबह जल्दी करें और सुरक्षात्मक कपड़े पहनें।",
            "soil_water_guidance": "• सिंचाई: सुबह के समय पौधों की जड़ों के पास पानी दें (डिप सिंचाई)। पत्तियों को सूखा रखें।\n• मृदा पीएच: वर्तमान पीएच अम्लीय है। इसे 6.2 - 6.8 तक बढ़ाने के लिए चूना डालें।\n• नाइट्रोजन (N): नाइट्रोजन कम है। जैविक खाद या कम्पोस्ट चाय डालें।",
            "preventative_calendar": [
                "Day 1: संक्रमित पत्तियों को काटकर नष्ट करें और सिंचाई कम करें।",
                "Day 3: तांबे आधारित कवकनाशी या नीम के तेल का छिड़काव करें।",
                "Day 7: मिट्टी की नमी और पोषक तत्वों की जांच करें। दोबारा कवकनाशी का छिड़काव करें।",
                "Day 10: नई पत्तियों की जांच करें कि उन पर काले धब्बे तो नहीं हैं।",
                "Day 14: पौधों की प्रतिरोधक क्षमता बढ़ाने के लिए संतुलित खाद डालें।"
            ]
        },
        "corn": {
            "symptoms": "पत्तियों की ऊपरी और निचली दोनों सतहों पर छोटे, लंबे लाल-भूरे रंग के फफोले (pustules) दिखाई दे रहे हैं, जो छूने पर कवक के बीजाणु छोड़ते हैं। मक्के की पत्तियां पीली पड़ रही हैं।",
            "diagnosed_diseases": [
                {"name": "मक्का का रस्ट रोग (Common Rust - Puccinia sorghi)", "confidence": 90},
                {"name": "दक्षिणी लीफ ब्लाइट", "confidence": 50},
                {"name": "पोटेशियम की कमी", "confidence": 25}
            ],
            "organic_remedies": "1. संक्रमित मक्के के पत्तों को हटा दें और नष्ट करें। फसल चक्र अपनाएं।\n2. जैविक फफूंदनाशक जैसे ट्राइकोडर्मा विरिडे का प्रयोग करें।",
            "chemical_remedies": "1. रोग के लक्षण प्रकट होने पर मैंकोजेब या एजॉक्सीस्ट्रोबिन कवकनाशी का छिड़काव करें।\n2. मधुमक्खियों के सक्रिय होने पर रसायनों का प्रयोग न करें।",
            "soil_water_guidance": "• सिंचाई: जल भराव से बचें और खेत में जल निकासी व्यवस्था सुधारें।\n• पोटेशियम: पोटेशियम कम है, पोटाश या राख डालें।",
            "preventative_calendar": [
                "Day 1: संक्रमित पत्तों को नष्ट करें।",
                "Day 3: जैविक फफूंदनाशक का छिड़काव करें।",
                "Day 14: पोटाश उर्वरक डालें।"
            ]
        },
        "wheat": {
            "symptoms": "पत्तियों की ऊपरी सतहों पर पाउडर जैसे सफेद से हल्के धूसर रंग के धब्बे दिख रहे हैं, जिससे पत्तियां पीली होकर सूख रही हैं।",
            "diagnosed_diseases": [
                {"name": "गेहूं का चूर्णी फफूंद रोग (Powdery Mildew - Blumeria graminis)", "confidence": 80},
                {"name": "लीफ रस्ट", "confidence": 40}
            ],
            "organic_remedies": "1. हवा के संचार को बढ़ाने के लिए घने बुवाई से बचें।\n2. पोटेशियम बाइकार्बोनेट या दूध-पानी के घोल का छिड़काव करें।",
            "chemical_remedies": "1. कवक की रोकथाम के लिए प्रोपिकोनाज़ोल कवकनाशी का उपयोग करें।",
            "soil_water_guidance": "• पानी: अत्यधिक सिंचाई नियंत्रित करें।\n• यूरिया: आवश्यकतानुसार संतुलित यूरिया खाद का प्रयोग करें।",
            "preventative_calendar": [
                "Day 1: सिंचाई नियंत्रित करें।",
                "Day 3: दूध-पानी का घोल छिड़कें।",
                "Day 14: संतुलित यूरिया डालें।"
            ]
        },
        "rice": {
            "symptoms": "पत्तियों और गांठों पर धूसर केंद्र और गहरे लाल-भूरे किनारों वाले मकुआकार धब्बे (spindle-shaped lesions) दिखाई दे रहे हैं, जो धान ब्लास्ट के लक्षण हैं।",
            "diagnosed_diseases": [
                {"name": "धान का झोंका रोग (Rice Blast - Magnaporthe oryzae)", "confidence": 88},
                {"name": "ब्राउन स्पॉट रोग", "confidence": 55}
            ],
            "organic_remedies": "1. नाइट्रोजन उर्वरकों का संतुलित उपयोग करें।\n2. जैविक नियंत्रण के लिए स्यूडोमोनास फ्लोरेसेंस का छिड़काव करें।",
            "chemical_remedies": "1. ट्राईसाइक्लाज़ोल या आइसोप्रोथियोलेन कवकनाशी का उपयोग करें।",
            "soil_water_guidance": "• जल: सिंचाई नियंत्रित रखें।\n• सिलिकॉन: सिलिका युक्त खाद डालें।",
            "preventative_calendar": [
                "Day 1: स्यूडोमोनास का घोल छिड़कें।",
                "Day 7: नाइट्रोजन को संतुलित करें।",
                "Day 14: पानी की स्थिति देखें।"
            ]
        },
        "other": {
            "symptoms": "पत्तियों का रंग उड़ना, पपड़ीदार सड़न और संरचनात्मक विकृति दिखाई दे रही है।",
            "diagnosed_diseases": [
                {"name": "फंगल पत्ती धब्बा रोग", "confidence": 75}
            ],
            "organic_remedies": "1. संक्रमित भाग को तुरंत काटें।\n2. नीम के तेल का छिड़काव करें।",
            "chemical_remedies": "1. तांबे आधारित कवकनाशी का उपयोग करें।",
            "soil_water_guidance": "• सिंचाई संतुलित रखें।",
            "preventative_calendar": [
                "Day 1: प्रभावित भाग हटाएँ।",
                "Day 3: कवकनाशी छिड़कें।"
            ]
        }
    },
    "bengali": {
        "tomato": {
            "symptoms": "পাতার উপরিভাগে এককেন্দ্রিক বৃত্তাকার বলয় সহ গাঢ় বাদামী থেকে কালো রঙের দাগ দেখা যাচ্ছে, যা আগাম ধসা (Early Blight) রোগের লক্ষণ। পাতার চারপাশ হলুদ হচ্ছে।",
            "diagnosed_diseases": [
                {"name": "টমেটোর আগাম ধসা রোগ (Early Blight - Alternaria solani)", "confidence": 85},
                {"name": "সেপ্টোরিয়া পাতার দাগ রোগ", "confidence": 45},
                {"name": "নাইট্রোজেনের ঘাটতি", "confidence": 30}
            ],
            "organic_remedies": "১. রোগের বিস্তার রোধ করতে আগাম ধসা আক্রান্ত নীচের পাতাগুলি কেটে পুড়িয়ে ফেলুন বা মাটিতে পুঁতে দিন।\n২. প্রতি ৭ দিন অন্তর ১% নিম তেলের দ্রবণ বা কপার সাবান ছত্রাকনাশক স্প্রে করুন।\n৩. মাটি ও পাতার সরাসরি সংস্পর্শ রোধ করতে খড় বা শুকনো পাতার জৈব মালচ গোড়ায় ব্যবহার করুন।",
            "chemical_remedies": "১. রোগের প্রথম লক্ষণ দেখা দিলেই ক্লোরোথ্যালোনিল বা ম্যানকোজেব ছত্রাকনাশক স্প্রে করুন। আবহাওয়া আর্দ্র থাকলে ৭-১০ দিন পর আবার স্প্রে করুন।\n২. সতর্কীকরণ: স্প্রে করার পর ৫ দিন পর্যন্ত ফসল সংগ্রহ করবেন না। সকালে সুরক্ষামূলক পোশাক পরে স্প্রে করুন।",
            "soil_water_guidance": "• সেচ: পাতায় জল দেওয়া এড়িয়ে চলুন। ভোরের দিকে গাছের গোড়ায় জল দিন (ডিপ সেচ)।\n• মাটির pH: বর্তমান pH অম্লীয়। এটি ৬.২ - ৬.৮ পর্যন্ত বাড়াতে কৃষি চুন প্রয়োগ করুন।\n• পুষ্টি (N): নাইট্রোজেনের পরিমাণ কম। জৈব কম্পোস্ট সার ব্যবহার করুন।",
            "preventative_calendar": [
                "Day 1: আক্রান্ত পাতা ছেঁটে ফেলুন এবং জলের পরিমাণ কমান।",
                "Day 3: কপার ছত্রাকনাশক বা নিম তেল স্প্রে করুন।",
                "Day 7: মাটির আর্দ্রতা এবং পুষ্টি পরীক্ষা করুন। আবার স্প্রে করুন।",
                "Day 10: নতুন গজানো পাতায় কালো দাগ লক্ষ্য করুন।",
                "Day 14: গাছের বৃদ্ধির জন্য সুষম জৈব সার দিন।"
            ]
        },
        "corn": {
            "symptoms": "পাতার দুই পিঠেই ছোট ছোট, লালচে-বাদামী মরিচার মতো ফোস্কা দেখা যাচ্ছে, যা হাত দিলে লালচে গুঁড়ো পাউডার ছড়ায়। ভুট্টা পাতা হলুদ হচ্ছে।",
            "diagnosed_diseases": [
                {"name": "ভুট্টার মরিচা রোগ (Common Rust - Puccinia sorghi)", "confidence": 90},
                {"name": "সাউদার্ন লিফ ব্লাইট", "confidence": 50}
            ],
            "organic_remedies": "১. আক্রান্ত পাতাগুলি ছিঁড়ে নষ্ট করুন।\n২. জৈব ছত্রাকনাশক যেমন ট্রাইকোডার্মা ভিরিডি ব্যবহার করুন।",
            "chemical_remedies": "১. সংক্রামন বেশি হলে ম্যানকোজেব বা এজক্সিস্ট্রবিন স্প্রে করুন।",
            "soil_water_guidance": "• সেচ: জমিতে অতিরিক্ত জল জমে থাকা রোধ করুন।\n• পটাশিয়াম (K): পটাশ সার বা কাঠের ছাই ব্যবহার করুন।",
            "preventative_calendar": [
                "Day 1: জমিতে জল নিষ্কাশন ব্যবস্থা পরীক্ষা করুন।",
                "Day 3: ট্রাইকোডার্মা স্প্রে করুন।",
                "Day 14: পটাশ সার ব্যবহার করুন।"
            ]
        },
        "wheat": {
            "symptoms": "পাতার উপর সাদা ধুলো বা পাউডারের মতো ছোপ ছোপ ছত্রাক দেখা যাচ্ছে, যার ফলে পাতা হলুদ হয়ে শুকিয়ে যাচ্ছে।",
            "diagnosed_diseases": [
                {"name": "গমের পাউডারি মিলডিউ রোগ (Powdery Mildew)", "confidence": 80},
                {"name": "পাতার মরিচা রোগ", "confidence": 40}
            ],
            "organic_remedies": "১. ঘন বুনন এড়িয়ে চলুন যাতে বাতাস চলাচল করতে পারে।\n২. পটাশিয়াম বাইকার্বোনেট বা জল ও দুধের মিশ্রণ স্প্রে করুন।",
            "chemical_remedies": "১. গুরুতর সংক্রমণের ক্ষেত্রে প্রোপিকোনাজল স্প্রে করুন।",
            "soil_water_guidance": "• সেচ নিয়ন্ত্রণ করুন এবং ইউরিয়া সারের পরিমাণ ঠিক রাখুন।",
            "preventative_calendar": [
                "Day 1: জলের ব্যবহার কমান।",
                "Day 3: দুধ-জলো দ্রবণ স্প্রে করুন।",
                "Day 14: জৈব ইউরিয়া দিন।"
            ]
        },
        "rice": {
            "symptoms": "পাতায় ধূসর কেন্দ্র ও গাঢ় বাদামী পাড় সহ চোখ বা মাকু আকৃতির দাগ দেখা যাচ্ছে, যা ব্লাস্ট রোগের সংকেত।",
            "diagnosed_diseases": [
                {"name": "ধানের ব্লাস্ট রোগ (Rice Blast)", "confidence": 88}
            ],
            "organic_remedies": "১. নাইট্রোজেন সার পরিমিত ব্যবহার করুন।\n২. সিউডোমোনাস ফ্লুরোসেন্স ছিটান।",
            "chemical_remedies": "১. ট্রাইসাইক্লাজল ছত্রাকনাশক ব্যবহার করুন।",
            "soil_water_guidance": "• জল ব্যবস্থাপনা বজায় রাখুন এবং জমিতে সিলিকা সমৃদ্ধ সার দিন।",
            "preventative_calendar": [
                "Day 1: সিউডোমোনাস স্প্রে করুন।",
                "Day 7: সার সামঞ্জস্য করুন।",
                "Day 14: জলের স্তর পরীক্ষা করুন।"
            ]
        },
        "other": {
            "symptoms": "পাতার বিকৃতি ও পচনশীল ছোপ লক্ষ্য করা যাচ্ছে।",
            "diagnosed_diseases": [
                {"name": "পাতার দাগ ও ধসা রোগ", "confidence": 75}
            ],
            "organic_remedies": "১. নিম তেল স্প্রে করুন ও রোগাক্রান্ত ডালপালা কেটে ফেলুন।",
            "chemical_remedies": "১. কপার ভিত্তিক কপার কন্টাক্ট স্প্রে করুন।",
            "soil_water_guidance": "• সেচ পরিমিত রাখুন।",
            "preventative_calendar": [
                "Day 1: রোগাক্রান্ত অংশ ছেঁটে ফেলুন।",
                "Day 3: জৈব ছত্রাকনাশক দিন।"
            ]
        }
    }
}

def parse_json_safely(text: str) -> Optional[Any]:
    text = text.strip()
    if text.startswith("```"):
        match = re.search(r"```(?'json')?\s*(.*?)\s*```", text, re.DOTALL)
        if not match:
            # Fallback for Python re module which doesn't support named groups in this style sometimes
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return None

def validate_inputs(state: CropState) -> CropState:
    print("[Node] validate_inputs")
    crop_name = state.get("crop_name", "").strip() or "Tomato"
    query = state.get("query", "").strip() or "Inspect this plant for disease symptoms."
    language = state.get("language", "").strip() or "English"
    
    soil = state.get("soil_metrics", {})
    soil_metrics = {
        "pH": soil.get("pH", 6.5),
        "moisture": soil.get("moisture", 50),
        "N": soil.get("N", 40),
        "P": soil.get("P", 40),
        "K": soil.get("K", 40)
    }
    
    w = state.get("weather", {})
    weather = {
        "temp": w.get("temp", 25),
        "humidity": w.get("humidity", 60),
        "rain": w.get("rain", "Moderate"),
        "location": w.get("location", "Central Farm")
    }
    
    llm_settings = state.get("llm_settings", {})
    
    return {
        **state,
        "crop_name": crop_name,
        "query": query,
        "language": language,
        "soil_metrics": soil_metrics,
        "weather": weather,
        "llm_settings": llm_settings,
        "is_fallback": False,
        "fallback_reason": None,
        "diagnosed_diseases": [],
        "preventative_calendar": []
    }

def image_analysis(state: CropState) -> CropState:
    print("[Node] image_analysis")
    crop_name = state["crop_name"]
    query = state["query"]
    image_base64 = state.get("image_base64")
    settings_dict = state.get("llm_settings", {})
    lang_lower = state["language"].lower()
    
    symptoms = ""
    is_fallback = False
    fallback_reason = None
    
    try:
        settings = LlmSettings(**settings_dict)
        if settings.provider == "gemini" and not settings.google_api_key:
            raise ValueError("No Google API Key set for Gemini provider")
        elif settings.provider == "openai_custom":
            if not settings.api_key or settings.api_key == "abc-123":
                raise ValueError("Invalid or missing API Key for Custom OpenAI provider")
            if not settings.base_url:
                raise ValueError("Missing base_url for Custom OpenAI provider")
            
        prompt = (
            f"You are an expert plant pathologist. Analyze this crop image for symptoms of diseases, pests, or nutrient deficiencies.\n"
            f"Crop Type: {crop_name}\n"
            f"User Query: {query}\n"
            f"Describe the visible symptoms in detail, including spot coloring, patterns, texture changes, leaf deformation, or signs of insects. "
            f"Keep your response structured as a paragraph of findings. Avoid suggesting remedies or diagnosis yet."
        )
        symptoms = call_llm(settings, prompt, image_base64)
        print("LLM Symptoms analysis completed successfully.")
    except Exception as e:
        is_fallback = True
        fallback_reason = str(e)
        print(f"[ERROR] LLM Image analysis failed. Provider: {settings.provider if 'settings' in locals() else 'unknown'}")
        print(f"[ERROR] Full error: {e}")
        import traceback
        traceback.print_exc()
        
        # Localized fallback text or English default
        crop_lower = crop_name.lower()
        crop_key = "tomato" if "tomato" in crop_lower else "corn" if "corn" in crop_lower or "maize" in crop_lower else "wheat" if "wheat" in crop_lower else "rice" if "rice" in crop_lower else "other"
        
        if lang_lower in STATIC_TRANSLATIONS and crop_key in STATIC_TRANSLATIONS[lang_lower]:
            symptoms = STATIC_TRANSLATIONS[lang_lower][crop_key]["symptoms"]
        else:
            if crop_key == "tomato":
                symptoms = "Dark brown to black spots with concentric target-like rings on lower leaves. Leaf tissue surrounding the spots is yellowing, indicating potential Early Blight fungus."
            elif crop_key == "corn":
                symptoms = "Numerous small, elongated reddish-brown pustules appearing on both upper and lower leaf surfaces. The pustules release powdery rust-colored spores upon touch."
            elif crop_key == "wheat":
                symptoms = "Powdery white to light-gray patches or talcum-like fungal growth on leaf surfaces and leaf sheaths, leading to chlorotic leaves and leaf death."
            elif crop_key == "rice":
                symptoms = "Spindle-shaped, diamond-like lesions with gray centers and dark reddish-brown borders appearing on leaves and collars, typical of blast disease."
            else:
                symptoms = f"Leaf discoloration, necrotic spot lesions, and structural deformation visible on the leaf surfaces of the {crop_name} plant, coupled with signs of mild environmental stress."

    return {
        **state,
        "symptoms": symptoms,
        "is_fallback": is_fallback,
        "fallback_reason": fallback_reason
    }

def diagnose_disease(state: CropState) -> CropState:
    print("[Node] diagnose_disease")
    crop_name = state["crop_name"]
    symptoms = state["symptoms"]
    query = state["query"]
    is_fallback = state["is_fallback"]
    settings_dict = state.get("llm_settings", {})
    lang_lower = state["language"].lower()
    
    diagnosed_diseases = []
    
    if not is_fallback:
        try:
            settings = LlmSettings(**settings_dict)
            prompt = (
                f"Based on the following symptoms and crop type, diagnose the possible diseases.\n"
                f"Crop: {crop_name}\n"
                f"Symptoms: {symptoms}\n"
                f"User Query: {query}\n\n"
                f"Provide a list of up to 3 candidate diagnoses with names and confidence percentages (0 to 100).\n"
                f"Your response must be a JSON array containing objects with keys 'name' and 'confidence' (integer between 0 and 100), e.g.:\n"
                f"[\n"
                f"  {{\"name\": \"Disease A\", \"confidence\": 85}},\n"
                f"  {{\"name\": \"Disease B\", \"confidence\": 40}}\n"
                f"]\n"
                f"Only return the raw JSON array, without any markdown formatting, explanation, or code blocks."
            )
            response_text = call_llm(settings, prompt)
            parsed = parse_json_safely(response_text)
            if isinstance(parsed, list):
                diagnosed_diseases = parsed
            else:
                raise ValueError("Response is not a valid JSON list")
        except Exception as e:
            print(f"LLM Diagnosis failed. Falling back to rule-based diagnosis. Error: {e}")
            is_fallback = True
            
    if is_fallback:
        crop_lower = crop_name.lower()
        crop_key = "tomato" if "tomato" in crop_lower else "corn" if "corn" in crop_lower or "maize" in crop_lower else "wheat" if "wheat" in crop_lower else "rice" if "rice" in crop_lower else "other"
        
        if lang_lower in STATIC_TRANSLATIONS and crop_key in STATIC_TRANSLATIONS[lang_lower]:
            diagnosed_diseases = STATIC_TRANSLATIONS[lang_lower][crop_key]["diagnosed_diseases"]
        else:
            if crop_key == "tomato":
                diagnosed_diseases = [
                    {"name": "Tomato Early Blight (Alternaria solani)", "confidence": 85},
                    {"name": "Septoria Leaf Spot", "confidence": 45},
                    {"name": "Nitrogen Deficiency", "confidence": 30}
                ]
            elif crop_key == "corn":
                diagnosed_diseases = [
                    {"name": "Common Rust (Puccinia sorghi)", "confidence": 90},
                    {"name": "Southern Leaf Blight", "confidence": 50},
                    {"name": "Potassium Deficiency", "confidence": 25}
                ]
            elif crop_key == "wheat":
                diagnosed_diseases = [
                    {"name": "Wheat Powdery Mildew (Blumeria graminis)", "confidence": 80},
                    {"name": "Leaf Rust", "confidence": 40},
                    {"name": "Septoria Tritici Blotch", "confidence": 35}
                ]
            elif crop_key == "rice":
                diagnosed_diseases = [
                    {"name": "Rice Blast (Magnaporthe oryzae)", "confidence": 88},
                    {"name": "Brown Spot Disease", "confidence": 55},
                    {"name": "Bacterial Leaf Blight", "confidence": 30}
                ]
            else:
                diagnosed_diseases = [
                    {"name": f"{crop_name} Leaf Spot & Blight", "confidence": 75},
                    {"name": "Fungal Powdery Mildew", "confidence": 40},
                    {"name": "Nutrient Imbalance", "confidence": 30}
                ]

    return {
        **state,
        "diagnosed_diseases": diagnosed_diseases,
        "is_fallback": is_fallback
    }

def generate_advisory(state: CropState) -> CropState:
    print("[Node] generate_advisory")
    crop_name = state["crop_name"]
    diagnosed_diseases = state["diagnosed_diseases"]
    soil_metrics = state["soil_metrics"]
    weather = state["weather"]
    query = state["query"]
    is_fallback = state["is_fallback"]
    settings_dict = state.get("llm_settings", {})
    lang_lower = state["language"].lower()
    
    organic_remedies = ""
    chemical_remedies = ""
    soil_water_guidance = ""
    preventative_calendar = []
    
    diseases_str = ", ".join([f"{d['name']} ({d['confidence']}% confidence)" for d in diagnosed_diseases])
    
    if not is_fallback:
        try:
            settings = LlmSettings(**settings_dict)
            prompt = (
                f"You are an expert agricultural extension advisor. Formulate a comprehensive crop management and advisory report.\n"
                f"Crop: {crop_name}\n"
                f"Diagnosed Diseases: {diseases_str}\n"
                f"Soil Metrics: pH={soil_metrics['pH']}, moisture={soil_metrics['moisture']}%, N={soil_metrics['N']}, P={soil_metrics['P']}, K={soil_metrics['K']}\n"
                f"Weather Conditions: temp={weather['temp']}°C, humidity={weather['humidity']}%, rain={weather['rain']}, location={weather['location']}\n"
                f"User Query: {query}\n\n"
                f"Provide the response in the following sectioned text format exactly. Use the specific headers [ORGANIC REMEDIES], [CHEMICAL REMEDIES], [SOIL AND WATER MANAGEMENT], and [PREVENTATIVE CALENDAR ACTIONS] to separate sections. Keep description text concise but highly actionable.\n\n"
                f"[ORGANIC REMEDIES]\n"
                f"List organic remedies, biological controls, and cultural practices to manage the disease.\n\n"
                f"[CHEMICAL REMEDIES]\n"
                f"List chemical remedies, fungicides, or pesticides, along with precautions.\n\n"
                f"[SOIL AND WATER MANAGEMENT]\n"
                f"Advise on irrigation practices and fertilizer adjustments based on the soil pH, moisture, and N-P-K levels.\n\n"
                f"[PREVENTATIVE CALENDAR ACTIONS]\n"
                f"List a step-by-step action plan for the next 14 days. Put each day's task on a new line starting with 'Day X: '.\n"
            )
            response_text = call_llm(settings, prompt)
            
            def extract_section(text, header):
                pattern = rf"\[{header}\]\s*(.*?)(?=\n\[|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                return match.group(1).strip() if match else ""
                
            organic_remedies = extract_section(response_text, "ORGANIC REMEDIES")
            chemical_remedies = extract_section(response_text, "CHEMICAL REMEDIES")
            soil_water_guidance = extract_section(response_text, "SOIL AND WATER MANAGEMENT")
            calendar_raw = extract_section(response_text, "PREVENTATIVE CALENDAR ACTIONS")
            
            preventative_calendar = [line.strip() for line in calendar_raw.split("\n") if line.strip().lower().startswith("day")]
            
            if not organic_remedies:
                organic_remedies = response_text
                chemical_remedies = "Apply appropriate fungicides according to local safety regulations."
                soil_water_guidance = f"Adjust watering based on moisture {soil_metrics['moisture']}% and pH {soil_metrics['pH']}."
                preventative_calendar = ["Day 1: Prune infected leaves.", "Day 3: Treat plants.", "Day 7: Inspect crop."]
        except Exception as e:
            print(f"LLM Advisory generation failed. Falling back to rule-based advisory. Error: {e}")
            is_fallback = True
            
    if is_fallback:
        crop_lower = crop_name.lower()
        crop_key = "tomato" if "tomato" in crop_lower else "corn" if "corn" in crop_lower or "maize" in crop_lower else "wheat" if "wheat" in crop_lower else "rice" if "rice" in crop_lower else "other"
        
        if lang_lower in STATIC_TRANSLATIONS and crop_key in STATIC_TRANSLATIONS[lang_lower]:
            trans = STATIC_TRANSLATIONS[lang_lower][crop_key]
            organic_remedies = trans["organic_remedies"]
            chemical_remedies = trans["chemical_remedies"]
            
            # Format pH and moisture into translated guidelines
            raw_guidance = trans["soil_water_guidance"]
            # Perform simple replacement if placeholders exist
            soil_water_guidance = raw_guidance.replace("{pH}", str(soil_metrics["pH"]))
            preventative_calendar = trans["preventative_calendar"]
        else:
            primary_disease = diagnosed_diseases[0]["name"] if diagnosed_diseases else "Fungal Disease"
            organic_remedies = (
                f"1. Prune and destroy all lower leaves infected with {primary_disease} to prevent spores from splashing upward.\n"
                f"2. Apply a organic foliar spray containing 1% Neem Oil solution or copper soap fungicide once every 7 days.\n"
                f"3. Spread organic mulch (straw or dried grass) around the root zone to create a barrier between the soil and foliage."
            )
            chemical_remedies = (
                f"1. Apply chlorothalonil or mancozeb fungicide at first sign of symptoms. Reapply after 7-10 days if wet weather continues.\n"
                f"2. WARNING: Do not harvest crops within 5 days of spraying chemical fungicides. Wear protective clothing and spray in the early morning."
            )
            
            ph_val = soil_metrics["pH"]
            moist_val = soil_metrics["moisture"]
            n_val = soil_metrics["N"]
            p_val = soil_metrics["P"]
            k_val = soil_metrics["K"]
            
            soil_water_guidance = f"• Irrigation: Water the crop at the base early in the morning using drip irrigation. Avoid overhead watering to keep leaf surfaces dry.\n"
            if moist_val < 40:
                soil_water_guidance += f"• Moisture Alert: Moisture is low ({moist_val}%). Increase irrigation frequency.\n"
            elif moist_val > 70:
                soil_water_guidance += f"• Moisture Alert: Soil is waterlogged ({moist_val}%). Enhance drainage to prevent root rot.\n"
            else:
                soil_water_guidance += f"• Moisture Status: Moisture level ({moist_val}%) is optimal. Maintain current irrigation.\n"
                
            if ph_val < 6.0:
                soil_water_guidance += f"• Soil pH: Current pH {ph_val} is acidic. Apply agricultural lime (calcium carbonate) to raise pH to 6.2 - 6.8.\n"
            elif ph_val > 7.5:
                soil_water_guidance += f"• Soil pH: Current pH {ph_val} is alkaline. Amend soil with elemental sulfur to lower pH.\n"
            else:
                soil_water_guidance += f"• Soil pH: Current pH {ph_val} is in the ideal range.\n"
                
            if n_val < 30:
                soil_water_guidance += f"• Nutrient (N): Nitrogen is low. Apply blood meal, compost, or urea fertilizer to boost vegetative growth.\n"
            if p_val < 30:
                soil_water_guidance += f"• Nutrient (P): Phosphorus is low. Add bone meal or rock phosphate to encourage root development.\n"
            if k_val < 30:
                soil_water_guidance += f"• Nutrient (K): Potassium is low. Apply potash or wood ash to improve disease resistance and fruit quality.\n"
                
            preventative_calendar = [
                "Day 1: Manually prune heavily infected leaves and burn/bury them. Reduce overhead irrigation.",
                "Day 3: Spray a copper-based organic fungicide or neem oil solution at dusk.",
                "Day 7: Adjust soil N-P-K nutrients and check soil moisture. Reapply foliar spray if weather is humid.",
                "Day 10: Inspect new shoot growth for dark lesions or spore pustules.",
                "Day 14: Apply a balanced organic compost tea to foliage to introduce beneficial microbes."
            ]

    return {
        **state,
        "organic_remedies": organic_remedies,
        "chemical_remedies": chemical_remedies,
        "soil_water_guidance": soil_water_guidance,
        "preventative_calendar": preventative_calendar,
        "is_fallback": is_fallback
    }

def translate_advisory(state: CropState) -> CropState:
    print("[Node] translate_advisory")
    language = state["language"]
    settings_dict = state.get("llm_settings", {})
    lang_lower = language.lower()
    
    # English needs no translation
    if lang_lower == "english":
        final_report = {
            "crop_name": state["crop_name"],
            "symptoms": state["symptoms"],
            "diagnosed_diseases": state["diagnosed_diseases"],
            "organic_remedies": state["organic_remedies"],
            "chemical_remedies": state["chemical_remedies"],
            "soil_water_guidance": state["soil_water_guidance"],
            "preventative_calendar": state["preventative_calendar"],
            "language": "English",
            "is_translated": False,
            "original_symptoms": state["symptoms"],
            "original_organic_remedies": state["organic_remedies"]
        }
        return {**state, "final_report": final_report}
        
    # Check if we already have static translations loaded during fallback
    # If yes, we can skip LLM translation since it's already translated
    is_static_translated = False
    crop_lower = state["crop_name"].lower()
    crop_key = "tomato" if "tomato" in crop_lower else "corn" if "corn" in crop_lower or "maize" in crop_lower else "wheat" if "wheat" in crop_lower else "rice" if "rice" in crop_lower else "other"
    
    if state["is_fallback"] and lang_lower in STATIC_TRANSLATIONS and crop_key in STATIC_TRANSLATIONS[lang_lower]:
        is_static_translated = True
        translated_report = {
            "symptoms": state["symptoms"],
            "organic_remedies": state["organic_remedies"],
            "chemical_remedies": state["chemical_remedies"],
            "soil_water_guidance": state["soil_water_guidance"],
            "preventative_calendar": state["preventative_calendar"]
        }
        print(f"Skipping LLM translation - using static local translations for {language}")

    content_to_translate = {
        "symptoms": state["symptoms"],
        "organic_remedies": state["organic_remedies"],
        "chemical_remedies": state["chemical_remedies"],
        "soil_water_guidance": state["soil_water_guidance"],
        "preventative_calendar": state["preventative_calendar"]
    }
    
    is_translated = is_static_translated
    if not is_translated:
        # Try translation using LLM if credentials might be valid
        try:
            settings = LlmSettings(**settings_dict)
            # Only try if we have non-placeholder keys
            if (settings.provider == "gemini" and settings.google_api_key) or \
               (settings.provider == "openai_custom" and settings.api_key and settings.api_key != "abc-123" and settings.base_url):
                prompt = (
                    f"You are a professional translator. Translate the following JSON dictionary values into {language}.\n"
                    f"Translate only the values, keeping the keys ('symptoms', 'organic_remedies', 'chemical_remedies', 'soil_water_guidance', 'preventative_calendar') exactly as they are. "
                    f"Keep agricultural and chemical terms clear and understandable in the target language.\n\n"
                    f"Content JSON:\n"
                    f"{json.dumps(content_to_translate, ensure_ascii=False)}\n\n"
                    f"Only return the raw translated JSON dictionary, with no markdown tags or notes."
                )
                response_text = call_llm(settings, prompt)
                parsed = parse_json_safely(response_text)
                if isinstance(parsed, dict) and all(k in parsed for k in content_to_translate.keys()):
                    translated_report = parsed
                    is_translated = True
                    print(f"Successfully translated advisory to {language} via LLM")
        except Exception as e:
            print(f"Translation via LLM failed: {e}")
            
    if not is_translated:
        notice = f"\n\n*(Translation to {language} failed or skipped - displaying in English)*"
        translated_report = {
            "symptoms": content_to_translate["symptoms"] + notice,
            "organic_remedies": content_to_translate["organic_remedies"] + notice,
            "chemical_remedies": content_to_translate["chemical_remedies"] + notice,
            "soil_water_guidance": content_to_translate["soil_water_guidance"] + notice,
            "preventative_calendar": [item + notice for item in content_to_translate["preventative_calendar"]]
        }
        
    final_report = {
        "crop_name": state["crop_name"],
        "symptoms": translated_report["symptoms"],
        "diagnosed_diseases": state["diagnosed_diseases"],
        "organic_remedies": translated_report["organic_remedies"],
        "chemical_remedies": translated_report["chemical_remedies"],
        "soil_water_guidance": translated_report["soil_water_guidance"],
        "preventative_calendar": translated_report["preventative_calendar"],
        "language": language,
        "is_translated": is_translated,
        "original_symptoms": state["symptoms"],
        "original_organic_remedies": state["organic_remedies"]
    }
    
    return {**state, "final_report": final_report}

# Create Graph
workflow = StateGraph(CropState)
workflow.add_node("validate_inputs", validate_inputs)
workflow.add_node("image_analysis", image_analysis)
workflow.add_node("diagnose_disease", diagnose_disease)
workflow.add_node("generate_advisory", generate_advisory)
workflow.add_node("translate_advisory", translate_advisory)

workflow.set_entry_point("validate_inputs")
workflow.add_edge("validate_inputs", "image_analysis")
workflow.add_edge("image_analysis", "diagnose_disease")
workflow.add_edge("diagnose_disease", "generate_advisory")
workflow.add_edge("generate_advisory", "translate_advisory")
workflow.add_edge("translate_advisory", END)

compiled_workflow = workflow.compile()

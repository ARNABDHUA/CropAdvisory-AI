import os
import time
import asyncio
import httpx
import base64
from pydantic import BaseModel
from typing import Literal, Optional
from google import genai
from google.genai import types

class LlmSettings(BaseModel):
    provider: Literal["openai_custom", "gemini"] = "openai_custom"
    model: str = "Qwen3-30B-A3B"
    base_url: str = ""
    api_key: str = ""
    google_api_key: str = ""

# Standard HTTP client bypass for local tunnel domains
_http_client = httpx.Client(
    verify=False,
    headers={"bypass-tunnel-reminder": "true"}
)

def get_llm(settings: LlmSettings):
    if settings.provider == "gemini":
        raise ValueError("Gemini is handled by the direct Google GenAI client.")
    if settings.provider == "openai_custom":
        if not settings.api_key or settings.api_key == "abc-123":
            raise ValueError("Invalid or missing API Key for Custom OpenAI provider.")
        if not settings.base_url:
            raise ValueError("Missing base_url for Custom OpenAI provider.")
            
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.model or os.environ.get("CUSTOM_MODEL_NAME", "Qwen3-30B-A3B"),
            openai_api_key=settings.api_key,
            openai_api_base=settings.base_url,
            temperature=0,
            request_timeout=120,
            max_retries=1,
            http_client=_http_client,
            default_headers={"Authorization": f"Bearer {settings.api_key}"},
        )
    raise ValueError(f"Unknown LLM_PROVIDER: '{settings.provider}'.")

def get_gemini_client(settings: LlmSettings):
    api_key = settings.google_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Gemini API key is missing. Please set it in Settings.")
    return genai.Client(api_key=api_key)

def call_gemini(settings: LlmSettings, prompt: str, image_base64: Optional[str] = None) -> str:
    client = get_gemini_client(settings)
    raw_model = settings.model
    if not raw_model.startswith("gemini"):
        model_name = "gemini-2.0-flash"
    else:
        model_name = raw_model
    
    fallback_models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    models_to_try = [model_name] + [m for m in fallback_models if m != model_name]
    
    last_error = None
    for model in models_to_try:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if image_base64:
                    if "," in image_base64:
                        header, data = image_base64.split(",", 1)
                    else:
                        header, data = "", image_base64
                        
                    mime_type = "image/jpeg"
                    if "png" in header:
                        mime_type = "image/png"
                    elif "webp" in header:
                        mime_type = "image/webp"
                        
                    image_bytes = base64.b64decode(data)
                    
                    response = client.models.generate_content(
                        model=model,
                        contents=[
                            types.Part.from_bytes(
                                data=image_bytes,
                                mime_type=mime_type,
                            ),
                            prompt
                        ]
                    )
                else:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                if model != model_name:
                    print(f"[Gemini] Fallback model '{model}' succeeded after '{model_name}' failed.")
                return response.text
            except Exception as e:
                err_str = str(e)
                last_error = e
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt * 15
                        print(f"[Gemini] Rate limit on '{model}'. Retry {attempt+1}/{max_retries} in {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        break
                elif "404" in err_str or "NOT_FOUND" in err_str:
                    print(f"[Gemini] Model '{model}' not found. Trying next fallback...")
                    break
                else:
                    raise
    raise last_error

def call_openai_custom(settings: LlmSettings, prompt: str, image_base64: Optional[str] = None) -> str:
    llm = get_llm(settings)
    from langchain_core.messages import HumanMessage
    
    if image_base64:
        if "," in image_base64:
            header, data = image_base64.split(",", 1)
        else:
            header, data = "", image_base64
            
        mime_type = "image/jpeg"
        if "png" in header:
            mime_type = "image/png"
        elif "webp" in header:
            mime_type = "image/webp"
            
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{data}"},
                },
            ]
        )
    else:
        message = HumanMessage(content=prompt)
        
    response = llm.invoke([message])
    return str(response.content)

def call_llm(settings: LlmSettings, prompt: str, image_base64: Optional[str] = None) -> str:
    """Wrapper that routes calls to Gemini or Custom OpenAI, and catches validation/auth errors
    to raise custom or descriptive errors.
    """
    if settings.provider == "gemini":
        return call_gemini(settings, prompt, image_base64)
    elif settings.provider == "openai_custom":
        return call_openai_custom(settings, prompt, image_base64)
    else:
        raise ValueError(f"Unsupported provider: {settings.provider}")


# Edge TTS voice mapping for supported languages
TTS_VOICE_MAP = {
    "english": "en-US-AvaNeural",
    "hindi": "hi-IN-SwaraNeural",
    "bengali": "bn-IN-TanishaaNeural",
    "spanish": "es-ES-ElviraNeural",
    "vietnamese": "vi-VN-HoaiMyNeural",
    "french": "fr-FR-DeniseNeural",
}


async def text_to_speech_async(text: str, language: str = "english") -> bytes:
    """Convert text to speech using Edge TTS. Returns MP3 audio bytes."""
    import edge_tts

    lang_lower = language.lower()
    voice = TTS_VOICE_MAP.get(lang_lower, TTS_VOICE_MAP["english"])

    # Clean text for TTS
    clean = text.replace("\n", " ").replace("\r", "").strip()

    communicate = edge_tts.Communicate(clean, voice)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data


def text_to_speech(text: str, language: str = "english") -> bytes:
    """Synchronous wrapper for text_to_speech_async."""
    import concurrent.futures

    with concurrent.futures.ThreadPoolExecutor() as pool:
        future = pool.submit(asyncio.run, text_to_speech_async(text, language))
        return future.result(timeout=30)

from typing import Any, Dict
from openai import AsyncOpenAI
import json
from .config import settings

# OpenRouter Compatible Client
client = AsyncOpenAI(
    base_url=settings.LLM_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY
)

async def generate_json(prompt: str, system_prompt: str = "出力はJSON形式にしてください。") -> Dict[str, Any]:
    """
    軽量モデルを使用して構造化データ（JSON）を抽出するための共通関数。
    """
    response = await client.chat.completions.create(
        model=settings.EXTRACTION_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"} if "gemini" in settings.EXTRACTION_MODEL.lower() or "gpt" in settings.EXTRACTION_MODEL.lower() else None,
        # OpenRouterの場合、モデルによっては response_format="json_object" をサポートしていないため、適宜調整が必要です。
    )

    raw_content = response.choices[0].message.content
    if not raw_content: return {} # Fallback
    
    # Simple JSON extraction helper in case the model wraps JSON in markdown block
    if raw_content.startswith("```json"):
        raw_content = raw_content.replace("```json", "").replace("```", "").strip()
    elif raw_content.startswith("```"):
        raw_content = raw_content.replace("```", "").strip()
        
    try:
        data = json.loads(raw_content)
        return data
    except json.JSONDecodeError:
        # Fallback handling might be needed in production
        print(f"[Error] Failed to parse JSON from LLM: {raw_content}")
        return {}

async def generate_text_stream(system_prompt: str, user_prompt: str):
    """
    長文記事生成等に使う高精度モデル用ストリーミングジェネレーター。
    """
    stream = await client.chat.completions.create(
        model=settings.GENERATION_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

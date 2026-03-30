from typing import List
from openai import AsyncOpenAI
from ..core.config import settings

# Embedding用のクライアント
# OpenRouterは Nomic Embed 等をサポートしますが、安定性のためにOpenAI公式キーがあればそちらを使えるようにします。
if settings.OPENAI_API_KEY:
    embed_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    DEFAULT_EMBED_MODEL = "text-embedding-3-small"
else:
    # OpenRouter経由のフォールバック (OpenRouter support openai embedding models)
    embed_client = AsyncOpenAI(
        base_url=settings.LLM_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY
    )
    DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small"

async def generate_embedding(text: str) -> List[float]:
    """
    入力テキストから1536次元(text-embedding-3-small前提)のベクトルを生成する。
    """
    try:
        response = await embed_client.embeddings.create(
            input=text,
            model=DEFAULT_EMBED_MODEL
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding Generation Failed: {e}")
        # エラー時は0埋めのフォールバックベクトルを返す(開発環境用)
        return [0.0] * 1536

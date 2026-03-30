import feedparser
from bs4 import BeautifulSoup
import hashlib
from typing import List, Optional
from ..core.llm import generate_json
from ..schemas.collection import AbstractWorryOutput

async def fetch_note_rss(hashtag: str, limit: int = 10) -> List[dict]:
    """
    指定ハッシュタグのnote RSS記事を取得し、HTMLタグを除去したプレーンテキストを返す。
    """
    url = f"https://note.com/hashtag/{hashtag}/rss"
    # To avoid blocking, feedparser performs synchronous IO, but it's acceptable for initial implementation.
    feed = feedparser.parse(url)
    
    articles = []
    for entry in feed.entries[:limit]:
        # summaryなどにHTMLが入るためBeautifulSoupでテキスト化
        raw_html = entry.get('summary', '') or entry.get('description', '')
        soup = BeautifulSoup(raw_html, "html.parser")
        plain_text = soup.get_text()[:1000] # トークン節約のため先頭1000文字に制限
        
        # タイトルと本文を結合してハッシュ化（重複排除用）
        content_hash = hashlib.sha256(f"{entry.link}".encode('utf-8')).hexdigest()
        
        articles.append({
            "title": entry.title,
            "link": entry.link,
            "published": entry.published,
            "content": plain_text,
            "hash": content_hash
        })
        
    return articles

async def analyze_and_extract_worry(text: str) -> Optional[str]:
    """
    軽量LLMに渡し、未解決の悩みか判定＋抽象化を行う。
    """
    prompt_text = f"対象テキスト:\n{text}"
    system_prompt = """あなたは優秀な心理アナリストです。与えられたSNSテキストを読み、以下のJSONフォーマットで回答してください。
{
  "is_unresolved_worry": true/false, // 投稿者が現在も抱えている「未解決の悩み・モヤモヤ」が含まれているか
  "is_actionable": true/false,       // 何らかの癒やしや励まし、行動提案が可能な内容か
  "abstract_worry": "抽象化された悩みの内容(例: 完璧主義で仕事が遅れてしまうことへの焦り)",
  "reason": "判定理由"
}
※ is_unresolved_worry が false の場合、abstract_worry は空文字で構いません。
※ 個人名や特定のサービス名は除外して抽象化してください。"""

    result = await generate_json(prompt_text, system_prompt)
    if not result:
        return None
        
    is_worry = result.get("is_unresolved_worry", False)
    is_actionable = result.get("is_actionable", False)
    
    if is_worry and is_actionable:
        return result.get("abstract_worry")
    
    return None

async def analyze_and_extract_experience(text: str) -> Optional[dict]:
    """
    SNSテキストから「生々しい人生経験・エピソード」を選別・クレンジングし、
    PII(個人情報)除去、毒性フィルタリング、および学習用データセット形式で抽出する。
    """
    prompt_text = f"対象テキスト:\n{text}"
    system_prompt = """あなたは極めて優秀なデータエンジニア兼、共感力の高いエッセイストです。与えられたSNSテキストから高品質な「人生経験データセット」を構築してください。

### 1. データのクレンジングと匿名化 (PII除去)
- 具体的な氏名、電話番号、詳細すぎる住所、会社名などは、必ず「Aさん」「〇〇市」「あるIT企業」のように一般化するかマスクしてください。
- HTMLタグやURL、意味のない記号などは除外してください。

### 2. 毒性・品質フィルタリング
- 単なる誹謗中傷、ヘイトスピーチ、過度な攻撃性、公序良俗に反する内容は `is_raw_experience=false` として除外してください。

### 3. データセットの構築 (Instruction-Outputペア)
抽出した実体験に基づき、以下のフォーマットで出力してください：

{
  "is_raw_experience": true/false,
  "experience_summary": "経験の要約（30文字以内）",
  "story_detail": "匿名化済みの生々しいエピソード（200文字程度）",
  "emotional_point": "感情のピークや気づき",
  "instruction_worry": "その経験が解決策になり得る、仮想の「相談者からの悩み・プロンプト」",
  "ideal_response": "その経験をベースにした、共感的で具体的な「お手本回答」。(例:『わかります。以前、似たようなケースで……』と実体験を交える)"
}
"""

    result = await generate_json(prompt_text, system_prompt)
    if not result or not result.get("is_raw_experience"):
        return None
        
    return {
        "experience_summary": result.get("experience_summary"),
        "story_detail": result.get("story_detail"),
        "emotional_point": result.get("emotional_point"),
        "instruction_worry": result.get("instruction_worry"),
        "ideal_response": result.get("ideal_response")
    }

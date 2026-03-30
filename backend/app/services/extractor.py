import os
import json
from typing import List, Dict, Any
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

async def extract_knowledge_from_text(text: str, enabled_categories: List[str] = None) -> List[Dict[str, Any]]:
    """
    与えられたテキストから、選択された複数のナレッジカテゴリを同時に抽出して、
    JSON形式で構造化データを抽出する。
    """
    if enabled_categories is None:
        enabled_categories = ["persona", "action", "mindfulness", "reframing", "copywriting", "format", "expression"]
        
    category_descriptions = {
        "astrology": "astrology: 星の動き、天体の意味、運命的なバイオリズム。形式: { 'astrology_type', 'theme_or_symbol', 'fatalistic_meaning', 'is_seasonal' }",
        "mindfulness": "mindfulness: 哲学的な考え方、心を整えるメソッド、抽象的な概念。形式: { 'philosophy_concept', 'encouragement_text' }",
        "empathy": "empathy: 特定の状況に対する共感の示し方、寄り添う言葉。形式: { 'abstract_situation', 'empathy_approach', 'warmth_level' }",
        "reframing": "reframing: ネガティブな事象をポジティブに捉え直す視点。形式: { 'negative_state', 'positive_perspective' }",
        "action": "action: 今すぐ実行できる具体的な小さな一歩、アドバイス。形式: { 'situation', 'small_step_proposal' }",
        "persona": "persona: 特定の語り口、性格的な特徴、大事にしている価値観。形式: { 'trait_name', 'trait_description', 'priority_order' }",
        "copywriting": "copywriting: 読者を惹きつける構成、タイトルの付け方、文章の型。形式: { 'structure_type', 'suggested_text_pattern' }",
        "format": "format: 段落の分け方、行の区切り方、強調記号の使い方など「文章の見た目・読みやすさの構成的な型」のみ。（読者のトーンや感情的な口調の模倣は含めないこと）。形式: { 'format_rule', 'layout_example' }",
        "expression": "expression: 表現ルール（文体・トーン）。読者の心に寄り添う温かい語り口や、逆に避けるべき不自然な自語り、論理の飛躍、抽象的すぎる言い回しなどの「品質・印象に関わる文体パターン」。形式: { 'style_pattern', 'preferred_style', 'rejection_reason' }"
    }
    
    active_descriptions = "\n".join([f"- {category_descriptions[cat]}" for cat in enabled_categories if cat in category_descriptions])
    
    system_prompt = f"""
あなたは、占い師やカウンセラーのための、高度な知識構造化エキスパートです。
与えられた長文テキストを詳細に分析し、その中に含まれる「価値ある知恵」や「具体的な手法」を、以下の指定されたカテゴリにのみ分類・構造化して出力してください。
1つのテキストの中に複数の異なる知恵が含まれている場合は、それらをすべて個別の項目として抽出してください。
指定されていないカテゴリのデータは絶対に出力に含めないでください。

【抽出対象カテゴリと抽出ルール】
{active_descriptions}

【重要】
- 出力は必ず JSON 形式で、`items` というキーを持つリストにしてください。
- 1つの項目は `{{ "category": "カテゴリ名", "data": {{ そのカテゴリに応じた構造化データ }} }}` の形式にしてください。
- テキストを丸コピーするのではなく、エッセンスを「構造分解」して抽出してください。
"""

    user_prompt = f"以下のテキストから、指定されたカテゴリの知恵のみを抽出してください：\n\n{text}"

    try:
        response = client.chat.completions.create(
            model=os.getenv("EXTRACTION_MODEL", "stepfun/step-3.5-flash:free"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        print(f"DEBUG LLM RAW OUTPUT: {raw_content}")
        
        try:
            result = json.loads(raw_content)
        except json.JSONDecodeError:
            # Markdown block などのクリーニング
            cleaned = raw_content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            try:
                result = json.loads(cleaned.strip())
            except:
                print("Failed to parse cleaned JSON.")
                return []

        # 戻り値の正規化 (itemsキーがあるか、直接リストか)
        if isinstance(result, dict) and "items" in result:
            return result.get("items", [])
        elif isinstance(result, list):
            return result
        else:
            print(f"Unexpected JSON structure: {type(result)}")
            return [result] if isinstance(result, dict) else []
            
    except Exception as e:
        print(f"Extraction Error Details: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"AI解析中にエラーが発生しました: {str(e)}")

from typing import List
from sqlalchemy.orm import Session
from ..models.content import WorrySeed, BlogTopicCandidate
from ..core.llm import generate_json
from ..schemas.topic import TopicGenerationLLMOutput

def get_unused_worry_seeds(db: Session, limit: int = 5) -> List[WorrySeed]:
    """
    トピック未生成の悩みデータを取得する。
    """
    return db.query(WorrySeed)\
        .filter(WorrySeed.is_used == False)\
        .order_by(WorrySeed.created_at.desc())\
        .limit(limit)\
        .all()

async def generate_topics_from_seeds(db: Session, seeds: List[WorrySeed], theme_description: str = None) -> int:
    """
    抽出した悩みリストから、ブログのトピックタイトル案を3〜5個生成してDBに保存する。
    seeds が空の場合は汎用テーマをもとに生成する（フォールバック）。
    生成後はworry_seedsの `is_used` を True に更新する。
    """
    theme_directive = f"\n\n今回は以下のテーマ・方針に従ってタイトル案を作成してください：\n【指定テーマ・方針】\n{theme_description}\n" if theme_description else ""

    if seeds:
        worry_texts = "\n".join([f"- {s.abstract_worry}" for s in seeds])
        prompt = f"以下の「世の中の悩みリスト」を参考に、ブログ記事の魅力的な仮タイトルを3つ提案してください。{theme_directive}\n\n{worry_texts}"
    else:
        # seeds がない場合のフォールバック
        prompt = f"""働く大人たちが日常で感じる「言語化しづらいモヤモヤ」「人間関係の理不尽さ」「謎の気疲れ」などをテーマに、独自の鋭い人間観察と、少しドライで現実的な処世術（サボり方や逃げ方）を提示するエッセイ風ブログ記事の魅力的な仮タイトルを3つ提案してください。{theme_directive}"""

    system_prompt = """あなたは優秀なコンテンツディレクターです。与えられた悩みリストに基づいて、読者の心を動かすブログ記事のタイトル案を出力してください。
出力は以下のJSON形式を厳守してください。

{
  "topics": [
    {
      "topic_title": "タイトル"
    },
    ...
  ]
}

- 3件のタイトルを配列でまとめること。"""

    if not theme_description:
        system_prompt += "タイトルには「〜すべき」という説教臭さを出さず、温かい響きを持たせてください。"

    result = await generate_json(prompt, system_prompt)
    if not result or "topics" not in result:
        return 0

    topics_list = result["topics"]
    source_ids = [str(s.id) for s in seeds]
    
    # トピック候補をDBへ保存
    for topic_data in topics_list:
        title = topic_data.get("topic_title")
        if not title: continue
        
        new_topic = BlogTopicCandidate(
            topic_title=title,
            source_data_ids=source_ids,
            status="suggested"
        )
        db.add(new_topic)
        
    # seedsを使用済みに更新
    for s in seeds:
        s.is_used = True
        
    db.commit()
    return len(topics_list)

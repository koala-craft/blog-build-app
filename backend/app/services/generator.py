from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from ..models.content import BlogTopicCandidate, Article, ArticleVersion
from ..core.llm import generate_text_stream
from .retriever import retrieve_relevant_knowledge, get_active_persona, get_active_theme, retrieve_guardrails
from .prompt_builder import build_system_prompt

async def stream_article_generation(db: Session, topic_id: str, target_chars: int = 1500, is_paid: bool = False):
    """
    指定トピックに関連する情報を検索・組み立て、ストリーミングレスポンスを返す非同期ジェネレーター。
    完了時に Article テーブルへデータを保存する。
    """
    try:
        topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == UUID(topic_id)).first()
        print(f"[Generator] stream_article_generation start: topic_id={topic_id}, is_paid={is_paid}")
        if not topic:
            yield "Topic not found."
            return
    except Exception as e:
        print(f"[Generator] Error initializing: {e}")
        yield f"Error initializing: {e}"
        return

    try:
        # 3. ペルソナ・テーマ取得
        persona = get_active_persona(db)
        theme = get_active_theme(db)
        
        # 1. RAG検索
        # ペルソナ設定にある knowledge_settings を尊重する
        k_settings = persona.get("knowledge_settings")
        print(f"[Generator] Persona Knowledge Settings: {k_settings}")
        rag_data = await retrieve_relevant_knowledge(db, query=topic.topic_title, top_k=2, settings=k_settings)
        
        # 2. ガードレール（NG設定）取得
        guardrails = await retrieve_guardrails(db, query=topic.topic_title)
        
        # 4. システムプロンプト作成
        sys_prompt = build_system_prompt(persona, theme, rag_data, guardrails=guardrails, target_chars=target_chars, is_paid=is_paid)
        user_prompt = f"今回のブログのテーマ（仮タイトル）はこれです：「{topic.topic_title}」\nこの記事によって、読者の胸のつかえがスッと取れるような素敵な本文をお願いします。"
    except Exception as e:
        print(f"[Generator] Error during RAG/Prompt construction: {e}")
        yield f"Error during preparation: {e}"
        return
    
    # ストリーミングと保存テキストの蓄積
    full_text = ""
    async for chunk in generate_text_stream(sys_prompt, user_prompt):
        full_text += chunk
        yield chunk

    # 4. 生成完了時にDB保存
    used_knowledge_ids = []
    # 検索されたナレッジIDを配列化して記録 (RAG最適化/分析用)
    for cat, items in rag_data.items():
        for item in items:
            if "id" in item:
                used_knowledge_ids.append(str(item["id"]))

    try:
        new_version = ArticleVersion(
            topic_id=topic.id,
            content=full_text,
            version_number=1
        )
        db.add(new_version)
        topic.status = "drafting"
        db.commit()
        # Return the new version ID for frontend to track
        yield f"\n\n[VERSION_ID]: {new_version.id}"
    except Exception as e:
        print(f"ArticleVersion save failed: {e}")
        db.rollback()

REFINEMENT_PROMPTS = {
    "natural_fix": "文章全体の論理的なつながりや、全体的な文脈における整合性を『批判的な立場』で見極め、修正して。不自然な接続、前後の矛盾、文脈からのずれがあれば徹底的に直し、最初から最後まで納得感のある自然な流れへと再構成して。具体的事実に基づかない抽象的・文学的な比喩や、説教臭い定型文末は日常的な言葉に置き換えて。",
    "ai_correction": "AIっぽい言い回し（『…といえるでしょう』『…が大切です』など）を、より人間味のある口調に補正して。不自然な比喩も日常表現に置き換え、教訓めいた押し付けがましさを消して。",
    "readability_fix": "理解に時間がかかりそうな難解な表現や難しい漢字を、中学生でも理解できるような平易な言葉に修正して。読者が一読してスラスラと内容が頭に入ってくるような、極めてわかりやすさを重視した文章に整えて。",
    "push": "読者が『これ、私のことだ』『今まで感じていたものは、実は素晴らしい力だったんだ』と間接的に気づき、自分を肯定できる『背中押し』を構成して。直接的な断定は避け、特別な力が宿っている人の感覚や葛藤を描写することで自発的な気づきを誘導して。霊的な話を持ち出す場合は、重くなりすぎず『くすっ』と笑えるような軽やかでチャーミングな表現を心がけること。読み終わった後に、自分の感覚を信じて前向きになれるような納得感のある締めくくりにして。"
}

async def stream_article_refinement(db: Session, topic_id: str, parent_version_id: str, refinement_type: str):
    """
    既存のバージョンを元に、指定されたプロンプトでブラッシュアップを行う。
    結果は新しい ArticleVersion として保存される。
    """
    # topic_id, parent_version_id ともにUUIDキャスト
    from uuid import UUID
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == UUID(topic_id)).first()
    parent_version = db.query(ArticleVersion).filter(ArticleVersion.id == UUID(parent_version_id)).first()
    
    if not topic or not parent_version:
        print(f"[Generator] Error: Topic or Parent Version not found. Topic: {topic}, Version: {parent_version}")
        yield "Topic or Parent Version not found."
        return

    refinement_prompt = REFINEMENT_PROMPTS.get(refinement_type, refinement_type)
    
    # 1. ペルソナ・テーマ取得
    persona = get_active_persona(db)
    theme = get_active_theme(db)
    
    sys_prompt = f"あなたは最高峰のブログライターです。以下の文章を、指定された指示に従ってブラッシュアップしてください。\n\n【基本属性】\nペルソナ: {persona.get('name', 'Default')}\nテーマ: {theme.get('name', 'Default')}\n\n【指示】\n{refinement_prompt}"
    user_prompt = f"現在の本文はこちらです：\n\n{parent_version.content}\n\n修正後の本文のみを出力してください。"
    
    full_text = ""
    async for chunk in generate_text_stream(sys_prompt, user_prompt):
        full_text += chunk
        yield chunk

    # 履歴として保存
    try:
        new_version = ArticleVersion(
            topic_id=topic.id,
            content=full_text,
            parent_id=parent_version.id,
            refinement_prompt=refinement_type,
            version_number=parent_version.version_number + 1
        )
        db.add(new_version)
        db.commit()
        yield f"\n\n[VERSION_ID]: {new_version.id}"
    except Exception as e:
        print(f"ArticleVersion save failed: {e}")
        db.rollback()

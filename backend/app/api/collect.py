from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import asyncio
import json

from ..database import get_db
from ..models.content import WorrySeed
from ..models.knowledge import KnowledgeExperience
from ..schemas.collection import CollectRequest, CollectResponse
from ..services.collector import fetch_note_rss, analyze_and_extract_worry, analyze_and_extract_experience
from ..services.embedding import generate_embedding

router = APIRouter()

@router.post("/note")
async def collect_from_note(req: CollectRequest, db: Session = Depends(get_db)):
    """
    指定されたハッシュタグのnoteをRSSで取得し、未解決の悩みを抽出してDBへ保存するパイプライン。
    進捗をリアルタイムでストリーミングします。
    """
    async def event_generator():
        try:
            # 1. RSS取得開始
            yield json.dumps({"status": "progress", "progress": 5, "message": f"noteからハッシュタグ '#{req.hashtag}' の記事を検索中..."}) + "\n"
            articles = await fetch_note_rss(req.hashtag, req.limit)
            
            if not articles:
                yield json.dumps({"status": "done", "message": "対象記事が見つかりませんでした。", "data": {"processed": 0, "saved": 0}}) + "\n"
                return

            total_found = len(articles)
            yield json.dumps({"status": "progress", "progress": 10, "message": f"{total_found} 件の記事が見つかりました。解析を開始します..."}) + "\n"
            
            processed_count = 0
            saved_count = 0
            worry_seeds = []
            
            for i, article in enumerate(articles):
                # 進捗計算 (10% ~ 90% の間)
                current_percent = 10 + int((i / total_found) * 80)
                yield json.dumps({
                    "status": "progress", 
                    "progress": current_percent, 
                    "message": f"解析中 ({i+1}/{total_found}): {article['title']}",
                    "current_index": i + 1,
                    "total_count": total_found
                }) + "\n"
                
                # 重複チェック
                exists = db.query(WorrySeed).filter(WorrySeed.original_text_hash == article["hash"]).first()
                if exists:
                    processed_count += 1
                    continue
                    
                processed_count += 1
                abstracted = await analyze_and_extract_worry(article["content"])
                
                if abstracted:
                    new_seed = WorrySeed(
                        original_text_hash=article["hash"],
                        abstract_worry=abstracted,
                        source_tags=req.hashtag,
                        is_used=False
                    )
                    db.add(new_seed)
                    db.commit()
                    saved_count += 1
                    worry_seeds.append({
                        "abstracted_worry": abstracted,
                        "original_text": article["content"][:200] + ("..." if len(article["content"]) > 200 else "")
                    })
            
            # 完了
            yield json.dumps({
                "status": "done",
                "message": "収集が完了しました。", 
                "data": {
                    "processed": processed_count, 
                    "saved": saved_count,
                    "worry_seeds": worry_seeds
                }
            }) + "\n"

        except Exception as e:
            if db: db.rollback()
            yield json.dumps({"status": "error", "message": f"収集処理中にエラーが発生しました: {str(e)}"}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

@router.post("/experience")
async def collect_experience_from_note(req: CollectRequest, db: Session = Depends(get_db)):
    """
    noteから「人生経験」を抽出し、知識ベース(KnowledgeExperience)へ直接保存するパイプライン。
    """
    async def event_generator():
        try:
            yield json.dumps({"status": "progress", "progress": 5, "message": f"noteからハッシュタグ '#{req.hashtag}' の人生経験を検索中..."}) + "\n"
            articles = await fetch_note_rss(req.hashtag, req.limit)
            
            if not articles:
                yield json.dumps({"status": "done", "message": "対象記事が見つかりませんでした。", "data": {"processed": 0, "saved": 0}}) + "\n"
                return

            total_found = len(articles)
            yield json.dumps({"status": "progress", "progress": 10, "message": f"{total_found} 件の記事が見つかりました。抽出を開始します..."}) + "\n"
            
            processed_count = 0
            saved_count = 0
            
            for i, article in enumerate(articles):
                current_percent = 10 + int((i / total_found) * 80)
                yield json.dumps({
                    "status": "progress", 
                    "progress": current_percent, 
                    "message": f"抽出中 ({i+1}/{total_found}): {article['title']}",
                    "current_index": i + 1,
                    "total_count": total_found
                }) + "\n"
                
                # 重複チェック (WorrySeedと共通のハッシュを使うか、独自のSourceURLチェックを行う)
                exists = db.query(KnowledgeExperience).filter(KnowledgeExperience.source_url == article["link"]).first()
                if exists:
                    processed_count += 1
                    continue
                    
                processed_count += 1
                extracted = await analyze_and_extract_experience(article["content"])
                
                if extracted:
                    # 知識ベースへ直接保存
                    new_exp = KnowledgeExperience(
                        experience_summary=extracted["experience_summary"],
                        story_detail=extracted["story_detail"],
                        emotional_point=extracted["emotional_point"],
                        instruction_worry=extracted["instruction_worry"],
                        source_url=article["link"],
                        is_ng=False
                    )
                    
                    # ベクトル化 (検索精度向上のため、要約だけでなく相談内容も含める)
                    embed_text = f"{extracted['experience_summary']} {extracted['story_detail']} {extracted['instruction_worry']}"
                    vector = await generate_embedding(embed_text)
                    if vector:
                        new_exp.embedding = vector
                        
                    db.add(new_exp)
                    db.commit()
                    saved_count += 1
            
            yield json.dumps({
                "status": "done",
                "message": "人生経験の抽出が完了しました。", 
                "data": {
                    "processed": processed_count, 
                    "saved": saved_count
                }
            }) + "\n"

        except Exception as e:
            if db: db.rollback()
            yield json.dumps({"status": "error", "message": f"処理中にエラーが発生しました: {str(e)}"}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

@router.get("/")
async def get_worry_seeds(db: Session = Depends(get_db), limit: int = 100, offset: int = 0):
    """
    保存済みの「悩みの種」を履歴として取得します。
    """
    seeds = db.query(WorrySeed).order_by(WorrySeed.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "status": "success",
        "data": seeds
    }

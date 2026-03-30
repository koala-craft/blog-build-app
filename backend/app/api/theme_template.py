from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models.knowledge import KnowledgeTheme

router = APIRouter()


@router.get("/")
def list_themes(db: Session = Depends(get_db)):
    """全ブログテーマを一覧で返す"""
    themes = db.query(KnowledgeTheme).order_by(KnowledgeTheme.created_at.desc()).all()
    return {
        "status": "success",
        "data": [
            {
                "id": str(t.id),
                "theme_name": t.theme_name,
                "theme_description": t.theme_description,
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in themes
        ]
    }


@router.patch("/{theme_id}")
def update_theme(theme_id: UUID, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """テーマの名前・説明（プロンプト等）を更新する"""
    theme = db.query(KnowledgeTheme).filter(KnowledgeTheme.id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="テーマが見つかりません")

    if "theme_name" in payload and payload["theme_name"].strip():
        theme.theme_name = payload["theme_name"].strip()
    if "theme_description" in payload and payload["theme_description"].strip():
        theme.theme_description = payload["theme_description"].strip()

    db.commit()
    db.refresh(theme)

    return {"status": "success", "message": f"「{theme.theme_name}」を更新しました"}


@router.post("/")
def create_theme(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """新しいブログテーマを作成する"""
    name = payload.get("theme_name")
    description = payload.get("theme_description")

    if not name or not description:
        raise HTTPException(status_code=400, detail="theme_name と theme_description は必須です")

    new_theme = KnowledgeTheme(
        theme_name=name,
        theme_description=description,
        is_active=False
    )
    db.add(new_theme)
    db.commit()
    db.refresh(new_theme)

    return {
        "status": "success",
        "message": "テーマを作成しました",
        "data": {"id": str(new_theme.id), "theme_name": new_theme.theme_name}
    }


@router.post("/{theme_id}/activate")
def activate_theme(theme_id: UUID, db: Session = Depends(get_db)):
    """指定テーマを有効化し、他のテーマを全て無効化する（排他制御）"""
    # 全て無効化
    db.query(KnowledgeTheme).update({"is_active": False})

    # 対象を有効化
    theme = db.query(KnowledgeTheme).filter(KnowledgeTheme.id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="テーマが見つかりません")

    theme.is_active = True
    db.commit()

    return {"status": "success", "message": f"「{theme.theme_name}」を有効化しました"}


@router.post("/{theme_id}/deactivate")
def deactivate_theme(theme_id: UUID, db: Session = Depends(get_db)):
    """指定テーマを無効化する"""
    theme = db.query(KnowledgeTheme).filter(KnowledgeTheme.id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="テーマが見つかりません")

    theme.is_active = False
    db.commit()

    return {"status": "success", "message": f"「{theme.theme_name}」を無効化しました"}


@router.delete("/{theme_id}")
def delete_theme(theme_id: UUID, db: Session = Depends(get_db)):
    """テーマを削除する"""
    theme = db.query(KnowledgeTheme).filter(KnowledgeTheme.id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="テーマが見つかりません")

    db.delete(theme)
    db.commit()

    return {"status": "success", "message": "テーマを削除しました"}

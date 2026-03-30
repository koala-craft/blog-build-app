from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models.content import PersonaTemplate

router = APIRouter()


@router.get("/")
def list_templates(db: Session = Depends(get_db)):
    """全テンプレートを一覧で返す"""
    templates = db.query(PersonaTemplate).order_by(PersonaTemplate.created_at.desc()).all()
    return {
        "status": "success",
        "data": [
            {
                "id": str(t.id),
                "name": t.name,
                "system_prompt": t.system_prompt,
                "is_active": t.is_active,
                "knowledge_settings": t.knowledge_settings,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in templates
        ]
    }


@router.patch("/{template_id}")
def update_template(template_id: UUID, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """テンプレートの名前・プロンプト本文を更新する"""
    template = db.query(PersonaTemplate).filter(PersonaTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    if "name" in payload and payload["name"].strip():
        template.name = payload["name"].strip()
    if "system_prompt" in payload and payload["system_prompt"].strip():
        template.system_prompt = payload["system_prompt"].strip()
    if "knowledge_settings" in payload:
        template.knowledge_settings = payload["knowledge_settings"]

    db.commit()
    db.refresh(template)

    return {"status": "success", "message": f"「{template.name}」を更新しました"}


@router.post("/")
def create_template(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """新しいペルソナテンプレートを作成する"""
    name = payload.get("name")
    system_prompt = payload.get("system_prompt")

    if not name or not system_prompt:
        raise HTTPException(status_code=400, detail="name と system_prompt は必須です")

    new_template = PersonaTemplate(
        name=name,
        system_prompt=system_prompt,
        is_active=False,
        knowledge_settings=payload.get("knowledge_settings")
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return {
        "status": "success",
        "message": "テンプレートを作成しました",
        "data": {"id": str(new_template.id), "name": new_template.name}
    }


@router.post("/{template_id}/activate")
def activate_template(template_id: UUID, db: Session = Depends(get_db)):
    """指定テンプレートを有効化し、他のテンプレートを全て無効化する（排他制御）"""
    # 全て無効化
    db.query(PersonaTemplate).update({"is_active": False})

    # 対象を有効化
    template = db.query(PersonaTemplate).filter(PersonaTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    template.is_active = True
    db.commit()

    return {"status": "success", "message": f"「{template.name}」を有効化しました"}


@router.post("/{template_id}/deactivate")
def deactivate_template(template_id: UUID, db: Session = Depends(get_db)):
    """指定テンプレートを無効化する"""
    template = db.query(PersonaTemplate).filter(PersonaTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    template.is_active = False
    db.commit()

    return {"status": "success", "message": f"「{template.name}」を無効化しました"}


@router.delete("/{template_id}")
def delete_template(template_id: UUID, db: Session = Depends(get_db)):
    """テンプレートを削除する"""
    template = db.query(PersonaTemplate).filter(PersonaTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    db.delete(template)
    db.commit()

    return {"status": "success", "message": "テンプレートを削除しました"}

import sys
import os

# プロジェクトルートをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import engine
from app.models.base import Base
# 全てのモデルをインポートしてmetadataに認識させる
from app.models import knowledge, content

def reset_database():
    print("⚠️ データベースの全てのテーブルを削除しています...")
    Base.metadata.drop_all(bind=engine)
    print("✅ 削除完了。")
    
    print("🚀 最新のモデル定義に基づいてテーブルを再作成しています...")
    Base.metadata.create_all(bind=engine)
    print("✨ データベースの初期化が完了しました。")

if __name__ == "__main__":
    confirm = input("全てのデータを削除して初期化しますか？ (y/N): ")
    if confirm.lower() == 'y':
        reset_database()
    else:
        print("キャンセルされました。")

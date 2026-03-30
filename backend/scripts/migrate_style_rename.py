import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# DB接続設定（環境変数から取得。 SQLAlchemyの形式 +psycopg2 を除去）
DATABASE_URL_RAW = os.getenv("DATABASE_URL", "postgresql://ftuser:ftpassword@localhost:5432/fortunetelling")
DATABASE_URL = DATABASE_URL_RAW.replace("+psycopg2", "")

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Successfully connected to the database.")

        # 1. テーブル名のリネーム (knowledge_lexicon -> knowledge_style)
        # テーブルが存在する場合のみリネーム
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_lexicon');")
        if cur.fetchone()[0]:
            print("Renaming knowledge_lexicon to knowledge_style...")
            cur.execute("ALTER TABLE knowledge_lexicon RENAME TO knowledge_style;")
        
        # 2. カラム名のリネーム
        # knowledge_style テーブルに対して実行
        print("Updating columns in knowledge_style...")
        columns_to_rename = {
            "forbidden_word": "forbidden_pattern",
            "preferred_replacement": "preferred_style",
            "context_note": "rejection_reason"
        }
        
        for old_col, new_col in columns_to_rename.items():
            cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'knowledge_style' AND column_name = '{old_col}');")
            if cur.fetchone()[0]:
                print(f"Renaming column {old_col} to {new_col}...")
                cur.execute(f"ALTER TABLE knowledge_style RENAME COLUMN {old_col} TO {new_col};")
                # TypeをStringからTextに変更（長いパターンに対応するため）
                cur.execute(f"ALTER TABLE knowledge_style ALTER COLUMN {new_col} TYPE TEXT;")

        conn.commit()
        print("Migration completed successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrate()

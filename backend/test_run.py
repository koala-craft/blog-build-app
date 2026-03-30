import asyncio
import os
from dotenv import load_dotenv

# dotenv を先に読み込み
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# その後にモジュールを読み込む
from app.services.extractor import extract_knowledge_from_text

async def test_extractor():
    text = "失敗は成功のもと。まずはノートに感情を書き出してみよう。そうすれば解決策が見えてくるはずだ。"
    
    print("----- STARTING EXTRACT TEST -----")
    res = await extract_knowledge_from_text(text)
    print(f"----- END RESULT -----\n{res}")

if __name__ == "__main__":
    asyncio.run(test_extractor())

import urllib.request
import json

# Test list endpoint
req = urllib.request.Request("http://localhost:8000/api/persona-templates/")
with urllib.request.urlopen(req) as r:
    print("GET /api/persona-templates/:", r.getcode(), r.read().decode('utf8')[:100])

# Test create
data = json.dumps({"name": "テスト占い師", "system_prompt": "あなたは明るく前向きな占い師です。"}).encode('utf8')
req2 = urllib.request.Request("http://localhost:8000/api/persona-templates/", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req2) as r:
    body = r.read().decode('utf8')
    print("POST /api/persona-templates/:", r.getcode(), body[:200])
    created = json.loads(body)
    template_id = created.get("data", {}).get("id")

# Test activate
if template_id:
    req3 = urllib.request.Request(f"http://localhost:8000/api/persona-templates/{template_id}/activate", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req3) as r:
        print("POST activate:", r.getcode(), r.read().decode('utf8')[:100])

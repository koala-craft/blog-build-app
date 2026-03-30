import json
from typing import Dict, Any

def build_system_prompt(persona: Dict[str, Any], theme: Dict[str, Any], rag_data: Dict[str, Any], guardrails: list = None, target_chars: int = 1500, is_paid: bool = False) -> str:
    """
    RAGナレッジ、ペルソナ設定、テーマ（構成）設定を統合し、
    汎用的かつ堅牢なシステムプロンプトを構築する。
    """
    rag_context = json.dumps(rag_data, indent=2, ensure_ascii=False, default=str)

    # 1. ペルソナ定義（制約や禁止事項もこの中に含まれる前提）
    if persona.get("is_template"):
        persona_section = f"""【ペルソナ定義】\n{persona.get("system_prompt")}"""
    else:
        persona_section = f"""【ペルソナ定義】\n名前: {persona.get("name")}\n詳細・思考・ルール: {persona.get("description")}"""

    # 2. システムレベルのガードレール（文脈破綻の防止・フォーマット制約のみ）
    system_guardrails = """
【システム基本ルール（絶対厳守）】
- メタ発言の禁止：AIとしてのメタ発言（「承知しました」「〜について解説します」等の前置きや挨拶）は一切出力せず、本文のみを生成すること。
- RAGデータの自然な統合：提供された知識素材（RAG）をそのまま転記するのではなく、参照可能な要素があれば指定されたペルソナの知識や経験として自然な言葉に翻訳して組み込むこと。
- RAGは、内容を具体化できる場合にのみ補助として使用すること。無理に使用しない。
- 判断に迷った場合は以下の優先順位に従うこと：
  1. テーマの一貫性（最終的に必ず収束すること）
  2. ペルソナの思考・語りの自然さ
  3. 現実的な違和感のない内容
  4. 構成の整合性
  5. 表現の綺麗さや完成度
- 「自然さ」とは、思考の流れが感じられつつも、読み手が無理なく理解できる状態を指す
- 寄り道や揺れは許容されるが、伝達を阻害しない範囲に留めること
- 思考が広がる場合もあるが、最終的に読み手が大きく迷わない範囲に収まっていれば問題ない。

【出力前チェック（必須）】
以下に該当する場合は書き直すこと：

- 内容が抽象的で、物理的に状況が想像できない
- 「霧・光・波・闇」などの抽象自然表現を使っている
- 行動や感覚に落とせていない説明になっている

【原因の扱い方】
最初に「最も現実的な原因」を1つ選び、
そこを軸に話を展開すること。

霊的な視点は、
それだけでは説明しきれない場合のみ補足として使用する。

【原因の定義】

原因は以下のいずれかで説明すること：

- 身体状態（疲労・睡眠・緊張）
- 思考の使い方（考えすぎ・注意の分散）
- 環境（人・音・温度など）

※抽象的な概念（意味・価値観など）は原因として扱わない

【比喩の使用条件】

比喩は実際に身体で再現できる動作のみ使用可。
できない場合は使用しない。
"""

    # 2.5 動的ガードレールの構築
    dynamic_guardrail_section = ""
    if guardrails:
        dynamic_guardrail_section = "\n【追加の個別ルール / 禁止事項】\n"
        for gr in guardrails:
            cat = gr.get("category", "general")
            if cat == "style":
                # 表現スタイル（ガードレール）の場合は特別なフォーマット
                pattern = gr.get("style_pattern")
                preferred = gr.get("preferred_style")
                reason = gr.get("rejection_reason")
                line = f"- 表現の禁止パターン: 「{pattern}」は使用禁止。"
                if preferred:
                    line += f"代わりに「{preferred}」のようなスタイルを心がけること。"
                if reason:
                    line += f"（NG理由: {reason}）"
                dynamic_guardrail_section += line + "\n"
            else:
                # その他のカテゴリは汎用的な記述
                detail = gr.get("trait_description") or gr.get("format_rule") or gr.get("spiritual_message") or gr.get("encouragement_text") or gr.get("positive_perspective") or gr.get("small_step_proposal") or gr.get("suggested_text_pattern") or gr.get("layout_example")
                title = gr.get("trait_name") or gr.get("forbidden_word") or "NG設定"
                dynamic_guardrail_section += f"- {cat}に関する禁止事項: {title} ({detail})\n"

    # 2.6 表現スタイルの成功例 (Positive Styles from RAG)
    style_examples_section = ""
    style_items = rag_data.get("style", [])
    if style_items:
        style_examples_section = "\n【推奨される表現・語り口のお手本】\n"
        for s in style_items:
            pattern = s.get("style_pattern")
            pref = s.get("preferred_style")
            line = f"- 良い例: 「{pattern}」"
            if pref:
                line += f" （意識・補足: {pref}）"
            style_examples_section += line + "\n"

    # 2.7 生々しい人生経験の注入
    experience_section = ""
    experience_items = rag_data.get("experience", [])
    if experience_items:
        experience_section = "\n【参考とする生々しい人生経験・エピソード】\n"
        for exp in experience_items:
            summary = exp.get("experience_summary")
            detail = exp.get("story_detail")
            point = exp.get("emotional_point")
            experience_section += f"- {summary}: {detail}（気づき/感情: {point}）\n"

    # 3. 有料/無料の構造指定
    if is_paid:
        format_instruction = f"""【出力フォーマット（有料記事モード）】
以下の2部構成で出力してください。

■ 第1部（無料公開部分：導入）
- 分量の目安: 全体の約30〜35%（{int(target_chars * 0.33)}文字程度）。

■ 区切り（必ずこの1行のみを挿入）
[ここからは有料記事]

■ 第2部（有料部分：本題と結論）
- 分量の目安: 全体の残り約65〜70%（{int(target_chars * 0.67)}文字程度）。

合計目安: {target_chars}文字程度（前後10〜20%許容）。"""
    else:
        format_instruction = f"""【出力構成ルール（通常記事）】
指定された構成に従い、シームレスな1本の記事として出力してください。
【出力文字数の目安】{target_chars}文字程度（前後10〜20%を許容範囲とします）。"""

    structure_rule = """
【構成の扱いに関するルール】
- 構成は参考として扱うが、「テーマの核心」は必ず維持すること
- 順序の変更・統合・省略は可能
- 各段落はテーマとの関連が読み取れる形で配置すること
- 全体として自然な流れのある文章構造を作ること
- 話の起点は必ず「現実的に最も影響の大きい要因」に置くこと
- 説明は、読者が日常生活の中で具体的にイメージできる粒度にすること
- 抽象的な概念だけで完結させないこと
- 提案を行う場合は、1〜2個の具体的な行動レベルに留めること
"""

    # 最終的なプロンプトの組み上げ
    return f"""あなたは【ペルソナ定義】に基づいて思考・観察・表現を行う存在です。文章の完成度よりもペルソナの自然さを優先しつつ、読者が大きく流れを見失わない範囲で、思考の自然さを保ったまま表現してください。
{persona_section}

{system_guardrails}
{dynamic_guardrail_section}
{style_examples_section}
{experience_section}

{structure_rule}

【記事のテーマと構成】
タイトル案: {theme.get("title")}
構成の指示: 
{theme.get("structure")}

【知識素材(RAG)】
※以下は補助情報であり、必ずしも使用する必要はありません。
---
{rag_context}
---

上記の条件の中で優先順位に従い、テーマを見失わず、思考の流れを残したまま文章（マークダウン形式）を生成してください。
{format_instruction}
"""
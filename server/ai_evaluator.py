import os
from google import genai
from pydantic import BaseModel
import json


# 評価結果のスキーマを定義
class DateEvaluationResult(BaseModel):
    age_appropriateness_score: int
    cost_effectiveness_score: int
    creativity_score: int
    balance_score: int
    relationship_progress_score: int
    comment: str

# 評価結果のスキーマを定義
class DateEvaluationResult(BaseModel):
    age_appropriateness_score: int
    cost_effectiveness_score: int
    creativity_score: int
    balance_score: int
    relationship_progress_score: int
    comment: str

# AIデートプラン提案結果のスキーマを定義
class DatePlanSuggestion(BaseModel):
    plan_title: str
    plan_description: str
    estimated_cost: str
    duration: str
    tips: str

# APIキーを設定
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def evaluate_date_plan(plan: str):
    """
    Gemini APIを使ってデートプランを評価し、偏差値とコメントを生成する
    """
    # プロンプトをより厳密に修正
    prompt = f"""
      以下の詳細なデート情報を評価し、各項目別に0〜100点の範囲で点数をつけ、
      具体的な改善点や褒める点を含む200文字以内の短いコメント（comment）を生成してください。

      【評価項目と配点基準】
      1. age_appropriateness_score (年齢・職業適正度): 0-100点
         - 年齢と職業に応じた場所の適切性
         - デート相手の年齢層に合った活動内容

      2. cost_effectiveness_score (費用対効果): 0-100点
         - 年齢・職業を考慮した予算の妥当性
         - 費用に見合った体験価値

      3. creativity_score (創意工夫): 0-100点
         - プランの独創性・工夫
         - 相手を驚かせる要素や特別感

      4. balance_score (全体バランス): 0-100点
         - 時間配分の適切性
         - アクティビティの組み合わせバランス

      5. relationship_progress_score (関係性進展度): 0-100点
         - デート回数に応じた適切なプラン
         - 関係性の発展に寄与する内容

      点数については各項目で0-100点の範囲内で1点間隔での評価を行ってください。

      若干内容を鼻につくような感じ(煽る)で返答するようにしてください。話始めにちょっと聞いて！とか
      指摘の仕方は笑いを交えつつ、優しいが的確なものにしてください。ふざけた回答で構いません。
      あまり使用者が不愉快になると思われる文章の生成はしないように注意してください。

      ここからは厳重事項です。
      -内容について、卑猥な内容や不適切な表現は含めないでください。

      -また、プレーンテキスト内に卑猥な内容があった場合には、
      "エラーが発生したため、採点を行うことができません"と表示をしてください。

    ---
    デート詳細情報：
    {plan}
    """

    try:
        # Google Gemini APIクライアントを初期化
        client = genai.Client(api_key=GEMINI_API_KEY)

        # print("=== AI評価リクエスト送信 ===")
        # print(f"使用モデル: gemini-2.0-flash-exp")
        # print(f"プロンプト:\n{prompt}")
        # print("=" * 50)

        # 構造化出力を使用してリクエストを送信
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": DateEvaluationResult,
            },
        )

        # print("=== AI評価レスポンス受信 ===")
        # print(f"レスポンステキスト: {response.text}")
        # print(f"レスポンス全体: {response}")
        # print("=" * 50)

        # パースされたオブジェクトを取得
        result: DateEvaluationResult = response.parsed

        # print("=== パース済み結果 ===")
        # print(f"Score: {result.score}")
        # print(f"Comment: {result.comment}")
        # print("=" * 50)

        # Pydanticオブジェクトを辞書に変換して返す
        final_result = {
            "age_appropriateness_score": result.age_appropriateness_score,
            "cost_effectiveness_score": result.cost_effectiveness_score,
            "creativity_score": result.creativity_score,
            "balance_score": result.balance_score,
            "relationship_progress_score": result.relationship_progress_score,
            "comment": result.comment
        }

        # print("=== 最終返却値 ===")
        # print(f"最終結果: {final_result}")
        # print("=" * 50)

        return final_result

    except Exception as e:
        print(f"AI評価中にエラーが発生しました: {e}")
        # エラー時はデフォルトの値を返す
        return {
            "age_appropriateness_score": 50,
            "cost_effectiveness_score": 50,
            "creativity_score": 50,
            "balance_score": 50,
            "relationship_progress_score": 50,
            "comment": "AIによる評価中にエラーが発生しました。"
        }

def generate_date_plan_suggestion(user_input: str):
    """
    ユーザーの自由入力をもとにAIがデートプランを提案する
    """
    prompt = f"""
    あなたは百戦錬磨のデートプランナーです。
    以下のユーザーの要望をもとに、具体的で実用性の高いデートプランを提案してください。

    【提案に含める内容】
    1. plan_title: デートプランのタイトル（20文字以内）
    2. plan_description: 具体的なデートプランの詳細（300文字以内）
    3. estimated_cost: 推定費用（例：「1人5,000円〜8,000円」）
    4. duration: 所要時間（例：「3時間」「半日」「1日」）
    5. tips: デートを成功させるためのワンポイントアドバイス（100文字以内）

    ユーザーの要望が曖昧な場合は、一般的に人気のあるデートプランを提案してください。
    実在する場所や店舗がある場合は具体的な名前を含めて提案してください。
    季節や時期を考慮して適切なプランを提案してください。

    親しみやすく、楽しい口調で提案してください。

    厳重事項：
    - 不適切な内容や卑猥な表現は含めないでください
    - 実在しない場所や店舗名は使用しないでください
    - 安全で健全なデートプランのみ提案してください

    ユーザーの要望：
    {user_input}
    """

    try:
        # Google Gemini APIクライアントを初期化
        client = genai.Client(api_key=GEMINI_API_KEY)

        # 構造化出力を使用してリクエストを送信
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": DatePlanSuggestion,
            },
        )

        # パースされたオブジェクトを取得
        result: DatePlanSuggestion = response.parsed

        # Pydanticオブジェクトを辞書に変換して返す
        final_result = {
            "plan_title": result.plan_title,
            "plan_description": result.plan_description,
            "estimated_cost": result.estimated_cost,
            "duration": result.duration,
            "tips": result.tips
        }

        return final_result

    except Exception as e:
        print(f"AIデートプラン生成中にエラーが発生しました: {e}")
        # エラー時はデフォルトの値を返す
        return {
            "plan_title": "AIデートプラン生成エラー",
            "plan_description": "AIによるデートプラン生成中にエラーが発生しました。",
            "estimated_cost": "不明",
            "duration": "不明",
            "tips": "AIによるアドバイスが得られませんでした。"
        }

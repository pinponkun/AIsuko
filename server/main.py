from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import database as db # database.pyをインポート
import ai_evaluator # ai_evaluator.pyをインポート
import time
from janome.tokenizer import Tokenizer
# 追加
from fastapi import Query

# FastAPIアプリケーションを初期化
app = FastAPI()
tokenizer = Tokenizer(wakati=True)
ng_words = set()

# --- CORS設定 (変更なし) ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    with open("ng_words.txt", "r", encoding="utf-8") as f:
        ng_words = {line.strip() for line in f if line.strip()}
    print(f"NGワードを{len(ng_words)}件読み込みました。内容: {ng_words}") # ★ 内容を表示
except FileNotFoundError:
    print("ng_words.txt が見つかりません。")
    ng_words = set()

@app.on_event("startup")
def startup_event():
    """アプリケーション起動時にデータベースを初期化"""
    max_retries = 30
    for i in range(max_retries):
        try:
            print(f"データベース接続試行 {i+1}/{max_retries}")
            db.init_db()
            print("データベース初期化完了")
            break
        except Exception as e:
            print(f"データベース接続失敗: {e}")
            if i < max_retries - 1:
                time.sleep(1)
            else:
                print("データベース接続に失敗しました")
                raise


# --- リクエストボディの型定義 ---
class DatePlanRequest(BaseModel):
    age: str
    occupation: str
    gender: str
    date: str
    dayOfWeek: str
    timeOfDay: str
    dateNumber: str
    location: str
    cost: str
    additionalNotes: str

class CommentRequest(BaseModel):
    date_plan_id: int
    username: str
    comment: str

class CommentLikeRequest(BaseModel):
    comment_id: int
    device_id: str

class PlanLikeRequest(BaseModel):
    date_plan_id: int
    device_id: str

class AIDatePlanRequest(BaseModel):
    user_input: str

# --- APIエンドポイントの定義 (ここから変更) ---

@app.post("/api/dates")
def score_date_plan(request: DatePlanRequest):
    # ▼▼▼ すべての項目を結合する ▼▼▼
    # Pydanticモデルのすべての値を取得し、
    # " " (スペース)で区切って1つの長い文字列に結合します。
    all_values = request.model_dump().values()
    input_text = " ".join(all_values).strip()
    # ▲▲▲ 変更ここまで ▲▲▲

    # ▼▼▼ NGワードチェック ▼▼▼
    for ng_word in ng_words:
        if ng_word in input_text:
            print(f"NGワードを検出しました: {ng_word}")
            # ★ クライアントの入力が原因なので、status_code=400を返す
            raise HTTPException(status_code=400, detail="不適切な単語が含まれています。")
    # ▲▲▲ チェックここまで ▲▲▲
    try:
        print(f"受け取ったデートプラン: {request}")

        # デートプランの詳細情報を文字列として整理
        cost_display = f"{request.cost}円" if request.cost and request.cost != "0" else "0円"
        date_plan_text = f"""
        年齢: {request.age}歳
        職業: {request.occupation}
        性別: {request.gender}
        デート日時: {request.date} ({request.dayOfWeek}曜日) {request.timeOfDay}
        何回目: {request.dateNumber}回目
        費用: {cost_display}
        場所: {request.location}
        追記事項: {request.additionalNotes}
        """

        # --- ここからAI評価 ---
        # AI評価関数を呼び出し、複数項目の点数を取得
        ai_result = ai_evaluator.evaluate_date_plan(date_plan_text)

        # 各項目の点数を取得（エラー時にはデフォルト値0）
        age_appropriateness_score = ai_result.get("age_appropriateness_score", 0)
        cost_effectiveness_score = ai_result.get("cost_effectiveness_score", 0)
        creativity_score = ai_result.get("creativity_score", 0)
        balance_score = ai_result.get("balance_score", 0)
        relationship_progress_score = ai_result.get("relationship_progress_score", 0)
        comment = ai_result.get("comment", "評価コメントの取得に失敗しました。")

        # 総合点数を算出（偏差値計算前の暫定値）
        composite_score = db.calculate_composite_score(
        age_appropriateness_score, cost_effectiveness_score,
        creativity_score, balance_score, relationship_progress_score
        )
        # --- AI評価ここまで ---

        # データベースに保存
        plan_id = db.save_date_plan_detailed(
            date_plan_text,
            composite_score,  # 一旦は総合点数を保存、後で偏差値に更新
            comment,
            f"{request.age}歳",
            request.occupation,
            request.gender,
            f"{request.date} ({request.dayOfWeek}曜日) {request.timeOfDay}",
            f"{request.dateNumber}回目",
            request.location,
            cost_display,
            request.additionalNotes,
            age_appropriateness_score,
            cost_effectiveness_score,
            creativity_score,
            balance_score,
            relationship_progress_score
        )

        # 全プランの偏差値を再計算
        db.update_all_deviation_scores()

        # 再計算後の偏差値を取得
        final_ranking = db.get_ranking()
        final_score = 0  # デフォルト値
        for plan in final_ranking:
            if plan["id"] == plan_id:
                final_score = plan["score"]
                break

        return {
            "score": final_score,
            "comment": comment,
            "plan": date_plan_text,
            "detailed_scores": {
            "age_appropriateness": age_appropriateness_score,
            "cost_effectiveness": cost_effectiveness_score,
            "creativity": creativity_score,
            "balance": balance_score,
            "relationship_progress": relationship_progress_score
            }
        }
    except Exception as e:
        print(f"サーバー内部でエラーが発生: {e}")
        # ★ サーバー内部の問題なので、status_code=500を返す
        raise HTTPException(status_code=500, detail="サーバー内部でエラーが発生しました。")


@app.get("/api/dates/ranking")
def get_date_plan_ranking():
    """デートプランのランキングをDBから取得する"""
    ranking_data = db.get_ranking()
    return ranking_data

@app.post("/api/dates/{date_plan_id}/comments")
def add_comment(date_plan_id: int, request: CommentRequest):
    comment_text = request.comment.strip()

    # ▼▼▼ NGワードチェック ▼▼▼
    for ng_word in ng_words:
        if ng_word in comment_text:
            print(f"NGワードを検出しました: {ng_word}")
            raise HTTPException(status_code=400, detail="不適切な単語が含まれています。")
    # ▲▲▲ チェックここまで ▲▲▲

    print(f"受け取ったデートプラン: {request}")
    """デートプランにコメントを追加する"""

    try:
        db.save_user_comment(date_plan_id, request.username, request.comment)
        return {"message": "コメントが正常に投稿されました"}
    except Exception as e:
        print(f"コメント保存中にエラー: {e}")
        # 単純なJSONを返す代わりに、status_code=500のHTTPExceptionを発生させる
        raise HTTPException(status_code=500, detail="サーバー内部でエラーが発生しました。")

@app.get("/api/dates/{date_plan_id}/comments")
def get_comments(date_plan_id: int):
    """特定のデートプランのコメントを取得する"""
    try:
        comments = db.get_user_comments(date_plan_id)
        return {"comments": comments}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/comments/{comment_id}/like")
def toggle_comment_like(comment_id: int, request: CommentLikeRequest):
    """コメントのいいねを切り替える（いいね/いいね解除）"""
    try:
        # 既にいいね済みかチェック
        is_liked = db.check_comment_liked(comment_id, request.device_id)

        if is_liked:
            # いいね解除
            success = db.remove_comment_like(comment_id, request.device_id)
            if success:
                like_count = db.get_comment_like_count(comment_id)
                return {"message": "いいねを解除しました", "liked": False, "like_count": like_count}
            else:
                return {"error": "いいねの解除に失敗しました"}
        else:
            # いいね追加
            success = db.save_comment_like(comment_id, request.device_id)
            if success:
                like_count = db.get_comment_like_count(comment_id)
                return {"message": "いいねしました", "liked": True, "like_count": like_count}
            else:
                return {"error": "いいねの追加に失敗しました"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/comments/{comment_id}/like-status")
def get_comment_like_status(comment_id: int, device_id: str):
    """コメントのいいね状態を取得する"""
    try:
        is_liked = db.check_comment_liked(comment_id, device_id)
        like_count = db.get_comment_like_count(comment_id)
        return {"liked": is_liked, "like_count": like_count}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/plans/{date_plan_id}/like")
def toggle_plan_like(date_plan_id: int, request: PlanLikeRequest):
    """デートプランのいいねを切り替える（いいね/いいね解除）"""
    try:
        # 既にいいね済みかチェック
        is_liked = db.check_plan_liked(date_plan_id, request.device_id)

        if is_liked:
            # いいね解除
            success = db.remove_plan_like(date_plan_id, request.device_id)
            if success:
                like_count = db.get_plan_like_count(date_plan_id)
                return {"message": "いいねを解除しました", "liked": False, "like_count": like_count}
            else:
                return {"error": "いいねの解除に失敗しました"}
        else:
            # いいね追加
            success = db.save_plan_like(date_plan_id, request.device_id)
            if success:
                like_count = db.get_plan_like_count(date_plan_id)
                return {"message": "いいねしました", "liked": True, "like_count": like_count}
            else:
                return {"error": "いいねの追加に失敗しました"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/plans/{date_plan_id}/like-status")
def get_plan_like_status(date_plan_id: int, device_id: str):
    """デートプランのいいね状態を取得する"""
    try:
        is_liked = db.check_plan_liked(date_plan_id, device_id)
        like_count = db.get_plan_like_count(date_plan_id)
        return {"liked": is_liked, "like_count": like_count}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai-plan-suggestion")
def generate_ai_date_plan(request: AIDatePlanRequest):
    input_text = request.user_input.strip()

    # ▼▼▼ NGワードチェック ▼▼▼
    for ng_word in ng_words:
        if ng_word in input_text:
            print(f"NGワードを検出しました: {ng_word}")
            raise HTTPException(status_code=400, detail="不適切な単語が含まれています。")
    # ▲▲▲ チェックここまで ▲▲▲

    """AIによるデートプラン考案"""
    try:
        suggestion = ai_evaluator.generate_date_plan_suggestion(request.user_input)
        return suggestion
    except Exception as e:
        print(f"AIプラン考案中にエラー: {e}")
        raise HTTPException(status_code=500, detail="AIによるプランの考案に失敗しました。")


@app.get("/")
def read_root():
    return {"message": "デート偏差値測定APIへようこそ!"}


@app.get("/api/dates/search")
def search_dates(keyword: str = Query(...)):
    """キーワードに一致する投稿を検索して返す"""
    conn = db.get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT id, plan, score, comment, age, occupation, gender, date_time, date_number, location, cost, additional_notes
        FROM date_plans
        WHERE plan LIKE %s OR comment LIKE %s OR additional_notes LIKE %s
        ORDER BY score DESC
    """
    like = f"%{keyword}%"
    cur.execute(query, (like, like, like))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id": row[0],
            "plan": row[1],
            "score": row[2],
            "comment": row[3],
            "age": row[4],
            "occupation": row[5],
            "gender": row[6],
            "date_time": row[7],
            "date_number": row[8],
            "location": row[9],
            "cost": row[10],
            "additional_notes": row[11]
        } for row in rows
    ]

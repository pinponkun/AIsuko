import os
import mysql.connector
from dotenv import load_dotenv
import math

# .envファイルから環境変数を読み込む
load_dotenv()

# データベース接続情報
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")  # MySQLのデフォルトポート

def get_db_connection():
    """データベースへの接続を確立する"""
    conn = mysql.connector.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=int(DB_PORT)
    )
    return conn

def init_db():
    """データベースのテーブルを初期化する（存在しない場合のみ作成）"""
    conn = get_db_connection()
    cur = conn.cursor()

    # 既存のテーブルを削除（開発環境でのみ）
    cur.execute("DROP TABLE IF EXISTS comment_likes")
    cur.execute("DROP TABLE IF EXISTS plan_likes")
    cur.execute("DROP TABLE IF EXISTS user_comments")
    cur.execute("DROP TABLE IF EXISTS date_plans")

    cur.execute("""
        CREATE TABLE date_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plan TEXT NOT NULL,
            score INT NOT NULL,
            comment TEXT,
            age VARCHAR(50),
            occupation VARCHAR(100),
            gender VARCHAR(20),
            date_time VARCHAR(100),
            date_number VARCHAR(50),
            location VARCHAR(200),
            cost VARCHAR(100),
            additional_notes TEXT,
            age_appropriateness_score INT DEFAULT 50,
            cost_effectiveness_score INT DEFAULT 50,
            creativity_score INT DEFAULT 50,
            balance_score INT DEFAULT 50,
            relationship_progress_score INT DEFAULT 50,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ユーザーコメント用のテーブルを作成
    cur.execute("""
        CREATE TABLE user_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date_plan_id INT NOT NULL,
            username VARCHAR(100) NOT NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (date_plan_id) REFERENCES date_plans(id) ON DELETE CASCADE
        );
    """)

    # コメントのいいね機能用のテーブルを作成
    cur.execute("""
        CREATE TABLE comment_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            comment_id INT NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (comment_id) REFERENCES user_comments(id) ON DELETE CASCADE,
            UNIQUE KEY unique_device_comment_like (comment_id, device_id)
        );
    """)

    # デートプランのいいね機能用のテーブルを作成
    cur.execute("""
        CREATE TABLE plan_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date_plan_id INT NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (date_plan_id) REFERENCES date_plans(id) ON DELETE CASCADE,
            UNIQUE KEY unique_device_plan_like (date_plan_id, device_id)
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Database table initialized.")

def save_date_plan(plan: str, score: int, comment: str):
    """デートプランと評価をデータベースに保存する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO date_plans (plan, score, comment) VALUES (%s, %s, %s)",
        (plan, score, comment)
    )
    conn.commit()
    cur.close()
    conn.close()

def save_date_plan_detailed(plan: str, score: int, comment: str, age: str, occupation: str, gender: str,
                          date_time: str, date_number: str, location: str, cost: str, additional_notes: str,
                          age_appropriateness_score: int = 50, cost_effectiveness_score: int = 50,
                          creativity_score: int = 50, balance_score: int = 50, relationship_progress_score: int = 50):
    """デートプランと詳細情報、各項目の点数をデータベースに保存する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO date_plans
           (plan, score, comment, age, occupation, gender, date_time, date_number, location, cost, additional_notes,
            age_appropriateness_score, cost_effectiveness_score, creativity_score, balance_score, relationship_progress_score)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (plan, score, comment, age, occupation, gender, date_time, date_number, location, cost, additional_notes,
         age_appropriateness_score, cost_effectiveness_score, creativity_score, balance_score, relationship_progress_score)
    )
    plan_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()
    return plan_id

def get_ranking():
    """ランキングデータをデータベースから取得する（いいね数も含む）"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, plan, score, comment, age, occupation, gender, date_time, date_number, location, cost, additional_notes,
               age_appropriateness_score, cost_effectiveness_score, creativity_score, balance_score, relationship_progress_score
        FROM date_plans ORDER BY score DESC
    """)
    ranking = cur.fetchall()
    cur.close()
    conn.close()

    # 結果を辞書のリストに変換
    r = []
    plan_ids = [row[0] for row in ranking]

    # いいね数を一括取得
    likes_data = get_likes_for_plans(plan_ids)

    for row in ranking:
        plan_id = row[0]
        r.append({
            "id": plan_id,
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
            "additional_notes": row[11],
            "age_appropriateness_score": row[12],
            "cost_effectiveness_score": row[13],
            "creativity_score": row[14],
            "balance_score": row[15],
            "relationship_progress_score": row[16],
            "like_count": likes_data.get(plan_id, 0)
        })
    return r

def save_user_comment(date_plan_id: int, username: str, comment: str):
    """ユーザーコメントをデータベースに保存する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO user_comments (date_plan_id, username, comment) VALUES (%s, %s, %s)",
        (date_plan_id, username, comment)
    )
    conn.commit()
    cur.close()
    conn.close()

def get_user_comments(date_plan_id: int):
    """特定のデートプランに対するユーザーコメントを取得する（いいね数も含む）"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, username, comment, created_at
        FROM user_comments
        WHERE date_plan_id = %s
        ORDER BY created_at DESC
    """, (date_plan_id,))
    comments = cur.fetchall()
    cur.close()
    conn.close()

    # 結果を辞書のリストに変換
    comment_list = []
    comment_ids = [row[0] for row in comments]

    # いいね数を一括取得
    likes_data = get_likes_for_comments(comment_ids)

    for row in comments:
        comment_id = row[0]
        comment_list.append({
            "id": comment_id,
            "username": row[1],
            "comment": row[2],
            "created_at": row[3].strftime("%Y-%m-%d %H:%M:%S") if row[3] else None,
            "like_count": likes_data.get(comment_id, 0)
        })
    return comment_list

def calculate_deviation_score(scores, target_score):
    """
    偏差値を計算する関数
    scores: 全体のスコアリスト
    target_score: 対象のスコア
    """
    if len(scores) <= 1:
        return 50  # データが1件以下の場合はデフォルト値

    mean = sum(scores) / len(scores)
    variance = sum((score - mean) ** 2 for score in scores) / len(scores)
    std_dev = math.sqrt(variance)

    if std_dev == 0:
        return 50  # 標準偏差が0の場合（全て同じ値）はデフォルト値

    deviation_score = 50 + (target_score - mean) / std_dev * 10

    # 偏差値は通常25〜75の範囲に収める（極端な値を制限）
    return max(25, min(75, int(round(deviation_score))))

def calculate_composite_score(age_score, cost_score, creativity_score, balance_score, relationship_score):
    """
    複数項目の点数から総合点数を算出する関数
    各項目に重み付けを行い、総合点数を計算
    """
    # 重み付け（合計1.0になるよう調整）
    weights = {
        'age_appropriateness': 0.2,
        'cost_effectiveness': 0.2,
        'creativity': 0.25,
        'balance': 0.2,
        'relationship_progress': 0.15
    }

    composite_score = (
        age_score * weights['age_appropriateness'] +
        cost_score * weights['cost_effectiveness'] +
        creativity_score * weights['creativity'] +
        balance_score * weights['balance'] +
        relationship_score * weights['relationship_progress']
    )

    return int(round(composite_score))

def update_all_deviation_scores():
    """
    全てのデートプランの偏差値を再計算・更新する関数
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # 全てのプランのデータを取得
    cur.execute("""
        SELECT id, age_appropriateness_score, cost_effectiveness_score,
               creativity_score, balance_score, relationship_progress_score
        FROM date_plans
    """)
    all_plans = cur.fetchall()

    if not all_plans:
        cur.close()
        conn.close()
        return

    # 各項目ごとのスコアリストを作成
    age_scores = [plan[1] for plan in all_plans]
    cost_scores = [plan[2] for plan in all_plans]
    creativity_scores = [plan[3] for plan in all_plans]
    balance_scores = [plan[4] for plan in all_plans]
    relationship_scores = [plan[5] for plan in all_plans]

    # 総合点数を計算して偏差値を算出
    composite_scores = []
    plan_data = []

    for plan in all_plans:
        plan_id = plan[0]
        composite_score = calculate_composite_score(plan[1], plan[2], plan[3], plan[4], plan[5])
        composite_scores.append(composite_score)
        plan_data.append((plan_id, composite_score))

    # 各プランの偏差値を計算・更新
    for plan_id, composite_score in plan_data:
        deviation_score = calculate_deviation_score(composite_scores, composite_score)
        cur.execute(
            "UPDATE date_plans SET score = %s WHERE id = %s",
            (deviation_score, plan_id)
        )

    conn.commit()
    cur.close()
    conn.close()
    print(f"Updated deviation scores for {len(plan_data)} plans")

def save_comment_like(comment_id: int, device_id: str):
    """コメントにいいねを追加する（端末ごとに1回のみ）"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO comment_likes (comment_id, device_id) VALUES (%s, %s)",
            (comment_id, device_id)
        )
        conn.commit()
        return True
    except mysql.connector.IntegrityError:
        # 既にいいね済みの場合
        return False
    finally:
        cur.close()
        conn.close()

def remove_comment_like(comment_id: int, device_id: str):
    """コメントからいいねを削除する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM comment_likes WHERE comment_id = %s AND device_id = %s",
        (comment_id, device_id)
    )
    affected_rows = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return affected_rows > 0

def get_comment_like_count(comment_id: int):
    """特定のコメントのいいね数を取得する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM comment_likes WHERE comment_id = %s",
        (comment_id,)
    )
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count

def check_comment_liked(comment_id: int, device_id: str):
    """ユーザーが特定のコメントをいいね済みかチェックする"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM comment_likes WHERE comment_id = %s AND device_id = %s",
        (comment_id, device_id)
    )
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count > 0

def get_likes_for_comments(comment_ids: list):
    """複数のコメントのいいね数を一括取得する"""
    if not comment_ids:
        return {}

    conn = get_db_connection()
    cur = conn.cursor()
    placeholders = ','.join(['%s'] * len(comment_ids))
    cur.execute(
        f"SELECT comment_id, COUNT(*) FROM comment_likes WHERE comment_id IN ({placeholders}) GROUP BY comment_id",
        comment_ids
    )
    likes_data = cur.fetchall()
    cur.close()
    conn.close()

    # 辞書形式で返す（コメントIDがキー、いいね数が値）
    likes_dict = {comment_id: 0 for comment_id in comment_ids}  # 初期化
    for comment_id, count in likes_data:
        likes_dict[comment_id] = count

    return likes_dict

def save_plan_like(date_plan_id: int, device_id: str):
    """デートプランにいいねを追加する（端末ごとに1回のみ）"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO plan_likes (date_plan_id, device_id) VALUES (%s, %s)",
            (date_plan_id, device_id)
        )
        conn.commit()
        return True
    except mysql.connector.IntegrityError:
        # 既にいいね済みの場合
        return False
    finally:
        cur.close()
        conn.close()

def remove_plan_like(date_plan_id: int, device_id: str):
    """デートプランからいいねを削除する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM plan_likes WHERE date_plan_id = %s AND device_id = %s",
        (date_plan_id, device_id)
    )
    affected_rows = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return affected_rows > 0

def get_plan_like_count(date_plan_id: int):
    """特定のデートプランのいいね数を取得する"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM plan_likes WHERE date_plan_id = %s",
        (date_plan_id,)
    )
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count

def check_plan_liked(date_plan_id: int, device_id: str):
    """ユーザーが特定のデートプランをいいね済みかチェックする"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM plan_likes WHERE date_plan_id = %s AND device_id = %s",
        (date_plan_id, device_id)
    )
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count > 0

def get_likes_for_plans(plan_ids: list):
    """複数のデートプランのいいね数を一括取得する"""
    if not plan_ids:
        return {}

    conn = get_db_connection()
    cur = conn.cursor()
    placeholders = ','.join(['%s'] * len(plan_ids))
    cur.execute(
        f"SELECT date_plan_id, COUNT(*) FROM plan_likes WHERE date_plan_id IN ({placeholders}) GROUP BY date_plan_id",
        plan_ids
    )
    likes_data = cur.fetchall()
    cur.close()
    conn.close()

    # 辞書形式で返す（プランIDがキー、いいね数が値）
    likes_dict = {plan_id: 0 for plan_id in plan_ids}  # 初期化
    for plan_id, count in likes_data:
        likes_dict[plan_id] = count

    return likes_dict
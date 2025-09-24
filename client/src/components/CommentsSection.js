import React, { useState, useEffect, useCallback } from 'react';
import CommentLikeButton from './CommentLikeButton';

function CommentsSection({ dateplanId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState(false);

  // コメントを取得する関数
  const fetchComments = useCallback(async () => {
    if (!dateplanId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/dates/${dateplanId}/comments`);
      if (!response.ok) throw new Error('コメントの取得に失敗しました');
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [dateplanId]);

  // コメントを投稿する関数
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !username.trim()) {
      setError('ユーザー名とコメントを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/dates/${dateplanId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_plan_id: dateplanId,
          username: username.trim(),
          comment: newComment.trim(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          // NGワードエラーの場合
          throw new Error(errorData.detail || '入力内容が正しくありません。');
        } else {
          // その他のサーバーエラーの場合
          throw new Error('サーバーで問題が発生しました。');
        }
      }

      if (!response.ok) throw new Error('コメントの投稿に失敗しました');
      
      setNewComment('');
      setError('');
      fetchComments(); // コメントを再取得
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // dateplanId が変更されたときにコメントを取得
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (!dateplanId) {
    return (
      <div className="comments-section">
        <h3>💬 コメント</h3>
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          ランキングからデートプランを選択してコメントを表示
        </p>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <h3>💬 コメント ({comments.length})</h3>
      
      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmitComment} className="comments-form">
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => {setUsername(e.target.value);
              if (inputError) setInputError(false);
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="コメントを入力してください..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)
            }
            rows="3"
            
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '投稿中...' : 'コメント投稿'}
        </button>
      </form>

      {/* エラー表示 */}
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* コメント一覧 */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            まだコメントがありません。最初のコメントを投稿してみましょう！
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-username">@{comment.username}</span>
                <span className="comment-time">{comment.created_at}</span>
              </div>
              <p className="comment-text">{comment.comment}</p>
              {/* いいねボタンを追加 */}
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <CommentLikeButton 
                  commentId={comment.id} 
                  initialLikeCount={comment.like_count || 0}
                  onLikeChange={(liked, newCount) => {
                    // コメントデータを更新
                    setComments(prevComments => 
                      prevComments.map(c => 
                        c.id === comment.id 
                          ? { ...c, like_count: newCount }
                          : c
                      )
                    );
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentsSection;

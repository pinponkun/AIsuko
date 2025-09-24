import React, { useState, useEffect } from 'react';
import { getDeviceId } from '../utils/deviceId';

function CommentLikeButton({ commentId, initialLikeCount = 0, onLikeChange }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // コンポーネントマウント時にいいね状態を取得
    const fetchLikeStatus = async () => {
      try {
        const deviceId = getDeviceId();
        const response = await fetch(
          `http://localhost:8000/api/comments/${commentId}/like-status?device_id=${encodeURIComponent(deviceId)}`
        );
        if (response.ok) {
          const data = await response.json();
          setLiked(data.liked);
          setLikeCount(data.like_count);
        }
      } catch (error) {
        console.error('いいね状態の取得に失敗しました:', error);
      }
    };

    fetchLikeStatus();
  }, [commentId]);

  const handleLikeToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          device_id: deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.like_count);
        
        // 親コンポーネントに変更を通知
        if (onLikeChange) {
          onLikeChange(data.liked, data.like_count);
        }
      } else {
        console.error('いいねの切り替えに失敗しました');
      }
    } catch (error) {
      console.error('いいねの切り替えでエラーが発生しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      style={{
        background: 'none',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: liked ? '#e91e63' : '#666',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: '#f5f5f5'
        }
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.target.style.backgroundColor = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span>{likeCount}</span>
    </button>
  );
}

export default CommentLikeButton;

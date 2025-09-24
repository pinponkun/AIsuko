import React, { useState, useEffect } from 'react';
import { getDeviceId } from '../utils/deviceId';
import styles from './PlanLikeButton.module.css';

function PlanLikeButton({ planId, initialLikeCount = 0, onLikeChange }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // コンポーネントマウント時にいいね状態を取得
    const fetchLikeStatus = async () => {
      try {
        const deviceId = getDeviceId();
        const response = await fetch(
          `http://localhost:8000/api/plans/${planId}/like-status?device_id=${encodeURIComponent(deviceId)}`
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
  }, [planId]);

  const handleLikeToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const response = await fetch(`http://localhost:8000/api/plans/${planId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_plan_id: planId,
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
      className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
    >
      <span className={styles.heart}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span>{likeCount}</span>
    </button>
  );
}

export default PlanLikeButton;

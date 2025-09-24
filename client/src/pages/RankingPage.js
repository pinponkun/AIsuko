import React, { useState, useEffect } from 'react';
import PlanLikeButton from '../components/PlanLikeButton';
import styles from './RankingPage.module.css';

// ★ propsで selectedPost と setSelectedPost を受け取る
function RankingPage({ selectedPost, setSelectedPost }) {
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dates/ranking');
        if (!response.ok) throw new Error('データの取得に失敗しました。');
        const data = await response.json();
        console.log(data);
        setRanking(data);
        if (data.length > 0) {
          // ★ 親のStateを更新する
          setSelectedPost(data[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanking();
    // ★ useEffectの依存配列にsetSelectedPostを追加
  }, [setSelectedPost]);


  if (isLoading) return <div className={styles.timeline}><p>ランキングを読み込み中...</p></div>;
  if (error) return <div className={styles.timeline}><p style={{color: 'red'}}>{error}</p></div>;

  return (
    <div className="timeline">
      <header className="timeline-header">
        <h2>殿堂入りランキング 🏆</h2>
      </header>
      <div className="tweet-feed">
        {ranking.map((item, index) => (
          <article
            // ★ 親から渡された関数を呼び出す
            onClick={() => setSelectedPost(item)}
            // ★ 選択状態の判定を修正
            className={`tweet ${selectedPost && selectedPost.id === item.id ? 'selected' : ''}`}
            key={item.id}
          >
            <div className="tweet-content">
              <h3><span style={{color: 'gold'}}>🏆</span> 第{index + 1}位 (偏差値: {item.score})</h3>

              {/* 詳細点数表示 */}
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  <span>年齢適正: {item.age_appropriateness_score || 0}点</span>
                  <span>費用効果: {item.cost_effectiveness_score || 0}点</span>
                  <span>創意工夫: {item.creativity_score || 0}点</span>
                  <span>バランス: {item.balance_score || 0}点</span>
                  <span>関係進展: {item.relationship_progress_score || 0}点</span>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{item.plan}</pre>
              </div>
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#333' }}>
                <strong>コメント:</strong> {item.comment}
              </p>

              {/* いいねボタンを追加 */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                <PlanLikeButton
                  planId={item.id}
                  initialLikeCount={item.like_count || 0}
                  onLikeChange={(liked, newCount) => {
                    // ランキングデータを更新
                    setRanking(prevRanking =>
                      prevRanking.map(rank =>
                        rank.id === item.id
                          ? { ...rank, like_count: newCount }
                          : rank
                      )
                    );
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default RankingPage;
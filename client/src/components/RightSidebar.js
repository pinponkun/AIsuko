import React from 'react';
import CommentsSection from './CommentsSection';
import styles from './RightSidebar.module.css'; // Assuming the CSS module is named RightSidebar.module.css

// ★ propsとしてpostを受け取る
function RightSidebar({ post }) {
  // postが選択されていない（ランキングページ以外）の場合は何も表示しない
  if (!post) {
    return <aside className={styles.rightSidebar}></aside>;
  }

  // postが選択されている場合の表示
  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.widget}>
        <h3>プラン詳細 (偏差値: {post.score})</h3>

        {/* 詳細点数表示 */}
        <div className={styles.detailScoreBox}>
          <h4 className={styles.detailScoreTitle}>📊 詳細評価</h4>
          <div className={styles.detailScoreGrid}>
            <span>年齢・職業適正: {post.age_appropriateness_score || 50}点</span>
            <span>費用対効果: {post.cost_effectiveness_score || 50}点</span>
            <span>創意工夫: {post.creativity_score || 50}点</span>
            <span>全体バランス: {post.balance_score || 50}点</span>
            <span>関係性進展: {post.relationship_progress_score || 50}点</span>
          </div>
        </div>

        <h4>📝 投稿内容</h4>
        <p>{post.plan}</p>
        <h4>🤖 AIからのコメント</h4>
        <p>{post.comment}</p>
        <CommentsSection dateplanId={post.id} />
      </div>
      {/* ...sidebarSectionなどはそのまま... */}
    </aside>
  );
}

export default RightSidebar;
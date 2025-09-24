import React from 'react';
import './ResultPopup.css';

function ResultPopup({ result, formData, onClose }) {
  if (!result) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content">
        <div className="popup-header">
          <h3>評価結果</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="popup-body">
          <div style={{ marginBottom: '20px' }}>
            <strong>あなたのデート情報:</strong>
            <ul style={{ marginTop: '10px', lineHeight: '1.6' }}>
              <li>年齢: {formData.age}歳</li>
              <li>職業: {formData.occupation}</li>
              <li>性別: {formData.gender}</li>
              <li>日時: {formData.date} ({formData.dayOfWeek}曜日) {formData.timeOfDay}</li>
              <li>回数: {formData.dateNumber}回目</li>
              <li>費用: {formData.cost ? `${formData.cost}円` : '0円'}</li>
              <li>場所: {formData.location}</li>
              {formData.additionalNotes && <li>追記事項: {formData.additionalNotes}</li>}
            </ul>
          </div>

          <div className="score-section">
            <p>
              <strong>デート偏差値:</strong>{' '}
              <span className="main-score">{result.score}</span>
            </p>
          </div>

          {/* 詳細スコア表示 */}
          {result.detailed_scores && (
            <div className="detailed-scores">
              <strong>詳細スコア:</strong>
              <div className="scores-grid">
                <div className="score-item">
                  <div className="score-label">年齢適合性</div>
                  <div className="score-value">
                    {result.detailed_scores.age_appropriateness}/100
                  </div>
                </div>
                <div className="score-item">
                  <div className="score-label">コストパフォーマンス</div>
                  <div className="score-value">
                    {result.detailed_scores.cost_effectiveness}/100
                  </div>
                </div>
                <div className="score-item">
                  <div className="score-label">創造性</div>
                  <div className="score-value">
                    {result.detailed_scores.creativity}/100
                  </div>
                </div>
                <div className="score-item">
                  <div className="score-label">バランス</div>
                  <div className="score-value">
                    {result.detailed_scores.balance}/100
                  </div>
                </div>
                <div className="score-item">
                  <div className="score-label">関係性進展度</div>
                  <div className="score-value">
                    {result.detailed_scores.relationship_progress}/100
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="comment-section">
            <p><strong>AIからのコメント:</strong></p>
            <p className="ai-comment">{result.comment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultPopup;

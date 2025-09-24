import React, { useState, useEffect, useCallback } from 'react';
import styles from './AIPlanPage.module.css'; 

console.log('CSS Modules', styles);


function AIPlanPage() {
  const [userInput, setUserInput] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState(false);

  const handleChange = (e) => {
    setUserInput(e.target.value);
    // ユーザーが文字入力を再開したら、エラー表示を解除
    if (inputError) {
      setInputError(false);
    }
  };

  // ★ 1. 音声読み上げを制御する関数を定義
  const handleSpeak = useCallback((textToSpeak) => {
    // ブラウザが音声合成に対応しているかチェック
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 既存の読み上げがあればキャンセル
      
      // 読み上げる内容と設定を作成
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP'; // 言語を日本語に設定
      utterance.rate = 1.1;      // 読み上げ速度
      
      // 読み上げを開始
      window.speechSynthesis.speak(utterance);
    }
  }, []); // この関数は再生成不要なので、依存配列は空

  // ★ 2. suggestionが更新されたら、自動で音読を開始するためのuseEffect
  useEffect(() => {
    // suggestionにデータがあり、読み込み中でないことを確認
    if (suggestion && !isLoading) {
      // プラン名とプラン詳細を繋げて、より自然な文章で読み上げる
      const textToRead = `AIからの提案です。プラン名は、${suggestion.plan_title}。プランの詳細は、${suggestion.plan_description}`;
      handleSpeak(textToRead);
    }
  }, [suggestion, isLoading, handleSpeak]); // suggestion, isLoading, handleSpeak が変更されたら実行

  // ★ 3. ページを離れる際に読み上げを停止するためのuseEffect
  useEffect(() => {
    // この関数はコンポーnentが画面から消えるときに実行される
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // 初回表示時と非表示時にのみ実行

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userInput.trim()) {
      setError('何かご要望を入力してください');
      setInputError(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestion(null);

    try {
      const response = await fetch('http://localhost:8000/api/ai-plan-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_input: userInput }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuggestion(data);
      }
    } catch (err) {
      setError('サーバーとの通信でエラーが発生しました');
      console.error('AI提案エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUserInput('');
    setSuggestion(null);
    setError('');
    setInputError(false);
  };

  return (
    <div className="timeline submission-page">
      <header className="timeline-header">
        <h2>AIデートプラン考案</h2>
      </header>

      <div className={styles.aiPlanContainer}>
        <p className={styles.pageDescription}>
          どんなデートをしたいか、自由に書いてください!AIがあなたにぴったりのデートプランを提案します。
        </p>
        <form onSubmit={handleSubmit} className={styles.aiPlanForm}>
          <div className={styles.formGroup}>
            <label htmlFor="user-input">ご要望・相談内容</label>
            <textarea
              id="user-input"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                // ユーザーが文字入力を再開したら、エラー表示を解除
                if (inputError) {
                  setInputError(false);
                }
              }}
              placeholder="例：初デート...雨の日...など自由にご記入ください"
              rows="8"
              className={styles.userInputTextarea}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !userInput.trim()}
            >
              {isLoading ? '考案中...' : 'AIに相談する✨'}
            </button>
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              disabled={isLoading}
            >
              クリア
            </button>
          </div>
        </form>

        {error && <div className={styles.errorMessage}>❌ {error}</div>}

        {suggestion && (
          <div className={styles.suggestionResult}>
            <h2>💡 AIからの提案</h2>
            <div className={styles.suggestionCard}>
              <h3 className={styles.planTitle}>📝 {suggestion.plan_title}</h3>

              <div className={styles.planDetails}>
                <div className={styles.detailSection}>
                  <h4>📋 プラン詳細</h4>
                  <p className={styles.planDescription}>{suggestion.plan_description}</p>
                </div>

                <div className={styles.planMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>💰 推定費用:</span>
                    <span className={styles.metaValue}>{suggestion.estimated_cost}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>⏰ 所要時間:</span>
                    <span className={styles.metaValue}>{suggestion.duration}</span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h4>💡 成功のコツ</h4>
                  <p className={styles.planTips}>{suggestion.tips}</p>
                </div>
              </div>
            </div>

            <div className={styles.suggestionActions}>
              <button className={styles.newSuggestionButton} onClick={handleClear}>
                新しい相談をする
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIPlanPage;

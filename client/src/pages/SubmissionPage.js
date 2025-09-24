import React, { useState, useEffect ,useCallback} from 'react';
import { NumberField, SelectField, TextAreaField, TextField } from '../components/FormFields';
import ResultPopup from '../components/ResultPopup';

function SubmissionPage() {
  const [formData, setFormData] = useState({
    age: '',
    occupation: '',
    gender: '',
    date: '',
    dayOfWeek: '',
    timeOfDay: '',
    dateNumber: '',
    location: '',
    cost: '',
    additionalNotes: ''
  });
  const [result, setResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

// ★ 2. 音声読み上げを制御する関数を定義
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

// ★ 3. resultが更新されたら、自動で音読を開始するためのuseEffect
useEffect(() => {
  // resultにデータがあり、ポップアップが表示されていることを確認
  if (result && showPopup) {
    // AIからのコメントを読み上げる
    handleSpeak(`AIからの評価です。${result.comment}`);
  }
}, [result, showPopup, handleSpeak]); // result, showPopup, handleSpeak が変更されたら実行

// ★ 4. ページを離れる際に読み上げを停止するためのuseEffect
useEffect(() => {
  // この関数はコンポーネントが画面から消えるときに実行される
  return () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
}, []); // 初回表示時と非表示時にのみ実行

  // デバッグ用：コンポーネントのマウント時とformDataの変更時にログ出力
  useEffect(() => {
    console.log('SubmissionPage mounted');
    console.log('Initial formData:', formData);
  }, [formData]);

  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };  const handleDateChange = (e) => {
    console.log('Date input value:', e.target.value); // デバッグログ

    if (!e.target.value) {
      // 空の値の場合
      setFormData(prev => ({
        ...prev,
        date: '',
        dayOfWeek: ''
      }));
      return;
    }

    try {
      const selectedDate = new Date(e.target.value + 'T00:00:00'); // タイムゾーンの問題を回避
      console.log('Selected date object:', selectedDate); // デバッグログ

      if (isNaN(selectedDate.getTime())) {
        console.error('Invalid date');
        return;
      }

      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = days[selectedDate.getDay()];
      console.log('Day of week:', dayOfWeek); // デバッグログ

      setFormData(prev => ({
        ...prev,
        date: e.target.value,
        dayOfWeek: dayOfWeek
      }));
    } catch (error) {
      console.error('Error processing date:', error);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 必須フィールドのチェック
    if (!formData.age || !formData.occupation || !formData.gender || !formData.date || !formData.timeOfDay || 
        !formData.dateNumber || !formData.location || formData.cost === '') {
      setError('必須項目をすべて入力してください。');
      return;
    }

    // 数値フィールドの検証
    if (isNaN(formData.age) || isNaN(formData.dateNumber) || isNaN(formData.cost)) {
      setError('年齢、デート回数、費用は数値で入力してください。');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch('/api/dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // ▼▼▼ ここからエラーハンドリングを修正 ▼▼▼
      if (!response.ok) {
        // レスポンスがOKでない場合 (ステータスコードが2xx以外)
        const errorData = await response.json();

        if (response.status === 400) {
          // ★ ステータスコードが400 (NGワード) の場合
          // バックエンドの detail メッセージを表示
          throw new Error(errorData.detail || '入力内容が正しくありません。');
        } else {
          // ★ それ以外のサーバーエラー (500など) の場合
          throw new Error('サーバーで問題が発生しました。');
        }
      }
      // ▲▲▲ 修正ここまで ▲▲▲

      const data = await response.json();
      setResult(data);
      setShowPopup(true);

    } catch (err) {
      setError(err.message);
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="timeline submission-page">
      <header className="timeline-header">
        <h2>デートプラン投稿</h2>
      </header>

      <div className="tweet-form-container">
        <form onSubmit={handleSubmit} className="tweet-form" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px', textAlign: 'left' }}>

            {/* 年齢入力 */}
            <NumberField
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              label="年齢"
              placeholder="例: 25"
              min="13"
              max="100"
            />

            {/* 職業選択 */}
            <SelectField
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              label="職業"
              options={[
                { value: '中学生', label: '中学生' },
                { value: '高校生', label: '高校生' },
                { value: '大学生', label: '大学生' },
                { value: '会社員', label: '会社員' },
                { value: '公務員', label: '公務員' },
                { value: 'フリーランス', label: 'フリーランス' },
                { value: '自営業', label: '自営業' },
                { value: '医療従事者', label: '医療従事者' },
                { value: '教職員', label: '教職員' },
                { value: 'その他', label: 'その他' }
              ]}
            />

            {/* 性別選択 */}
            <SelectField
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              label="性別"
              options={[
                { value: '男性', label: '男性' },
                { value: '女性', label: '女性' },
                { value: 'その他', label: 'その他' }
              ]}
            />

            {/* 日付選択 */}
            <div style={{ textAlign: 'left' }}>
              <label htmlFor="date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                デート日付
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleDateChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '2px solid #ccc',
                  fontSize: '16px',
                  backgroundColor: '#f9f9f9'
                }}
              />
              {formData.dayOfWeek && (
                <span style={{ fontSize: '12px', color: '#666', marginTop: '5px', display: 'block' }}>
                  曜日: {formData.dayOfWeek}曜日
                </span>
              )}
            </div>

            {/* 時間帯選択 */}
            <SelectField
              id="timeOfDay"
              name="timeOfDay"
              value={formData.timeOfDay}
              onChange={handleInputChange}
              label="時間帯"
              options={[
                { value: '朝', label: '朝（6:00-11:59）' },
                { value: '昼', label: '昼（12:00-17:59）' },
                { value: '夕方', label: '夕方（18:00-23:59）' },
                { value: '夜', label: '夜（0:00-5:59）' }
              ]}
            />

            {/* 何回目のデート */}
            <NumberField
              id="dateNumber"
              name="dateNumber"
              value={formData.dateNumber}
              onChange={handleInputChange}
              label="何回目のデートですか？"
              placeholder="例: 1"
              min="1"
              max="100"
            />

            {/* かかった費用 */}
            <NumberField
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              label="かかった費用（円）"
              placeholder="例: 3500"
              min="0"
            />

            {/* デート場所 */}
            <TextField
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              label="デート場所"
              placeholder="例: 映画館、公園、レストラン"
            />

            {/* 追記事項 */}
            <TextAreaField
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              label="追記事項"
              placeholder="例: 手をつないだ、キスをした、会話が弾んだ、緊張していた、など自由にお書きください"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#ccc' : 'var(--twitter-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '評価中...' : 'デート偏差値を測定'}
          </button>
        </form>
      </div>

      {/* エラー表示エリア */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}

      {/* 結果ポップアップ */}
      {showPopup && (
        <ResultPopup 
          result={result} 
          formData={formData} 
          onClose={handleClosePopup} 
        />
      )}
    </div>
  );
}

export default SubmissionPage;
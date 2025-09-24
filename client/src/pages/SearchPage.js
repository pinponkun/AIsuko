import React, { useState, useEffect ,useCallback} from 'react';
import styles from './SearchPage.module.css';

function SearchPage({ selectedPost, setSelectedPost }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchResults = useCallback(async (keyword) => {
    try {
      const res = await fetch(`http://localhost:8000/api/dates/search?keyword=${encodeURIComponent(keyword)}`);
      if (!res.ok) throw new Error('検索に失敗しました。');
      const data = await res.json();

      setResults(data);
      setFilteredResults(data);
      setSearched(true);
      if (data.length > 0 && typeof setSelectedPost === 'function') {
        setSelectedPost(data[0]);
      }
      setError('');
    } catch (err) {
      setError(err.message);
      setResults([]);
      setFilteredResults([]);
      setSearched(true);
    }
  }, [setSelectedPost]);

  useEffect(() => {
    fetchResults('');
  }, [fetchResults]);

  const extractNumber = (text) => {
    const match = text && text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const sortByAge = () => {
    const sorted = [...results].sort((a, b) => extractNumber(a.age) - extractNumber(b.age));
    setFilteredResults(sorted);
  };

  const sortByDateCount = () => {
    const sorted = [...results].sort((a, b) => extractNumber(b.date_number) - extractNumber(a.date_number));
    setFilteredResults(sorted);
  };

  const sortByCost = () => {
    const sorted = [...results].sort((a, b) => extractNumber(a.cost) - extractNumber(b.cost));
    setFilteredResults(sorted);
  };

  const filterByGender = (gender) => {
    const filtered = results.filter(item => item.gender === gender);
    setFilteredResults(filtered);
  };

  return (
    <div className="timeline">
      <header className="timeline-header">
        <h2>デートプラン検索</h2>
        <div className={styles.searchInputArea}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードを入力..."
            className={styles.searchInput}
          />
          <button
            onClick={() => fetchResults(query)}
            className={styles.searchButton}
          >
            検索
          </button>
        </div>
      </header>

      <div className={styles.filterArea}>
        <button onClick={sortByAge} className={styles.filterBtn}>年齢で並び替え</button>
        <button onClick={() => filterByGender('男性')} className={styles.filterBtn}>男性の投稿</button>
        <button onClick={() => filterByGender('女性')} className={styles.filterBtn}>女性の投稿</button>
        <button onClick={sortByDateCount} className={styles.filterBtn}>デート回数（降順）</button>
        <button onClick={sortByCost} className={styles.filterBtn}>費用で並び替え</button>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {searched && filteredResults.length === 0 && (
        <div className={styles.notFound}>
           該当する投稿は見つかりませんでした。
        </div>
      )}

      <div className="tweet-feed">
        {filteredResults.map((item, index) => (
          <article
            key={item.id}
            onClick={() => setSelectedPost && setSelectedPost(item)}
            className={`tweet ${selectedPost && selectedPost.id === item.id ? 'selected' : ''}`}
          >
            <div className="tweet-content">
              <h3><span style={{ color: 'gold' }}>📌</span> 偏差値: {item.score}</h3>
              <p>年齢: {item.age}</p>
              <p>職業: {item.occupation}</p>
              <p>性別: {item.gender}</p>
              <p>デート日時: {item.date_time}</p>
              <p>何回目: {item.date_number}</p>
              <p>費用: {item.cost}</p>
              <p>場所: {item.location}</p>
              <p>追記事項: {item.additional_notes}</p>
              <p className="comment">
                <strong>コメント:</strong>{' '}
                <span className={styles.commentText}>
                  {item.comment}
                </span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;

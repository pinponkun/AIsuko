import React, { useState } from 'react';
// ★ useLocationをreact-router-domからインポート
import { Routes, Route, useLocation } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import SubmissionPage from './pages/SubmissionPage';
import RankingPage from './pages/RankingPage';
import AIPlanPage from './pages/AIPlanPage';
import SearchPage from './pages/SearchPage';
import './App.css';

function App() {
  const [selectedPost, setSelectedPost] = useState(null);
  // ★ 現在のロケーション情報を取得
  const location = useLocation();

  // ★ ランキングページかどうかを判定
  const isRankingPage = location.pathname === '/ranking';

  // ★ 3カラム表示するページの判定
  const isThreeColumnLayout = isRankingPage;

  return (
    // ★ ページに応じてクラス名を切り替える
    <div className={isThreeColumnLayout ? "layout-3-column" : "layout-2-column"}>
      <LeftSidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<SubmissionPage />} />
          <Route path="/ai-plan" element={<AIPlanPage />} />
          <Route
            path="/ranking"
            element={<RankingPage setSelectedPost={setSelectedPost} selectedPost={selectedPost} />}
          />
          <Route
            path="/search"
            element={<SearchPage selectedPost={selectedPost} setSelectedPost={setSelectedPost} />}
          />
        </Routes>
      </main>
      {/* ★ ランキングページの場合のみRightSidebarをレンダリング */}
      {isRankingPage && <RightSidebar post={selectedPost} />}
    </div>
  );
}

export default App;

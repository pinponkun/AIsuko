import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaPenSquare, FaTrophy, FaRobot, FaSearch } from 'react-icons/fa'; // アイコンの例

function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      {/* ...ロゴなど... */}
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <FaPenSquare className="nav-icon" />
          <span className="nav-text">デート内容投稿</span>
        </NavLink>
        <NavLink to="/ai-plan" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <FaRobot className="nav-icon" />
          <span className="nav-text">AI デートプラン考案</span>
        </NavLink>
        <NavLink to="/ranking" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <FaTrophy className="nav-icon" />
          <span className="nav-text">偏差値ランキング</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <FaSearch className="nav-icon" /> {/* 🔍 検索アイコン */}
          <span className="nav-text">検索</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default LeftSidebar;
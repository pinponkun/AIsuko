import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // インポート
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* AppコンポーネントをBrowserRouterで囲む */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
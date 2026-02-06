import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// フォントをプリロードしてからアプリをレンダリング
const loadFonts = async () => {
  try {
    // LightNovelPOPフォントを事前に読み込み
    await document.fonts.load('48px LightNovelPOP');
  } catch (e) {
    console.warn('Font preload failed:', e);
  }
};

loadFonts().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Link eklendi
import WelcomePage from './WelcomePage';
import MainApp from './MainApp'; // Bu 3D Ana Uygulama
import LayoutEditorPage from './LayoutEditorPage'; // Yeni Yerleşim Düzenleyici Sayfası
import './App.css';

const App = () => {
  return (
    <Router>
      {/* İsteğe bağlı: Navigasyon Menüsü Eklenebilir */}
      <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', textAlign: 'center', marginBottom: '10px' }}>
        <Link to="/" style={{ marginRight: '15px' }}>Ana Sayfa</Link>
        <Link to="/app" style={{ marginRight: '15px' }}>3D Kabin Görünümü</Link>
        <Link to="/layout-editor">2D Yerleşim Düzenleyici</Link>
      </nav>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/layout-editor" element={<LayoutEditorPage />} /> {/* Yeni rota */}
      </Routes>
    </Router>
  );
};

export default App;

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import MainApp from './MainApp'; // Bu artık 2D/3D geçişini içerecek
// LayoutEditorPage ve LayoutProvider importları kaldırıldı
import './App.css';

const App = () => {
  return (
    <Router> {/* Router en dış sarmalayıcı */}
      {/* LayoutProvider kaldırıldı */}
      <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid #ddd' }}>
        <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', color: '#333', fontWeight: '500' }}>Ana Sayfa</Link>
        <Link to="/app" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Kabin Çizim Uygulaması</Link>
        {/* Layout Editor linki kaldırıldı */}
      </nav>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/app" element={<MainApp />} /> {/* MainApp artık 2D/3D'yi yönetecek */}
        {/* Layout Editor rotası kaldırıldı */}
      </Routes>
    </Router>
  );
};

export default App;

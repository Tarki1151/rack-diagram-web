import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import MainApp from './MainApp'; // Ana uygulamayı ayırıyoruz
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/app" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
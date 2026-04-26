import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutBayanWin from './pages/AboutBayanWin';
import BlogIndex from './pages/BlogIndex';
import BlogNashHotFilter from './pages/BlogNashHotFilter';
import BlogMiroPrediction from './pages/BlogMiroPrediction';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900">
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutBayanWin />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/nash-hotfilter" element={<BlogNashHotFilter />} />
        <Route path="/blog/miro-prediction" element={<BlogMiroPrediction />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;

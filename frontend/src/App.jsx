import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutBayanWin from './pages/AboutBayanWin';
import BlogIndex from './pages/BlogIndex';
import BlogNashHotFilter from './pages/BlogNashHotFilter';
import BlogMiroPrediction from './pages/BlogMiroPrediction';
import BlogMarkovChainsLottery from './pages/BlogMarkovChainsLottery';
import BlogDeepReinforcementLearning from './pages/BlogDeepReinforcementLearning';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import TermsOfUse from './pages/TermsOfUse';
import ResponsiblePlay from './pages/ResponsiblePlay';
import CookieConsentBanner from './components/CookieConsentBanner';

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
        <Route path="/blog/markov-chains-lottery" element={<BlogMarkovChainsLottery />} />
        <Route path="/blog/deep-reinforcement-learning" element={<BlogDeepReinforcementLearning />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/responsible-play" element={<ResponsiblePlay />} />
      </Routes>

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}

export default App;

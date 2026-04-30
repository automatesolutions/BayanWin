import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SeoHead from './components/SeoHead';
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
import Methodology from './pages/Methodology';
import CookieConsentBanner from './components/CookieConsentBanner';
import { getSeoForPath } from './seo/routeSeo';

function App() {
  const location = useLocation();
  const seo = getSeoForPath(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900">
      <SeoHead {...seo} />
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
        <Route path="/methodology" element={<Methodology />} />
      </Routes>

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}

export default App;

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SeoHead from './components/SeoHead';
import CookieConsentBanner from './components/CookieConsentBanner';
import ConditionalAdSense from './components/ConditionalAdSense';
import { getSeoForPath } from './seo/routeSeo';
import Spinner from './components/ui/Spinner';
import SmoothScroll from './components/motion/SmoothScroll';

// Route-level code splitting: content pages don't download the d3/recharts dashboard bundle.
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutBayanWin = lazy(() => import('./pages/AboutBayanWin'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogNashHotFilter = lazy(() => import('./pages/BlogNashHotFilter'));
const BlogMiroPrediction = lazy(() => import('./pages/BlogMiroPrediction'));
const BlogMarkovChainsLottery = lazy(() => import('./pages/BlogMarkovChainsLottery'));
const BlogDeepReinforcementLearning = lazy(() => import('./pages/BlogDeepReinforcementLearning'));
const BlogPCSO658Analysis = lazy(() => import('./pages/BlogPCSO658Analysis'));
const BlogPCSO649ResultsAnalysis = lazy(() => import('./pages/BlogPCSO649ResultsAnalysis'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Contact = lazy(() => import('./pages/Contact'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const ResponsiblePlay = lazy(() => import('./pages/ResponsiblePlay'));
const Methodology = lazy(() => import('./pages/Methodology'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const location = useLocation();
  const seo = getSeoForPath(location.pathname);

  return (
    <>
      <SeoHead {...seo} />
      {/* Fixed UI stays outside the smooth-scroll layer, which is transformed. */}
      <Header />
      <SmoothScroll>
        <div className="h-16 shrink-0" aria-hidden />
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center py-24">
              <Spinner className="h-6 w-6" label="Loading page" />
            </div>
          }
        >
          {/* Inside Suspense so ads never load over the loading spinner, only once the page has rendered. */}
          <ConditionalAdSense />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutBayanWin />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/nash-hotfilter" element={<BlogNashHotFilter />} />
            <Route path="/blog/miro-prediction" element={<BlogMiroPrediction />} />
            <Route path="/blog/markov-chains-lottery" element={<BlogMarkovChainsLottery />} />
            <Route path="/blog/deep-reinforcement-learning" element={<BlogDeepReinforcementLearning />} />
            <Route path="/blog/pcso-658-results-analysis" element={<BlogPCSO658Analysis />} />
            <Route path="/blog/pcso-649-results-analysis" element={<BlogPCSO649ResultsAnalysis />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/responsible-play" element={<ResponsiblePlay />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </SmoothScroll>
      <CookieConsentBanner />
    </>
  );
}

export default App;

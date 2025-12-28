import React from 'react';
import logo from '../assets/Logo.png';

const Header = () => {
  return (
    <header className="bg-tech-gradient text-white shadow-tech-lg border-b-4 border-electric-500">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={logo} 
              alt="BayanWin Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>BayanWin</h1>
              <p className="text-silver-200 text-sm mt-2 font-light">ML-Powered Lottery Number Predictions</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-silver-300 text-xs font-mono">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-charcoal-800 text-silver-300 mt-auto border-t-4 border-electric-500">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm flex flex-wrap justify-center gap-x-4 gap-y-2 items-center">
            <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
              About BayanWin
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
              Blog
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <Link to="/privacy" className="text-electric-400 hover:text-electric-300 underline">
              Privacy Policy
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <Link to="/terms" className="text-electric-400 hover:text-electric-300 underline">
              Terms of Use
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
              Responsible Play
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <Link to="/contact" className="text-electric-400 hover:text-electric-300 underline">
              Contact
            </Link>
            <span className="text-silver-600 hidden sm:inline">·</span>
            <span>&copy; 2026 BayanWin App</span>
          </p>
          <p className="text-xs mt-2 text-silver-500">
            Disclaimer: This application is for entertainment purposes only. 
            Lottery predictions do not guarantee winning numbers.
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-electric-500 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="w-2 h-2 bg-silver-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


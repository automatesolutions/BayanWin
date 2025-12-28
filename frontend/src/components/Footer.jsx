import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-charcoal-800 text-silver-300 mt-auto border-t-4 border-electric-500">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm font-medium">
            &copy; 2024 BayanWin App
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


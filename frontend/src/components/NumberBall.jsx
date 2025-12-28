import React from 'react';

const NumberBall = ({ number, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-orange-gradient text-white font-bold flex items-center justify-center shadow-orange hover:shadow-tech-lg transition-all transform hover:scale-110 border-2 border-orange-600`}
    >
      {number}
    </div>
  );
};

export default NumberBall;


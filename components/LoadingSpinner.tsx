
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-12 h-12 border-4 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;

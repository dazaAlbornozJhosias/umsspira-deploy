import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Cargando"
      />
      {text && <span className="text-sm font-medium text-slate-600 animate-pulse">{text}</span>}
    </div>
  );
};

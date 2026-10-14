import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Error en el cálculo',
  message,
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-800">{title}</h4>
          <p className="text-sm text-red-600 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors shadow-sm flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Reintentando...' : 'Reintentar'}</span>
        </button>
      )}
    </div>
  );
};

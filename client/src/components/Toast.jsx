import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';

export const Toast = () => {
  const { toastMessage } = useOrder();

  if (!toastMessage) return null;

  const { msg, type } = toastMessage;

  return (
    <div className="toast-container" role="alert" aria-live="assertive">
      <div className={`toast-box ${type}`}>
        {type === 'warning' && <AlertCircle size={16} />}
        {type === 'success' && <CheckCircle2 size={16} />}
        {type === 'info' && <Info size={16} />}
        <span>{msg}</span>
      </div>
    </div>
  );
};

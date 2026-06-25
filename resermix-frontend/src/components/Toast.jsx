import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ msg: '', tipo: 'success', show: false });
  const timeoutRef = useRef(null);

  const mostrarToast = useCallback((msg, tipo = 'success') => {
    setToast({ msg, tipo, show: true });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 2500);
  }, []);

  return { toast, mostrarToast };
}

export default function Toast({ toast }) {
  return (
    <div className={`toast ${toast.tipo} ${toast.show ? 'show' : ''}`}>
      {toast.msg}
    </div>
  );
}

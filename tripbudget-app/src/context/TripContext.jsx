import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { loadData, saveData } from '../utils/storage';
import { reducer, createInitialState } from '../utils/reducer';

const TripContext = createContext();

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => createInitialState(loadData()));

  const [toast, setToast] = useState({ show: false, message: '' });
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ show: true, message });
    timerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 1800);
  }, []);

  useEffect(() => {
    if (state) {
      saveData(state);
    }
  }, [state]);

  return (
    <TripContext.Provider value={{ state, dispatch, toast, showToast }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTripContext must be used within TripProvider');
  return context;
}

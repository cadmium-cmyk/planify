import React from 'react';
import ReactDOM from 'react-dom/client';
import { PlanifyProvider } from './context/PlanifyContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlanifyProvider>
      <App />
    </PlanifyProvider>
  </React.StrictMode>
);

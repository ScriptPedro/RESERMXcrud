import React from 'react';
import ReactDOM from 'react-dom/client';
// Fonte Atkinson Hyperlegible (desenhada para baixa visão), servida junto com o sistema — funciona offline
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

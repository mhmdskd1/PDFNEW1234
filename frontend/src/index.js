import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// إعداد اتجاه الكتابة للعربية
document.documentElement.setAttribute('dir', 'rtl');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
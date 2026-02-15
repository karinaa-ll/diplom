import React, { useState } from 'react';

const AuthModal = ({ onLogin }) => {
  const [name, setName] = useState('');

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-icon">🚀</div>
        <h2>Добро пожаловать!</h2>
        <p>Введи свое имя, чтобы начать обучение и сохранять прогресс.</p>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Твой никнейм..."
          autoFocus
        />
        <button 
          className="auth-btn" 
          onClick={() => name.trim() && onLogin(name)}
        >
          Погнали!
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // Состояния навигации
  const [isLangSelected, setIsLangSelected] = useState(false);
  const [screen, setScreen] = useState('map'); // 'map' или 'lesson'
  const [currentLanguage, setCurrentLanguage] = useState("");
  
  // Игровой прогресс
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [userInput, setUserInput] = useState(""); 
  const [feedback, setFeedback] = useState("");
  const [xp, setXp] = useState(0);
  const [hearts, setHearts] = useState(12); 
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Конфигурация уровней (теперь без жесткой привязки к языку внутри объекта, язык берется из выбора)
  const levels = [
    { id: 1, title: "Основы", icon: "🌱", color: "#58cc02" },
    { id: 2, title: "Переменные", icon: "⚡", color: "#ffc800" },
    { id: 3, title: "Математика", icon: "🔢", color: "#ce82ff" },
    { id: 4, title: "Условия", icon: "💎", color: "#1cb0f6" },
    { id: 5, title: "Списки", icon: "📦", color: "#ff4b4b" },
  ];

  // 1. Выбор языка
  const selectLanguage = (lang) => {
    setCurrentLanguage(lang);
    setIsLangSelected(true);
    setScreen('map');
  };

  // 2. Старт урока
  const startLesson = (level) => {
    setScreen('lesson');
    fetchTask(currentLanguage, 0);
  };

  const fetchTask = async (lang, currentProgress) => {
    setLoading(true);
    try {
      const stepNum = Math.floor(currentProgress / 12.5) + 1;
      const response = await axios.post('http://127.0.0.1:5000/api/get-task', {
        language: lang,
        step: stepNum
      });
      
      if (response.data) {
        setTask(response.data);
        setUserInput(""); 
        setFeedback("");
        setIsCorrect(false);
        setShowHint(false);
      }
    } catch (error) {
      console.error("ОШИБКА:", error);
      setFeedback("⚠️ Сервер не отвечает.");
    }
    setLoading(false);
  };

  const handleNext = () => {
    const nextProgress = progress + 12.5;
    if (nextProgress >= 100) {
      setProgress(100);
      setTimeout(() => {
        alert(`Уровень пройден! 🎉 +50 XP в копилку ${currentLanguage}`);
        setUnlockedLevel(prev => prev + 1);
        setXp(prev => prev + 50);
        goToMap();
      }, 500);
    } else {
      setProgress(nextProgress);
      fetchTask(currentLanguage, nextProgress);
    }
  };

  const goToMap = () => {
    setTask(null);
    setProgress(0);
    setHearts(12);
    setFeedback("");
    setIsCorrect(false);
    setScreen('map');
  };

  const resetToStart = () => {
    setIsLangSelected(false);
    goToMap();
  };

  const checkAnswer = () => {
    const normalize = (str) => {
      if (!str) return "";
      return str.toString().replace(/\s+/g, '').replace(/['"]/g, '"').replace(/;/g, '').replace(/\n/g, '').trim().toLowerCase();
    };

    const userClean = normalize(userInput);
    const correctClean = normalize(task.expectedSolution);

    if (userClean === correctClean && userClean !== "") {
        setFeedback("✅ Правильно!");
        setXp(prev => prev + 10);
        setIsCorrect(true);
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setFeedback(newHearts > 0 ? "❌ Ошибка! Попробуй еще раз." : "💔 Жизни закончились!");
    }
  };

  return (
    <div className="App">
      {/* ЛОАДЕР С ПАНДОЙ */}
      {loading && (
        <div className="loading-overlay">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="loading-video"
          >
            <source src="/load-panda.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
          <p>Я думаю над задачей...</p>
        </div>
      )}

      {/* ШАГ 0: ВЫБОР ЯЗЫКА */}
      {!isLangSelected ? (
        <div className="welcome-screen fade-in">
          <h1>Что будем учить?</h1>
          <p>Выберите технологию, чтобы начать приключение</p>
          <div className="lang-grid">
            <button className="lang-card python" onClick={() => selectLanguage('python')}>
              <div className="lang-icon">🐍</div>
              <span>Python</span>
            </button>
            <button className="lang-card js" onClick={() => selectLanguage('javascript')}>
              <div className="lang-icon">📜</div>
              <span>JavaScript</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ШАГ 1: КАРТА УРОВНЕЙ */}
          {screen === 'map' ? (
            <div className="map-screen fade-in">
              <header className="map-header">
                <button className="back-btn-small" onClick={resetToStart}>← Сменить язык</button>
                <h1>{currentLanguage === 'python' ? 'Python Путь' : 'JS Путь'}</h1>
                <div className="stat-badge">⭐ {xp} XP</div>
              </header>
              
              <div className="levels-container">
                {levels.map((lvl) => {
                  const isCompleted = lvl.id < unlockedLevel; // Пройденные уровни
                  const isLocked = lvl.id > unlockedLevel;    // Будущие уровни
                  const isActive = lvl.id === unlockedLevel;  // Текущий

                  return (
                    <div key={lvl.id} className="level-wrapper">
                      <button 
                        className={`level-node 
                          ${isLocked ? 'locked' : ''} 
                          ${isCompleted ? 'completed' : ''} 
                          ${isActive ? 'active-pulse' : ''}`}
                        style={{ 
                          backgroundColor: (isLocked || isCompleted) ? '#37464f' : lvl.color 
                        }}
                        onClick={() => isActive && startLesson(lvl)}
                      >
                        {/* Оставляем иконку всегда, меняем только замок */}
                        {isLocked ? "🔒" : lvl.icon}
                        
                        <div className="level-tooltip">
                          {isCompleted ? "Пройдено" : isLocked ? "Закрыто" : lvl.title}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ШАГ 2: ЭКРАН УРОКА */
            <div className="lesson-screen fade-in">
              <header className="app-header">
                <button className="back-home" onClick={goToMap}>✕</button>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="stats-right">
                  <span className={hearts < 3 ? "low-hearts" : ""}>❤️ {hearts}</span>
                </div>
              </header>

              <main className="content">
                <div className="task-view">
                  <h2 className="task-title">{task?.title}</h2>
                  <p className="task-desc">{task?.description}</p>
                  
                  <div className="task-actions-top">
                     <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                       💡 {showHint ? "Скрыть подсказку" : "Нужна подсказка?"}
                     </button>
                     {showHint && <div className="hint-bubble">{task?.hint}</div>}
                  </div>

                  <div className="editor-wrapper">
                    <textarea
                      className="code-input"
                      autoFocus
                      value={userInput}
                      onChange={(e) => !isCorrect && hearts > 0 && setUserInput(e.target.value)}
                      disabled={hearts <= 0 || isCorrect}
                      placeholder="Напиши код здесь..."
                    />
                  </div>

                  <div className="action-bar">
                    <p className={`feedback-msg ${isCorrect ? "success" : "error"}`}>{feedback}</p>
                    {hearts <= 0 ? (
                      <button className="check-btn restart" onClick={goToMap}>ВЕРНУТЬСЯ НА КАРТУ</button>
                    ) : isCorrect ? (
                      <button className="check-btn next-step" onClick={handleNext}>ДАЛЕЕ</button>
                    ) : (
                      <button className="check-btn" onClick={checkAnswer} disabled={userInput.length === 0}>
                        ПРОВЕРИТЬ
                      </button>
                    )}
                  </div>
                </div>
              </main>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
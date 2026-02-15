import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import AuthModal from './components/AuthModal';

function App() {
  const [isLangSelected, setIsLangSelected] = useState(false);
  const [screen, setScreen] = useState('map'); 
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [activeTab, setActiveTab] = useState('levels');
  const [streak, setStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState(null);
  const [user, setUser] = useState(null);
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
  const [isWrong, setIsWrong] = useState(false); 
  const [bamboo, setBamboo] = useState(0);
  // ДОБАВЛЕНО: Состояние завершения урока
  const [isLessonFinished, setIsLessonFinished] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('duo_coding_profile');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUser(parsed.user);
      setXp(parsed.xp || 0);
      setUnlockedLevel(parsed.unlockedLevel || 1);
      checkStreak(parsed.streak || 0, parsed.lastLoginDate);
      setBamboo(parsed.bamboo || 0);
    }
  }, []);

  const checkStreak = (currentStreak, lastDate) => {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDate === today) {
      setStreak(currentStreak);
    } else if (lastDate === yesterdayStr) {
      setStreak(currentStreak + 1);
    } else {
      setStreak(1);
    }
    setLastLoginDate(today);
  };

  useEffect(() => {
    if (user) {
      const dataToSave = { user, xp, unlockedLevel, streak, lastLoginDate, bamboo };
      localStorage.setItem('duo_coding_profile', JSON.stringify(dataToSave));
    }
  }, [user, xp, unlockedLevel, streak, lastLoginDate, bamboo]);

  const handleLogin = (name) => {
    const newUser = { name, avatar: name[0].toUpperCase() };
    setUser(newUser);
  };

  const handleLogout = () => {
    if (window.confirm("Выйти из аккаунта?")) {
      setUser(null);
      setActiveTab('levels');
    }
  };

  const levels = [
    { id: 1, title: "Основы", icon: "🌱", color: "#58cc02" },
    { id: 2, title: "Переменные", icon: "⚡", color: "#ffc800" },
    { id: 3, title: "Математика", icon: "🔢", color: "#ce82ff" },
    { id: 4, title: "Условия", icon: "💎", color: "#1cb0f6" },
    { id: 5, title: "Списки", icon: "📦", color: "#ff4b4b" },
  ];

  const selectLanguage = (lang) => {
    setCurrentLanguage(lang);
    setIsLangSelected(true);
    setScreen('map');
  };

  const startLesson = (level) => {
    setIsLessonFinished(false); // Сбрасываем флаг перед началом
    setScreen('lesson');
    setProgress(0);
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
        setIsWrong(false);
        setShowHint(false);
      }
    } catch (error) {
      setFeedback("⚠️ Сервер не отвечает.");
    }
    setLoading(false);
  };

  const handleNext = () => {
    const nextProgress = progress + 12.5;
    
    if (nextProgress >= 100) {
      setProgress(100);
      setTimeout(() => {
        setUnlockedLevel(prev => prev + 1);
        setXp(prev => prev + 50);
        setBamboo(prev => prev + 5);
        setIsLessonFinished(true); // Показываем экран успеха
      }, 600);
    } else {
      setProgress(nextProgress);
      setIsCorrect(false);
      setIsWrong(false);
      setFeedback("");
      setUserInput(""); // Чистим поле ввода для нового задания
      fetchTask(currentLanguage, nextProgress);
    }
  };

  const goToMap = () => {
    setTask(null);
    setProgress(0);
    setHearts(12);
    setFeedback("");
    setIsCorrect(false);
    setIsWrong(false);
    setIsLessonFinished(false);
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

    if (normalize(userInput) === normalize(task.expectedSolution)) {
        setFeedback("✅ Правильно!");
        setXp(prev => prev + 10);
        setIsCorrect(true);
        setIsWrong(false);
    } else {
      setHearts(prev => (prev > 0 ? prev - 1 : 0));
      setFeedback("❌ Ошибка! Попробуй еще раз.");
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
    }
  };

  return (
    <div className="App">
      {!user && <AuthModal onLogin={handleLogin} />}

      {loading && (
        <div className="loading-overlay">
          <video autoPlay loop muted playsInline className="loading-video">
            <source src="/load-panda.mp4" type="video/mp4" />
          </video>
          <p>Я думаю...</p>
        </div>
      )}

      {!isLangSelected ? (
        <div className="welcome-screen fade-in">
          <h1>Что будем учить?</h1>
          <div className="lang-grid">
            <button className="lang-card python" onClick={() => selectLanguage('python')}>
              <div className="lang-icon">🐍</div><span>Python</span>
            </button>
            <button className="lang-card js" onClick={() => selectLanguage('javascript')}>
              <div className="lang-icon">📜</div><span>JavaScript</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {screen === 'map' ? (
            <div className="map-wrapper">
              <main className="main-content-area">
                {activeTab === 'levels' && (
                  <div className="map-screen fade-in">
                    <header className="map-header">
                      <div className="user-profile-header">
                        <div className="avatar-small">{user?.avatar}</div>
                        <span className="user-name-text">{user?.name}</span>
                        <div className="streak-badge">🔥 {streak}</div>
                        <div className="bamboo-badge-dynamic">
                          <img src="/bamboo.png" alt="bamboo" className="bamboo-img-icon-dynamic" />
                          <span>{bamboo}</span>
                        </div>
                      </div>
                      <div className="stat-badge">⭐ {xp} XP</div>
                    </header>
                    <div className="levels-container">
                      {levels.map((lvl) => {
                        const isCompleted = lvl.id < unlockedLevel;
                        const isLocked = lvl.id > unlockedLevel;
                        const isActive = lvl.id === unlockedLevel;
                        return (
                          <div key={lvl.id} className="level-wrapper">
                            <button 
                              className={`level-node ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''} ${isActive ? 'active-pulse' : ''}`}
                              style={{ backgroundColor: (isLocked || isCompleted) ? '#37464f' : lvl.color }}
                              onClick={() => isActive && startLesson(lvl)}
                            >
                              {isLocked ? "🔒" : lvl.icon}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="profile-screen fade-in">
                    <h2>Мой профиль</h2>
                    <div className="profile-card">
                      <div className="avatar-large">{user?.avatar}</div>
                      <h3>{user?.name}</h3>
                      <div className="stats-grid">
                        <div className="stat-box"><span>{xp}</span><p>Опыт</p></div>
                        <div className="stat-box"><span>{unlockedLevel}</span><p>Уровень</p></div>
                        <div className="stat-box"><span>{streak}</span><p>Огонь</p></div>
                        <div className="stat-box">
                          <span>
                            <img src="/bamboo.png" alt="bamboo" className="bamboo-img-icon" /> {bamboo}
                          </span>
                          <p>Бамбук</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="settings-screen fade-in">
                    <h2>Настройки</h2>
                    <div className="settings-list">
                      <button className="settings-item" onClick={resetToStart}>🐍 Сменить язык</button>
                      <button className="settings-item logout" onClick={handleLogout}>🚪 Выйти из аккаунта</button>
                    </div>
                  </div>
                )}
              </main>

              <nav className="bottom-nav">
                <button className={`nav-item ${activeTab === 'levels' ? 'active' : ''}`} onClick={() => setActiveTab('levels')}>
                  <span className="nav-icon">🗺️</span><span>Главная</span>
                </button>
                <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                  <span className="nav-icon">👤</span><span>Профиль</span>
                </button>
                <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                  <span className="nav-icon">⚙️</span><span>Настройки</span>
                </button>
              </nav>
            </div>
          ) : (
            /* ЭКРАН УРОКА / УСПЕХА */
            <div className="lesson-screen fade-in">
              {isLessonFinished ? (
                <div className="success-screen fade-in">
                  <div className="sun-rays"></div>
                  <div className="success-content">
                    <div className="success-icon">
                      <img src="/bamboo.png" alt="bamboo" className="bamboo-img-large" />
                    </div>
                    <h1>Отличная работа!</h1>
                    <p>Ты на шаг ближе к мастерству {currentLanguage}</p>
                    <div className="results-card">
                      <div className="res-item"><span className="res-label">ОПЫТ</span><span className="res-value">+50 ⭐</span></div>
                      <div className="res-item"><span className="res-label">БАМБУК</span><span className="res-value">+5 🎋</span></div>
                    </div>
                    <button className="check-btn next-step" onClick={goToMap}>ПРОДОЛЖИТЬ</button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="app-header">
                    <button className="back-home" onClick={goToMap}>✕</button>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="stats-right">❤️ {hearts}</div>
                  </header>
                  <main className="content">
                    <div className="task-view">
                      <h2 className="task-title">{task?.title}</h2>
                      <p className="task-desc">{task?.description}</p>
                      <div className="task-actions-top">
                        <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                          💡 {showHint ? "Скрыть подсказку" : "Нужна подсказка?"}
                        </button>
                        {showHint && <div className="hint-bubble fade-in">{task?.hint}</div>}
                      </div>
                      <textarea
                        className={`code-input ${isCorrect ? 'correct-border' : ''} ${isWrong ? 'wrong-border' : ''}`}
                        value={userInput}
                        onChange={(e) => !isCorrect && setUserInput(e.target.value)}
                        placeholder="Напиши код здесь..."
                        disabled={hearts <= 0 || isCorrect}
                      />
                      {feedback && <p className={`feedback-text ${isCorrect ? 'success' : 'error'}`}>{feedback}</p>}
                      <div className="action-bar">
                        {isCorrect ? (
                          <button className="check-btn next-step" onClick={handleNext}>ДАЛЕЕ</button>
                        ) : (
                          <button className="check-btn" onClick={checkAnswer} disabled={userInput.length === 0 || hearts <= 0}>
                            {hearts <= 0 ? "ЖИЗНИ ЗАКОНЧИЛИСЬ" : "ПРОВЕРИТЬ"}
                          </button>
                        )}
                      </div>
                    </div>
                  </main>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
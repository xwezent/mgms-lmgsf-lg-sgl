// assets/injector.js - Инжектор для внедрения эксплойтов в страницу YouTube
console.log('🔧 YouTube Exploits Injector загружен');

class YouTubeExploitsInjector {
  constructor() {
    this.injectedElements = new Set();
    this.activeExploits = new Map();
    this.observer = null;
    this.init();
  }

  init() {
    console.log('Инициализация инжектора...');
    
    // Внедрение базовых стилей
    this.injectStyles();
    
    // Инициализация наблюдения за DOM
    this.initMutationObserver();
    
    // Внедрение панели управления
    this.injectControlPanel();
    
    // Перехват событий YouTube
    this.interceptYouTubeEvents();
    
    console.log('✅ Инжектор инициализирован');
  }

  injectStyles() {
    // Стили уже внедрены через content.css, но добавляем дополнительные
    const style = document.createElement('style');
    style.textContent = `
      .yt-exploit-highlight {
        outline: 2px solid #00ff00 !important;
        outline-offset: 2px;
        position: relative;
      }
      
      .yt-exploit-highlight::after {
        content: '🔧';
        position: absolute;
        top: -10px;
        right: -10px;
        background: black;
        color: #00ff00;
        font-size: 10px;
        padding: 2px;
        border-radius: 3px;
        z-index: 99999;
      }
      
      .exploit-modified {
        animation: exploit-pulse 2s infinite;
      }
      
      @keyframes exploit-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
    this.injectedElements.add(style);
  }

  initMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          this.handleNewElements(mutation.addedNodes);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  handleNewElements(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Проверяем на рекламные элементы
        if (this.isAdElement(node)) {
          this.handleAdElement(node);
        }
        
        // Проверяем на элементы плеера
        if (this.isPlayerElement(node)) {
          this.handlePlayerElement(node);
        }
        
        // Проверяем на элементы рекомендаций
        if (this.isRecommendationElement(node)) {
          this.handleRecommendationElement(node);
        }
      }
    });
  }

  isAdElement(element) {
    const adSelectors = [
      '.video-ads', '.ytp-ad-module', '.ad-container', 
      '[class*="ad-"]', '[id*="ad-"]', '.ytp-ad-overlay-container'
    ];
    
    return adSelectors.some(selector => 
      element.matches(selector) || element.querySelector(selector)
    );
  }

  handleAdElement(element) {
    // Помечаем рекламные элементы
    element.classList.add('yt-exploit-highlight');
    
    // Если включен обход рекламы, удаляем элемент
    if (this.isExploitActive('adblock') || this.isExploitActive('monetization_bypass')) {
      setTimeout(() => {
        if (element.parentNode) {
          element.style.display = 'none';
          console.log('Рекламный элемент заблокирован:', element);
        }
      }, 100);
    }
  }

  isPlayerElement(element) {
    const playerSelectors = [
      '#movie_player', 'video', '.html5-video-player',
      '.ytp-chrome-bottom', '.ytp-chrome-top'
    ];
    
    return playerSelectors.some(selector => 
      element.matches(selector) || element.querySelector(selector)
    );
  }

  handlePlayerElement(element) {
    // Внедряем перехватчики в плеер
    const video = element.querySelector('video');
    if (video && !video._exploitHijacked) {
      this.hijackVideoPlayer(video);
    }
  }

  hijackVideoPlayer(video) {
    console.log('Захват видеоплеера...');
    
    // Сохраняем оригинальные методы
    video._originalPlay = video.play;
    video._originalPause = video.pause;
    video._originalCurrentTimeSetter = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype, 'currentTime'
    ).set;
    
    // Перехват play()
    video.play = function() {
      console.log('Exploit: play() перехвачен');
      
      // Проверка на рекламу
      if (this._isAdPlaying) {
        console.log('Пропуск рекламы...');
        this.currentTime = this.duration;
        this._isAdPlaying = false;
      }
      
      return this._originalPlay.call(this);
    };
    
    // Перехват currentTime
    Object.defineProperty(video, 'currentTime', {
      get: function() {
        return this._currentTime || 0;
      },
      set: function(value) {
        this._currentTime = value;
        
        // Обнаружение рекламы по времени
        if (value === 0 && this.duration <= 30) {
          console.log('Обнаружен преролл');
          this._isAdPlaying = true;
        }
        
        if (this._originalCurrentTimeSetter) {
          this._originalCurrentTimeSetter.call(this, value);
        }
      }
    });
    
    video._exploitHijacked = true;
    console.log('✅ Видеоплеер захвачен');
  }

  isRecommendationElement(element) {
    const recommendationSelectors = [
      '#related', '#items', '.ytd-watch-next-secondary-results-renderer',
      '.ytd-compact-video-renderer', '.ytd-video-renderer'
    ];
    
    return recommendationSelectors.some(selector => 
      element.matches(selector) || element.querySelector(selector)
    );
  }

  handleRecommendationElement(element) {
    // Если включен эксплойт рекомендаций, модифицируем элементы
    if (this.isExploitActive('recommendation_killer')) {
      element.classList.add('exploit-modified');
      
      // Добавляем кнопку исключения из рекомендаций
      const excludeBtn = document.createElement('button');
      excludeBtn.textContent = '🚫 Исключить';
      excludeBtn.className = 'exploit-btn';
      excludeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        z-index: 1000;
        padding: 2px 5px;
        font-size: 10px;
      `;
      
      excludeBtn.onclick = (e) => {
        e.stopPropagation();
        this.excludeFromRecommendations(element);
      };
      
      if (!element.querySelector('.exploit-exclude-btn')) {
        element.style.position = 'relative';
        excludeBtn.className += ' exploit-exclude-btn';
        element.appendChild(excludeBtn);
      }
    }
  }

  excludeFromRecommendations(element) {
    // Логика исключения из рекомендаций
    element.style.opacity = '0.3';
    element.style.filter = 'blur(2px)';
    
    // Отправка фидбека в YouTube
    this.sendNegativeFeedback(element);
    
    console.log('Видео исключено из рекомендаций:', element);
  }

  sendNegativeFeedback(element) {
    // Эмуляция отправки негативного фидбека
    const videoId = this.extractVideoId(element);
    if (videoId) {
      const feedbackData = {
        videoId: videoId,
        feedback: 'not_recommend',
        timestamp: Date.now()
      };
      
      // Используем fetch для отправки
      fetch('https://www.youtube.com/youtubei/v1/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      }).catch(console.error);
    }
  }

  extractVideoId(element) {
    // Извлечение ID видео из элемента
    const link = element.querySelector('a#thumbnail');
    if (link && link.href) {
      const match = link.href.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  injectControlPanel() {
    // Создание плавающей панели управления
    const panel = document.createElement('div');
    panel.id = 'yt-exploit-control-panel';
    panel.className = 'exploit-control-panel';
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="color: #00ff00; font-weight: bold;">🎯 EXPLOITS</span>
        <button id="collapsePanel" style="background: none; border: none; color: #00ff00; cursor: pointer;">↔</button>
      </div>
      <div class="panel-content">
        <div class="exploit-status">
          <div class="status-item">
            <span class="status-indicator active"></span>
            <span>Инжектор: Активен</span>
          </div>
          <div class="status-item">
            <span class="status-indicator"></span>
            <span>Эксплойтов: 0</span>
          </div>
        </div>
        <div class="quick-controls" style="margin-top: 15px;">
          <button class="exploit-btn" data-action="toggle-ads">Блокировать рекламу</button>
          <button class="exploit-btn" data-action="kill-recommendations">Убить рекомендации</button>
          <button class="exploit-btn" data-action="extract-data">Извлечь данные</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.injectedElements.add(panel);
    
    // Обработчики событий панели
    panel.querySelector('#collapsePanel').onclick = () => {
      panel.classList.toggle('collapsed');
    };
    
    panel.querySelectorAll('[data-action]').forEach(button => {
      button.onclick = (e) => {
        const action = e.target.dataset.action;
        this.handlePanelAction(action);
      };
    });
    
    // Перетаскивание панели
    this.makeDraggable(panel);
  }

  makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    const dragMouseDown = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };
    
    const elementDrag = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // Ограничиваем перемещение по вертикали
      const newTop = element.offsetTop - pos2;
      if (newTop > 0 && newTop < window.innerHeight - element.offsetHeight) {
        element.style.top = newTop + "px";
      }
    };
    
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };
    
    element.querySelector('.panel-header').onmousedown = dragMouseDown;
  }

  handlePanelAction(action) {
    switch(action) {
      case 'toggle-ads':
        this.toggleAdBlocking();
        break;
      case 'kill-recommendations':
        this.killRecommendations();
        break;
      case 'extract-data':
        this.extractPageData();
        break;
    }
  }

  toggleAdBlocking() {
    const isActive = this.toggleExploit('adblock');
    this.showNotification(`Блокировка рекламы ${isActive ? 'включена' : 'выключена'}`);
  }

  killRecommendations() {
    const isActive = this.toggleExploit('recommendation_killer');
    this.showNotification(`Убийца рекомендаций ${isActive ? 'активирован' : 'деактивирован'}`);
  }

  extractPageData() {
    const data = {
      url: window.location.href,
      title: document.title,
      videoId: this.getCurrentVideoId(),
      timestamp: new Date().toISOString(),
      ytData: window.ytInitialData ? 'Доступен' : 'Не доступен',
      ytConfig: window.ytcfg ? 'Доступен' : 'Не доступен'
    };
    
    console.log('Извлеченные данные:', data);
    this.showNotification('Данные извлечены (см. консоль)');
  }

  getCurrentVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || null;
  }

  toggleExploit(exploitName) {
    const isActive = this.activeExploits.has(exploitName);
    
    if (isActive) {
      this.activeExploits.delete(exploitName);
      return false;
    } else {
      this.activeExploits.set(exploitName, {
        activated: new Date(),
        status: 'active'
      });
      return true;
    }
  }

  isExploitActive(exploitName) {
    return this.activeExploits.has(exploitName);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'exploit-toast';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid #00ff00;
      color: #00ff00;
      padding: 15px;
      border-radius: 5px;
      z-index: 1000001;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  interceptYouTubeEvents() {
    // Перехват XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(method, url) {
        this._url = url;
        this._method = method;
        
        // Логируем запросы к API YouTube
        if (url && url.includes('youtube.com')) {
          console.log(`XHR ${method}: ${url}`);
        }
        
        return originalOpen.apply(this, arguments);
      };
      
      xhr.send = function(body) {
        if (this._url && this._url.includes('youtube.com')) {
          // Анализ тела запроса
          if (body && this._url.includes('/youtubei/v1/')) {
            try {
              const data = JSON.parse(body);
              this._requestData = data;
            } catch(e) {}
          }
        }
        return originalSend.apply(this, arguments);
      };
      
      return xhr;
    };
    
    // Перехват fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      if (typeof url === 'string' && url.includes('youtube.com')) {
        console.log(`Fetch: ${url}`, options.method || 'GET');
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('✅ Перехват событий YouTube активирован');
  }

  // Методы для работы с другими эксплойтами
  registerExploit(exploitName, module) {
    this.activeExploits.set(exploitName, {
      module: module,
      activated: new Date(),
      status: 'active'
    });
    
    console.log(`Эксплойт зарегистрирован: ${exploitName}`);
  }

  getExploit(exploitName) {
    return this.activeExploits.get(exploitName);
  }

  getAllExploits() {
    return Array.from(this.activeExploits.keys());
  }

  cleanup() {
    // Очистка всех внедренных элементов
    this.injectedElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Остановка наблюдения
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.injectedElements.clear();
    this.activeExploits.clear();
    
    console.log('🧹 Инжектор очищен');
  }
}

// Автоматическая инициализация
let ytInjector = null;

function initInjector() {
  if (!ytInjector && document.readyState === 'complete') {
    ytInjector = new YouTubeExploitsInjector();
    window.ytExploitInjector = ytInjector;
  }
}

// Запуск при загрузке страницы
if (document.readyState === 'complete') {
  initInjector();
} else {
  window.addEventListener('load', initInjector);
}

// Экспорт для использования другими модулями
if (typeof module !== 'undefined') {
  module.exports = YouTubeExploitsInjector;
}

console.log('✅ YouTube Exploits Injector готов к работе');
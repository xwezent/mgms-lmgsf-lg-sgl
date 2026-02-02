// API Interceptor Exploit - Перехват и анализ всех API запросов YouTube
window.exploit_api_interceptor = {
  name: 'api_interceptor',
  description: 'Полный перехват и анализ всех API запросов YouTube с новой структурой',
  version: '2.0',
  
  async execute(params) {
    console.log('📡 Запуск API Interceptor с параметрами:', params);
    
    // Шаг 1: Инициализация системы перехвата
    const interceptionSystem = await this.initializeInterception(params.mode || 'full');
    
    // Шаг 2: Перехват текущих API запросов
    const capturedData = await this.captureAPITraffic(interceptionSystem);
    
    // Шаг 3: Анализ перехваченных данных
    const analysisResults = this.analyzeCapturedData(capturedData);
    
    // Шаг 4: Поиск уязвимостей в API
    const vulnerabilities = await this.findAPIVulnerabilities(analysisResults);
    
    // Шаг 5: Создание отчетов и экспорт
    const reports = this.generateAPIReports(capturedData, analysisResults, vulnerabilities);
    
    return {
      success: true,
      interceptionSystem: interceptionSystem,
      capturedEndpoints: capturedData.endpoints.length,
      capturedRequests: capturedData.requests.length,
      analysisResults: analysisResults,
      vulnerabilities: vulnerabilities,
      reports: reports,
      recommendations: this.getAPIRecommendations(vulnerabilities),
      timestamp: new Date().toISOString()
    };
  },
  
  async initializeInterception(mode) {
    console.log(`Инициализация перехвата API в режиме: ${mode}`);
    
    const system = {
      mode: mode,
      startTime: new Date().toISOString(),
      interceptors: {
        xhr: false,
        fetch: false,
        websocket: false,
        beacon: false,
        mutation: false
      },
      filters: {
        domains: ['youtube.com', 'googlevideo.com', 'googleapis.com'],
        endpoints: ['/youtubei/v1/', '/api/', '/live/', '/watch'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      },
      storage: {
        maxRequests: 5000,
        maxEndpoints: 1000,
        autoExport: true
      },
      hooks: []
    };
    
    // Установка перехватчиков
    await this.installInterceptors(system);
    
    // Установка фильтров
    this.setupFilters(system);
    
    // Инициализация хранилища
    await this.initStorage(system);
    
    return system;
  },
  
  async installInterceptors(system) {
    console.log('Установка перехватчиков API...');
    
    // Перехват XMLHttpRequest
    if (this.interceptXHR()) {
      system.interceptors.xhr = true;
      console.log('✅ XMLHttpRequest перехватчик установлен');
    }
    
    // Перехват Fetch API
    if (this.interceptFetch()) {
      system.interceptors.fetch = true;
      console.log('✅ Fetch API перехватчик установлен');
    }
    
    // Перехват WebSocket
    if (this.interceptWebSocket()) {
      system.interceptors.websocket = true;
      console.log('✅ WebSocket перехватчик установлен');
    }
    
    // Перехват Beacon API
    if (this.interceptBeacon()) {
      system.interceptors.beacon = true;
      console.log('✅ Beacon API перехватчик установлен');
    }
    
    // Наблюдение за мутациями DOM
    if (this.interceptDOMMutations()) {
      system.interceptors.mutation = true;
      console.log('✅ DOM Mutation перехватчик установлен');
    }
  },
  
  interceptXHR() {
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;
      
      const requestData = {
        url: null,
        method: null,
        headers: {},
        body: null,
        startTime: null,
        endTime: null,
        response: null,
        status: null
      };
      
      // Перехват open
      xhr.open = function(method, url, async = true, user, password) {
        requestData.url = url;
        requestData.method = method;
        requestData.startTime = Date.now();
        
        // Сохраняем оригинальные заголовки
        this._requestHeaders = {};
        this._requestData = requestData;
        
        return originalOpen.call(this, method, url, async, user, password);
      };
      
      // Перехват setRequestHeader
      xhr.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        requestData.headers[header] = value;
        return originalSetRequestHeader.call(this, header, value);
      };
      
      // Перехват send
      xhr.send = function(body) {
        requestData.body = body;
        
        // Обработка событий
        this.addEventListener('load', function() {
          requestData.endTime = Date.now();
          requestData.status = this.status;
          requestData.response = this.response;
          requestData.responseHeaders = this.getAllResponseHeaders();
          requestData.duration = requestData.endTime - requestData.startTime;
          
          // Анализ запроса
          self.analyzeRequest(requestData);
          
          // Сохранение данных
          self.saveRequestData(requestData, 'xhr');
        });
        
        this.addEventListener('error', function() {
          requestData.endTime = Date.now();
          requestData.error = true;
          requestData.duration = requestData.endTime - requestData.startTime;
          
          self.saveRequestData(requestData, 'xhr_error');
        });
        
        return originalSend.call(this, body);
      };
      
      return xhr;
    };
    
    return true;
  },
  
  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(...args) {
      const requestData = {
        url: typeof args[0] === 'string' ? args[0] : args[0].url,
        method: args[1]?.method || 'GET',
        headers: args[1]?.headers || {},
        body: args[1]?.body,
        startTime: Date.now(),
        type: 'fetch'
      };
      
      try {
        const response = await originalFetch.apply(this, args);
        
        requestData.endTime = Date.now();
        requestData.status = response.status;
        requestData.duration = requestData.endTime - requestData.startTime;
        
        // Клонируем response для чтения
        const clonedResponse = response.clone();
        
        try {
          requestData.response = await clonedResponse.text();
        } catch (e) {
          requestData.response = '[Binary data]';
        }
        
        // Анализ запроса
        self.analyzeRequest(requestData);
        
        // Сохранение данных
        self.saveRequestData(requestData, 'fetch');
        
        return response;
      } catch (error) {
        requestData.endTime = Date.now();
        requestData.error = error.message;
        requestData.duration = requestData.endTime - requestData.startTime;
        
        self.saveRequestData(requestData, 'fetch_error');
        throw error;
      }
    };
    
    return true;
  },
  
  interceptWebSocket() {
    const originalWebSocket = window.WebSocket;
    const self = this;
    
    window.WebSocket = function(...args) {
      const ws = new originalWebSocket(...args);
      const url = args[0];
      
      const wsData = {
        url: url,
        protocol: args[1] || '',
        startTime: Date.now(),
        messages: [],
        events: []
      };
      
      // Перехват отправки сообщений
      const originalSend = ws.send;
      ws.send = function(data) {
        wsData.messages.push({
          type: 'outgoing',
          data: data,
          timestamp: Date.now()
        });
        
        self.saveWebSocketData(wsData, 'send');
        return originalSend.call(this, data);
      };
      
      // Перехват входящих сообщений
      ws.addEventListener('message', function(event) {
        wsData.messages.push({
          type: 'incoming',
          data: event.data,
          timestamp: Date.now()
        });
        
        self.saveWebSocketData(wsData, 'message');
      });
      
      // Логирование событий
      const events = ['open', 'close', 'error'];
      events.forEach(eventType => {
        ws.addEventListener(eventType, function(event) {
          wsData.events.push({
            type: eventType,
            data: event,
            timestamp: Date.now()
          });
          
          self.saveWebSocketData(wsData, `event_${eventType}`);
        });
      });
      
      return ws;
    };
    
    return true;
  },
  
  interceptBeacon() {
    const originalSendBeacon = navigator.sendBeacon;
    const self = this;
    
    if (originalSendBeacon) {
      navigator.sendBeacon = function(url, data) {
        const beaconData = {
          url: url,
          data: data,
          timestamp: Date.now(),
          type: 'beacon'
        };
        
        // Сохранение данных beacon
        self.saveBeaconData(beaconData);
        
        // Вызов оригинального метода
        return originalSendBeacon.call(this, url, data);
      };
      
      return true;
    }
    
    return false;
  },
  
  interceptDOMMutations() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Проверка на скрипты с API вызовами
              if (node.tagName === 'SCRIPT' && node.textContent) {
                this.analyzeScriptContent(node.textContent);
              }
              
              // Проверка на iframe с YouTube
              if (node.tagName === 'IFRAME' && node.src.includes('youtube.com')) {
                this.analyzeIFrame(node);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    return true;
  },
  
  async captureAPITraffic(system) {
    console.log('Начало перехвата API трафика...');
    
    const capturedData = {
      endpoints: new Set(),
      requests: [],
      websockets: [],
      beacons: [],
      scripts: [],
      iframes: [],
      startTime: new Date().toISOString()
    };
    
    // Сбор существующих API endpoints
    await this.collectExistingEndpoints(capturedData);
    
    // Мониторинг в течение указанного времени
    const captureDuration = 30000; // 30 секунд
    await this.monitorAPITraffic(capturedData, captureDuration);
    
    // Анализ собранных данных
    await this.processCapturedData(capturedData);
    
    capturedData.endTime = new Date().toISOString();
    capturedData.totalRequests = capturedData.requests.length;
    capturedData.uniqueEndpoints = Array.from(capturedData.endpoints);
    
    return capturedData;
  },
  
  async collectExistingEndpoints(capturedData) {
    // Поиск API endpoints в существующих скриптах
    const scripts = document.querySelectorAll('script');
    
    scripts.forEach((script) => {
      if (script.src) {
        capturedData.scripts.push({
          url: script.src,
          type: 'external'
        });
        
        // Извлечение endpoints из URL скриптов
        this.extractEndpointsFromURL(script.src, capturedData.endpoints);
      } else if (script.textContent) {
        // Поиск API вызовов во встроенных скриптах
        const endpoints = this.findEndpointsInText(script.textContent);
        endpoints.forEach(endpoint => capturedData.endpoints.add(endpoint));
      }
    });
    
    // Поиск в localStorage и sessionStorage
    await this.collectStorageEndpoints(capturedData);
    
    // Поиск в window объекте
    this.collectWindowEndpoints(capturedData);
  },
  
  extractEndpointsFromURL(url, endpoints) {
    const patterns = [
      /\/youtubei\/v1\/([^\/?]+)/g,
      /\/api\/([^\/?]+)/g,
      /\/live\/([^\/?]+)/g,
      /\/watch\?([^&]+)/g
    ];
    
    patterns.forEach(pattern => {
      const matches = url.matchAll(pattern);
      for (const match of matches) {
        endpoints.add(match[0]);
      }
    });
  },
  
  findEndpointsInText(text) {
    const endpoints = new Set();
    
    // Поиск URL API endpoints
    const urlPatterns = [
      /https?:\/\/[^"'\s]+\/youtubei\/v1\/[^"'\s]+/g,
      /https?:\/\/[^"'\s]+\/api\/[^"'\s]+/g,
      /"endpoint":"([^"]+)"/g,
      /'endpoint':'([^']+)'/g
    ];
    
    urlPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        endpoints.add(match[1] || match[0]);
      }
    });
    
    // Поиск JSON структур с API данными
    const jsonPattern = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/g;
    const jsonMatches = text.matchAll(jsonPattern);
    
    for (const match of jsonMatches) {
      try {
        const json = JSON.parse(match[0]);
        this.extractEndpointsFromJSON(json, endpoints);
      } catch (e) {
        // Невалидный JSON, пропускаем
      }
    }
    
    return Array.from(endpoints);
  },
  
  extractEndpointsFromJSON(obj, endpoints) {
    if (!obj || typeof obj !== 'object') return;
    
    // Рекурсивный поиск endpoints
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string' && value.includes('/youtubei/v1/')) {
          endpoints.add(value);
        } else if (typeof value === 'object') {
          this.extractEndpointsFromJSON(value, endpoints);
        }
      }
    }
  },
  
  async collectStorageEndpoints(capturedData) {
    try {
      // localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        if (value && value.includes('youtube.com')) {
          capturedData.endpoints.add(`localStorage:${key}`);
          
          try {
            const json = JSON.parse(value);
            this.extractEndpointsFromJSON(json, capturedData.endpoints);
          } catch (e) {}
        }
      }
      
      // sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        
        if (value && value.includes('youtube.com')) {
          capturedData.endpoints.add(`sessionStorage:${key}`);
        }
      }
    } catch (e) {}
  },
  
  collectWindowEndpoints(capturedData) {
    // Поиск API объектов в window
    const windowObjects = Object.keys(window);
    
    windowObjects.forEach(key => {
      if (key.includes('yt') || key.includes('ytcfg') || key.includes('ytInitial')) {
        try {
          const value = window[key];
          
          if (typeof value === 'string') {
            const endpoints = this.findEndpointsInText(value);
            endpoints.forEach(endpoint => capturedData.endpoints.add(endpoint));
          } else if (typeof value === 'object') {
            this.extractEndpointsFromJSON(value, capturedData.endpoints);
          }
        } catch (e) {}
      }
    });
  },
  
  async monitorAPITraffic(capturedData, duration) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Функция периодической проверки
      const checkInterval = setInterval(() => {
        // Сбор текущих запросов из Performance API
        this.collectPerformanceEntries(capturedData);
        
        // Проверка истекшего времени
        if (Date.now() - startTime >= duration) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  },
  
  collectPerformanceEntries(capturedData) {
    if (!window.performance || !window.performance.getEntriesByType) return;
    
    const resources = window.performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      if (resource.name.includes('youtube.com')) {
        capturedData.requests.push({
          url: resource.name,
          type: resource.initiatorType,
          duration: resource.duration,
          size: resource.transferSize,
          startTime: resource.startTime
        });
        
        this.extractEndpointsFromURL(resource.name, capturedData.endpoints);
      }
    });
  },
  
  analyzeRequest(requestData) {
    const analysis = {
      security: {},
      performance: {},
      data: {},
      anomalies: []
    };
    
    // Анализ безопасности
    analysis.security = this.analyzeSecurity(requestData);
    
    // Анализ производительности
    analysis.performance = this.analyzePerformance(requestData);
    
    // Анализ данных
    analysis.data = this.analyzeRequestData(requestData);
    
    // Поиск аномалий
    analysis.anomalies = this.findAnomalies(requestData, analysis);
    
    requestData.analysis = analysis;
    return analysis;
  },
  
  analyzeSecurity(requestData) {
    const security = {
      hasAuth: false,
      authType: null,
      tokens: [],
      sensitiveData: false,
      vulnerabilities: []
    };
    
    // Проверка авторизации
    const headers = requestData.headers;
    const url = requestData.url;
    const body = requestData.body;
    
    // Поиск токенов
    const tokenPatterns = [
      /token=([^&]+)/,
      /access_token=([^&]+)/,
      /auth=([^&]+)/,
      /session=([^&]+)/,
      /[A-Za-z0-9\-_]{100,}/ // Длинные строки, похожие на токены
    ];
    
    // Проверка URL
    tokenPatterns.forEach(pattern => {
      const match = url.match(pattern);
      if (match) {
        security.hasAuth = true;
        security.tokens.push({
          type: 'url_token',
          value: match[1].substring(0, 50) + '...',
          location: 'url'
        });
      }
    });
    
    // Проверка заголовков
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
          security.hasAuth = true;
          security.authType = key;
          security.tokens.push({
            type: 'header_token',
            value: value.substring(0, 50) + '...',
            location: 'headers',
            header: key
          });
        }
      });
    }
    
    // Проверка тела запроса
    if (body) {
      try {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        tokenPatterns.forEach(pattern => {
          const match = bodyStr.match(pattern);
          if (match) {
            security.hasAuth = true;
            security.tokens.push({
              type: 'body_token',
              value: match[1].substring(0, 50) + '...',
              location: 'body'
            });
          }
        });
        
        // Проверка на чувствительные данные
        const sensitivePatterns = [
          /password/i,
          /credit.*card/i,
          /ssn|social.*security/i,
          /private.*key/i
        ];
        
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(bodyStr)) {
            security.sensitiveData = true;
          }
        });
      } catch (e) {}
    }
    
    // Проверка уязвимостей
    if (url.includes('http://') && !url.includes('localhost')) {
      security.vulnerabilities.push({
        type: 'cleartext_protocol',
        severity: 'high',
        description: 'Использование HTTP вместо HTTPS'
      });
    }
    
    if (url.includes('debug=true') || url.includes('test=true')) {
      security.vulnerabilities.push({
        type: 'debug_endpoint',
        severity: 'medium',
        description: 'Доступ к debug endpoint'
      });
    }
    
    return security;
  },
  
  analyzePerformance(requestData) {
    const performance = {
      duration: requestData.duration || 0,
      size: 0,
      rating: 'good'
    };
    
    // Расчет размера запроса
    if (requestData.body) {
      performance.size += new Blob([requestData.body]).size;
    }
    
    if (requestData.response) {
      performance.size += new Blob([requestData.response]).size;
    }
    
    // Оценка производительности
    if (requestData.duration > 5000) {
      performance.rating = 'poor';
    } else if (requestData.duration > 1000) {
      performance.rating = 'fair';
    } else {
      performance.rating = 'good';
    }
    
    return performance;
  },
  
  analyzeRequestData(requestData) {
    const data = {
      type: 'unknown',
      structure: {},
      size: 0,
      complexity: 'low'
    };
    
    try {
      let requestBody = requestData.body;
      let responseBody = requestData.response;
      
      // Анализ тела запроса
      if (requestBody) {
        if (typeof requestBody === 'string') {
          try {
            requestBody = JSON.parse(requestBody);
          } catch (e) {}
        }
        
        if (typeof requestBody === 'object') {
          data.type = this.determineDataType(requestBody);
          data.structure.request = this.analyzeStructure(requestBody);
          data.size += JSON.stringify(requestBody).length;
        }
      }
      
      // Анализ ответа
      if (responseBody) {
        if (typeof responseBody === 'string') {
          try {
            responseBody = JSON.parse(responseBody);
          } catch (e) {}
        }
        
        if (typeof responseBody === 'object') {
          data.type = data.type || this.determineDataType(responseBody);
          data.structure.response = this.analyzeStructure(responseBody);
          data.size += JSON.stringify(responseBody).length;
          data.complexity = this.assessComplexity(responseBody);
        }
      }
      
    } catch (e) {
      data.error = e.message;
    }
    
    return data;
  },
  
  determineDataType(obj) {
    if (!obj || typeof obj !== 'object') return 'unknown';
    
    // Определение типа данных по структуре
    if (obj.videoId || obj.playlistId) return 'video_data';
    if (obj.comments || obj.replies) return 'comment_data';
    if (obj.items && Array.isArray(obj.items)) return 'list_data';
    if (obj.context && obj.context.client) return 'youtubei_request';
    if (obj.error || obj.message) return 'error_response';
    
    return 'generic_data';
  },
  
  analyzeStructure(obj, depth = 0, maxDepth = 3) {
    if (depth >= maxDepth || !obj || typeof obj !== 'object') {
      return { type: typeof obj, depth: depth };
    }
    
    const structure = {
      type: Array.isArray(obj) ? 'array' : 'object',
      depth: depth,
      properties: {},
      size: Object.keys(obj).length
    };
    
    // Анализ свойств (первые 5 для производительности)
    const keys = Object.keys(obj).slice(0, 5);
    
    keys.forEach(key => {
      const value = obj[key];
      structure.properties[key] = {
        type: typeof value,
        isObject: typeof value === 'object' && value !== null,
        isArray: Array.isArray(value),
        sample: this.getSampleValue(value)
      };
    });
    
    return structure;
  },
  
  getSampleValue(value) {
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    } else if (typeof value === 'number') {
      return value;
    } else if (Array.isArray(value)) {
      return `Array[${value.length}]`;
    } else if (typeof value === 'object' && value !== null) {
      return `Object{${Object.keys(value).length}}`;
    }
    
    return value;
  },
  
  assessComplexity(obj) {
    if (!obj || typeof obj !== 'object') return 'low';
    
    const totalKeys = this.countKeys(obj);
    
    if (totalKeys > 100) return 'very_high';
    if (totalKeys > 50) return 'high';
    if (totalKeys > 20) return 'medium';
    return 'low';
  },
  
  countKeys(obj, counted = new Set()) {
    if (counted.has(obj)) return 0;
    counted.add(obj);
    
    if (!obj || typeof obj !== 'object') return 0;
    
    let total = Object.keys(obj).length;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          total += this.countKeys(value, counted);
        }
      }
    }
    
    return total;
  },
  
  findAnomalies(requestData, analysis) {
    const anomalies = [];
    
    // Аномалии безопасности
    if (analysis.security.vulnerabilities.length > 0) {
      anomalies.push({
        type: 'security_vulnerability',
        details: analysis.security.vulnerabilities,
        severity: 'high'
      });
    }
    
    if (analysis.security.sensitiveData) {
      anomalies.push({
        type: 'sensitive_data_exposure',
        severity: 'critical',
        description: 'Обнаружены чувствительные данные в запросе'
      });
    }
    
    // Аномалии производительности
    if (analysis.performance.rating === 'poor') {
      anomalies.push({
        type: 'performance_issue',
        severity: 'medium',
        description: `Длительный запрос: ${analysis.performance.duration}ms`
      });
    }
    
    // Аномалии данных
    if (analysis.data.complexity === 'very_high') {
      anomalies.push({
        type: 'complex_data_structure',
        severity: 'low',
        description: 'Очень сложная структура данных'
      });
    }
    
    // Проверка статуса ответа
    if (requestData.status >= 400) {
      anomalies.push({
        type: 'error_response',
        severity: requestData.status >= 500 ? 'high' : 'medium',
        description: `HTTP статус: ${requestData.status}`
      });
    }
    
    return anomalies;
  },
  
  async saveRequestData(requestData, source) {
    const storageKey = 'api_interceptor_requests';
    let requests = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        requests = JSON.parse(stored);
      }
    } catch (e) {}
    
    // Добавление метаданных
    const enrichedData = {
      ...requestData,
      source: source,
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };
    
    requests.push(enrichedData);
    
    // Ограничение размера хранилища
    if (requests.length > 1000) {
      requests = requests.slice(-500);
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(requests));
    } catch (e) {}
  },
  
  saveWebSocketData(wsData, eventType) {
    const storageKey = 'api_interceptor_websockets';
    let websockets = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        websockets = JSON.parse(stored);
      }
    } catch (e) {}
    
    // Поиск существующего WebSocket
    let wsEntry = websockets.find(w => w.url === wsData.url);
    
    if (!wsEntry) {
      wsEntry = {
        url: wsData.url,
        protocol: wsData.protocol,
        startTime: wsData.startTime,
        messages: [],
        events: []
      };
      websockets.push(wsEntry);
    }
    
    // Обновление данных
    if (eventType === 'send' || eventType === 'message') {
      wsEntry.messages.push(...wsData.messages);
    } else if (eventType.startsWith('event_')) {
      wsEntry.events.push(...wsData.events);
    }
    
    // Ограничение размера
    if (wsEntry.messages.length > 100) {
      wsEntry.messages = wsEntry.messages.slice(-50);
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(websockets));
    } catch (e) {}
  },
  
  saveBeaconData(beaconData) {
    const storageKey = 'api_interceptor_beacons';
    let beacons = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        beacons = JSON.parse(stored);
      }
    } catch (e) {}
    
    beacons.push(beaconData);
    
    // Ограничение размера
    if (beacons.length > 100) {
      beacons = beacons.slice(-50);
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(beacons));
    } catch (e) {}
  },
  
  async processCapturedData(capturedData) {
    console.log('Обработка перехваченных данных...');
    
    // Группировка запросов по типам
    capturedData.requestTypes = this.groupRequestsByType(capturedData.requests);
    
    // Анализ паттернов
    capturedData.patterns = this.analyzeRequestPatterns(capturedData.requests);
    
    // Поиск дубликатов
    capturedData.duplicates = this.findDuplicateRequests(capturedData.requests);
    
    // Классификация endpoints
    capturedData.endpointCategories = this.categorizeEndpoints(capturedData.endpoints);
  },
  
  groupRequestsByType(requests) {
    const types = {};
    
    requests.forEach(request => {
      const type = this.determineRequestType(request.url);
      
      if (!types[type]) {
        types[type] = {
          count: 0,
          totalDuration: 0,
          urls: new Set()
        };
      }
      
      types[type].count++;
      types[type].totalDuration += request.duration || 0;
      types[type].urls.add(request.url);
    });
    
    // Расчет средней продолжительности
    Object.keys(types).forEach(type => {
      types[type].averageDuration = types[type].totalDuration / types[type].count;
      types[type].uniqueUrls = Array.from(types[type].urls);
      delete types[type].urls;
    });
    
    return types;
  },
  
  determineRequestType(url) {
    if (!url) return 'unknown';
    
    if (url.includes('/youtubei/v1/')) return 'youtubei_api';
    if (url.includes('/api/stats/')) return 'stats_api';
    if (url.includes('/watch?')) return 'watch_page';
    if (url.includes('/live/')) return 'live_stream';
    if (url.includes('/embed/')) return 'embedded';
    if (url.includes('/playlist?')) return 'playlist';
    if (url.includes('/channel/')) return 'channel';
    if (url.includes('/user/')) return 'user';
    if (url.includes('/search?')) return 'search';
    if (url.includes('/upload/')) return 'upload';
    
    return 'other';
  },
  
  analyzeRequestPatterns(requests) {
    const patterns = {
      timing: this.analyzeTimingPatterns(requests),
      sequence: this.analyzeSequencePatterns(requests),
      dependencies: this.analyzeDependencyPatterns(requests)
    };
    
    return patterns;
  },
  
  analyzeTimingPatterns(requests) {
    if (requests.length < 2) return {};
    
    const timings = requests.map(r => r.startTime).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < timings.length; i++) {
      intervals.push(timings[i] - timings[i-1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    
    return {
      totalRequests: requests.length,
      averageInterval: avgInterval,
      intervalVariance: variance,
      isRegular: variance < avgInterval * 0.5,
      burstDetected: this.detectBursts(intervals, avgInterval)
    };
  },
  
  detectBursts(intervals, avgInterval) {
    const bursts = [];
    let currentBurst = [];
    
    intervals.forEach((interval, index) => {
      if (interval < avgInterval * 0.3) {
        currentBurst.push({ index, interval });
      } else if (currentBurst.length > 0) {
        if (currentBurst.length >= 3) {
          bursts.push([...currentBurst]);
        }
        currentBurst = [];
      }
    });
    
    return bursts;
  },
  
  analyzeSequencePatterns(requests) {
    const sequences = [];
    const urlSequence = requests.map(r => this.determineRequestType(r.url));
    
    // Поиск повторяющихся последовательностей
    for (let len = 2; len <= 5; len++) {
      for (let i = 0; i <= urlSequence.length - len; i++) {
        const sequence = urlSequence.slice(i, i + len);
        const sequenceStr = sequence.join('→');
        
        // Поиск повторений этой последовательности
        let count = 0;
        for (let j = i + len; j <= urlSequence.length - len; j++) {
          const compareSequence = urlSequence.slice(j, j + len);
          if (compareSequence.join('→') === sequenceStr) {
            count++;
            j += len - 1; // Пропустить проверенную часть
          }
        }
        
        if (count > 0) {
          sequences.push({
            sequence: sequence,
            occurrences: count + 1,
            length: len
          });
        }
      }
    }
    
    // Удаление дубликатов
    const uniqueSequences = [];
    const seen = new Set();
    
    sequences.forEach(seq => {
      const key = seq.sequence.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSequences.push(seq);
      }
    });
    
    return uniqueSequences.sort((a, b) => b.occurrences - a.occurrences).slice(0, 10);
  },
  
  analyzeDependencyPatterns(requests) {
    const dependencies = [];
    
    // Поиск зависимостей по URL параметрам
    requests.forEach((request, i) => {
      const urlParams = new URLSearchParams(request.url.split('?')[1] || '');
      const params = Object.fromEntries(urlParams);
      
      // Проверка на наличие параметров, которые могли прийти из предыдущих ответов
      Object.entries(params).forEach(([key, value]) => {
        if (value.length > 20 && /^[A-Za-z0-9_\-]+$/.test(value)) {
          // Возможно, это токен или ID из предыдущего ответа
          dependencies.push({
            requestIndex: i,
            param: key,
            value: value.substring(0, 30) + '...',
            type: 'possible_token'
          });
        }
      });
    });
    
    return dependencies;
  },
  
  findDuplicateRequests(requests) {
    const duplicates = [];
    const seen = new Map(); // URL -> индексы
    
    requests.forEach((request, index) => {
      const simplifiedUrl = request.url.split('?')[0]; // Без параметров
      
      if (seen.has(simplifiedUrl)) {
        seen.get(simplifiedUrl).push(index);
      } else {
        seen.set(simplifiedUrl, [index]);
      }
    });
    
    // Находим URL с дубликатами
    seen.forEach((indices, url) => {
      if (indices.length > 1) {
        duplicates.push({
          url: url,
          count: indices.length,
          indices: indices,
          requests: indices.map(i => requests[i])
        });
      }
    });
    
    return duplicates.sort((a, b) => b.count - a.count);
  },
  
  categorizeEndpoints(endpointsSet) {
    const categories = {
      video: [],
      user: [],
      channel: [],
      playlist: [],
      search: [],
      live: [],
      analytics: [],
      upload: [],
      other: []
    };
    
    const endpoints = Array.from(endpointsSet);
    
    endpoints.forEach(endpoint => {
      if (endpoint.includes('/watch') || endpoint.includes('/v/')) {
        categories.video.push(endpoint);
      } else if (endpoint.includes('/user/') || endpoint.includes('/c/')) {
        categories.user.push(endpoint);
      } else if (endpoint.includes('/channel/')) {
        categories.channel.push(endpoint);
      } else if (endpoint.includes('/playlist')) {
        categories.playlist.push(endpoint);
      } else if (endpoint.includes('/search')) {
        categories.search.push(endpoint);
      } else if (endpoint.includes('/live/')) {
        categories.live.push(endpoint);
      } else if (endpoint.includes('/analytics') || endpoint.includes('/stats')) {
        categories.analytics.push(endpoint);
      } else if (endpoint.includes('/upload')) {
        categories.upload.push(endpoint);
      } else {
        categories.other.push(endpoint);
      }
    });
    
    // Подсчет статистики
    const stats = {};
    Object.keys(categories).forEach(category => {
      stats[category] = categories[category].length;
    });
    
    return {
      categories: categories,
      statistics: stats,
      totalEndpoints: endpoints.length
    };
  },
  
  async findAPIVulnerabilities(analysisResults) {
    console.log('Поиск уязвимостей в API...');
    
    const vulnerabilities = {
      security: [],
      performance: [],
      data: [],
      authentication: [],
      rateLimiting: []
    };
    
    // Анализ security vulnerabilities
    vulnerabilities.security = await this.findSecurityVulnerabilities(analysisResults);
    
    // Анализ performance vulnerabilities
    vulnerabilities.performance = this.findPerformanceVulnerabilities(analysisResults);
    
    // Анализ data vulnerabilities
    vulnerabilities.data = this.findDataVulnerabilities(analysisResults);
    
    // Анализ authentication vulnerabilities
    vulnerabilities.authentication = this.findAuthenticationVulnerabilities(analysisResults);
    
    // Анализ rate limiting vulnerabilities
    vulnerabilities.rateLimiting = this.findRateLimitingVulnerabilities(analysisResults);
    
    // Общая оценка
    vulnerabilities.overallRisk = this.calculateOverallRisk(vulnerabilities);
    
    return vulnerabilities;
  },
  
  async findSecurityVulnerabilities(analysisResults) {
    const vulnerabilities = [];
    
    // Проверка на отсутствие HTTPS
    const endpoints = analysisResults.capturedData?.uniqueEndpoints || [];
    
    endpoints.forEach(endpoint => {
      if (endpoint.startsWith('http://') && !endpoint.includes('localhost')) {
        vulnerabilities.push({
          type: 'insecure_protocol',
          endpoint: endpoint,
          severity: 'high',
          description: 'API endpoint использует HTTP вместо HTTPS',
          remediation: 'Перейти на HTTPS протокол'
        });
      }
    });
    
    // Проверка на чувствительные данные в URL
    endpoints.forEach(endpoint => {
      if (endpoint.includes('password=') || endpoint.includes('token=') || endpoint.includes('secret=')) {
        vulnerabilities.push({
          type: 'sensitive_data_in_url',
          endpoint: endpoint,
          severity: 'critical',
          description: 'Чувствительные данные передаются в URL',
          remediation: 'Передать данные в теле запроса или использовать заголовки'
        });
      }
    });
    
    // Проверка CORS политик
    vulnerabilities.push(...await this.checkCORSVulnerabilities(endpoints));
    
    // Проверка на debug endpoints
    endpoints.forEach(endpoint => {
      if (endpoint.includes('debug=true') || endpoint.includes('test=') || endpoint.includes('dev=')) {
        vulnerabilities.push({
          type: 'debug_endpoint_exposed',
          endpoint: endpoint,
          severity: 'medium',
          description: 'Debug endpoint доступен в production',
          remediation: 'Отключить debug endpoints в production среде'
        });
      }
    });
    
    return vulnerabilities;
  },
  
  async checkCORSVulnerabilities(endpoints) {
    const vulnerabilities = [];
    const testEndpoints = endpoints.slice(0, 10); // Тестируем первые 10
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'OPTIONS',
          mode: 'cors'
        });
        
        const headers = response.headers;
        const corsHeaders = {
          'access-control-allow-origin': headers.get('access-control-allow-origin'),
          'access-control-allow-methods': headers.get('access-control-allow-methods'),
          'access-control-allow-headers': headers.get('access-control-allow-headers'),
          'access-control-allow-credentials': headers.get('access-control-allow-credentials')
        };
        
        // Проверка на излишне разрешительную политику CORS
        if (corsHeaders['access-control-allow-origin'] === '*') {
          vulnerabilities.push({
            type: 'overly_permissive_cors',
            endpoint: endpoint,
            severity: 'medium',
            description: 'CORS политика разрешает доступ с любого домена (*)',
            remediation: 'Ограничить доступ конкретными доменами'
          });
        }
        
        if (corsHeaders['access-control-allow-credentials'] === 'true' && 
            corsHeaders['access-control-allow-origin'] === '*') {
          vulnerabilities.push({
            type: 'cors_with_credentials',
            endpoint: endpoint,
            severity: 'high',
            description: 'CORS с credentials=true и origin=* создает уязвимость',
            remediation: 'Не использовать credentials=true с origin=*'
          });
        }
        
      } catch (error) {
        // Пропускаем ошибки CORS
      }
    }
    
    return vulnerabilities;
  },
  
  findPerformanceVulnerabilities(analysisResults) {
    const vulnerabilities = [];
    const requests = analysisResults.capturedData?.requests || [];
    
    // Поиск медленных запросов
    requests.forEach(request => {
      if (request.duration > 5000) { // Более 5 секунд
        vulnerabilities.push({
          type: 'slow_api_endpoint',
          endpoint: request.url,
          duration: request.duration,
          severity: 'medium',
          description: `API endpoint очень медленный: ${request.duration}ms`,
          remediation: 'Оптимизировать обработку запроса, кэширование'
        });
      }
    });
    
    // Поиск больших ответов
    requests.forEach(request => {
      if (request.response && request.response.length > 1024 * 1024) { // Более 1MB
        vulnerabilities.push({
          type: 'large_response_size',
          endpoint: request.url,
          size: request.response.length,
          severity: 'low',
          description: `Большой размер ответа: ${Math.round(request.response.length / 1024)}KB`,
          remediation: 'Добавить пагинацию, сжатие, уменьшить данные'
        });
      }
    });
    
    return vulnerabilities;
  },
  
  findDataVulnerabilities(analysisResults) {
    const vulnerabilities = [];
    const endpoints = analysisResults.capturedData?.uniqueEndpoints || [];
    
    // Проверка на излишнее раскрытие данных
    endpoints.forEach(endpoint => {
      if (endpoint.includes('/api/') && endpoint.includes('all=true') || endpoint.includes('full=true')) {
        vulnerabilities.push({
          type: 'data_overexposure',
          endpoint: endpoint,
          severity: 'medium',
          description: 'Endpoint возвращает все данные без фильтрации',
          remediation: 'Добавить параметры фильтрации и пагинации'
        });
      }
    });
    
    // Проверка на отсутствие валидации
    endpoints.forEach(endpoint => {
      if (endpoint.includes('id=') && endpoint.includes('../../')) {
        vulnerabilities.push({
          type: 'path_traversal_possible',
          endpoint: endpoint,
          severity: 'high',
          description: 'Возможна атака Path Traversal',
          remediation: 'Валидировать входные параметры'
        });
      }
    });
    
    return vulnerabilities;
  },
  
  findAuthenticationVulnerabilities(analysisResults) {
    const vulnerabilities = [];
    
    // Проверка на отсутствие аутентификации
    const endpoints = analysisResults.capturedData?.uniqueEndpoints || [];
    
    endpoints.forEach(endpoint => {
      if (endpoint.includes('/api/') && !endpoint.includes('/public/')) {
        // Проверяем, требует ли endpoint аутентификации
        if (!this.requiresAuthentication(endpoint)) {
          vulnerabilities.push({
            type: 'missing_authentication',
            endpoint: endpoint,
            severity: 'high',
            description: 'API endpoint не требует аутентификации',
            remediation: 'Добавить проверку аутентификации'
          });
        }
      }
    });
    
    // Проверка на слабые токены
    const requests = analysisResults.capturedData?.requests || [];
    
    requests.forEach(request => {
      if (request.url.includes('token=')) {
        const tokenMatch = request.url.match(/token=([^&]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          if (token.length < 32) {
            vulnerabilities.push({
              type: 'weak_token',
              endpoint: request.url,
              severity: 'high',
              description: 'Используется короткий или слабый токен',
              remediation: 'Использовать JWT или длинные случайные токены'
            });
          }
        }
      }
    });
    
    return vulnerabilities;
  },
  
  requiresAuthentication(endpoint) {
    // Эвристическая проверка на аутентификацию
    const authIndicators = [
      '/private/',
      '/secure/',
      '/user/',
      '/account/',
      '/profile/',
      '/settings/',
      '/upload/',
      '/delete/',
      '/edit/'
    ];
    
    return authIndicators.some(indicator => endpoint.includes(indicator));
  },
  
  findRateLimitingVulnerabilities(analysisResults) {
    const vulnerabilities = [];
    const patterns = analysisResults.patterns?.timing || {};
    
    // Проверка на отсутствие rate limiting
    if (!patterns.isRegular && patterns.burstDetected && patterns.burstDetected.length > 0) {
      vulnerabilities.push({
        type: 'missing_rate_limiting',
        severity: 'medium',
        description: 'Обнаружены burst запросы без ограничений скорости',
        remediation: 'Добавить rate limiting для API endpoints',
        bursts: patterns.burstDetected.length
      });
    }
    
    return vulnerabilities;
  },
  
  calculateOverallRisk(vulnerabilities) {
    const severityScores = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };
    
    let totalScore = 0;
    let totalVulnerabilities = 0;
    
    Object.values(vulnerabilities).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(vuln => {
          totalScore += severityScores[vuln.severity] || 0;
          totalVulnerabilities++;
        });
      }
    });
    
    if (totalVulnerabilities === 0) return 0;
    
    const averageScore = totalScore / totalVulnerabilities;
    
    if (averageScore >= 75) return 'critical';
    if (averageScore >= 50) return 'high';
    if (averageScore >= 25) return 'medium';
    return 'low';
  },
  
  generateAPIReports(capturedData, analysisResults, vulnerabilities) {
    const reports = {
      summary: this.generateSummaryReport(capturedData, vulnerabilities),
      security: this.generateSecurityReport(vulnerabilities.security),
      performance: this.generatePerformanceReport(capturedData, vulnerabilities.performance),
      endpoints: this.generateEndpointsReport(capturedData),
      recommendations: this.generateRecommendationsReport(vulnerabilities)
    };
    
    // Экспорт в различные форматы
    reports.exports = {
      json: this.exportToJSON(capturedData, analysisResults, vulnerabilities),
      csv: this.exportToCSV(capturedData),
      html: this.exportToHTML(reports),
      markdown: this.exportToMarkdown(reports)
    };
    
    return reports;
  },
  
  generateSummaryReport(capturedData, vulnerabilities) {
    return {
      timestamp: new Date().toISOString(),
      duration: capturedData.endTime ? 
        new Date(capturedData.endTime) - new Date(capturedData.startTime) : 0,
      totalRequests: capturedData.totalRequests || 0,
      uniqueEndpoints: capturedData.uniqueEndpoints?.length || 0,
      vulnerabilitiesFound: Object.values(vulnerabilities).flat().length,
      overallRisk: vulnerabilities.overallRisk || 'unknown',
      topEndpoints: capturedData.uniqueEndpoints?.slice(0, 10) || [],
      mostFrequentRequest: this.getMostFrequentRequest(capturedData.requests)
    };
  },
  
  getMostFrequentRequest(requests) {
    if (!requests || requests.length === 0) return null;
    
    const frequency = {};
    requests.forEach(request => {
      const url = request.url.split('?')[0];
      frequency[url] = (frequency[url] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])[0];
    
    return mostFrequent ? {
      endpoint: mostFrequent[0],
      count: mostFrequent[1]
    } : null;
  },
  
  generateSecurityReport(securityVulnerabilities) {
    return {
      total: securityVulnerabilities.length,
      bySeverity: this.groupBySeverity(securityVulnerabilities),
      critical: securityVulnerabilities.filter(v => v.severity === 'critical'),
      high: securityVulnerabilities.filter(v => v.severity === 'high'),
      medium: securityVulnerabilities.filter(v => v.severity === 'medium'),
      low: securityVulnerabilities.filter(v => v.severity === 'low')
    };
  },
  
  groupBySeverity(vulnerabilities) {
    const groups = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    vulnerabilities.forEach(vuln => {
      if (groups[vuln.severity] !== undefined) {
        groups[vuln.severity]++;
      }
    });
    
    return groups;
  },
  
  generatePerformanceReport(capturedData, performanceVulnerabilities) {
    const requests = capturedData.requests || [];
    const durations = requests.map(r => r.duration || 0).filter(d => d > 0);
    
    const avgDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    
    return {
      totalRequests: requests.length,
      averageDuration: avgDuration,
      maxDuration: maxDuration,
      slowRequests: requests.filter(r => (r.duration || 0) > 1000).length,
      vulnerabilities: performanceVulnerabilities,
      performanceScore: this.calculatePerformanceScore(avgDuration, maxDuration)
    };
  },
  
  calculatePerformanceScore(avgDuration, maxDuration) {
    let score = 100;
    
    if (avgDuration > 5000) score -= 40;
    else if (avgDuration > 2000) score -= 20;
    else if (avgDuration > 1000) score -= 10;
    
    if (maxDuration > 10000) score -= 30;
    else if (maxDuration > 5000) score -= 15;
    
    return Math.max(0, score);
  },
  
  generateEndpointsReport(capturedData) {
    const categories = capturedData.endpointCategories || { categories: {}, statistics: {} };
    
    return {
      totalEndpoints: categories.totalEndpoints || 0,
      byCategory: categories.statistics || {},
      topCategories: this.getTopCategories(categories.statistics),
      mostComplexEndpoints: this.getMostComplexEndpoints(capturedData.requests),
      endpointPatterns: capturedData.patterns || {}
    };
  },
  
  getTopCategories(statistics) {
    if (!statistics) return [];
    
    return Object.entries(statistics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  },
  
  getMostComplexEndpoints(requests) {
    if (!requests) return [];
    
    // Оцениваем сложность по размеру ответа и структуре
    const scoredRequests = requests.map(request => {
      let complexityScore = 0;
      
      if (request.response) {
        // Оценка по размеру
        complexityScore += Math.min(50, request.response.length / 1024);
        
        // Оценка по структуре (если JSON)
        try {
          const json = JSON.parse(request.response);
          if (typeof json === 'object') {
            complexityScore += this.assessJSONComplexity(json);
          }
        } catch (e) {}
      }
      
      return {
        endpoint: request.url,
        complexityScore: complexityScore,
        duration: request.duration || 0
      };
    });
    
    return scoredRequests
      .sort((a, b) => b.complexityScore - a.complexityScore)
      .slice(0, 10);
  },
  
  assessJSONComplexity(json) {
    let score = 0;
    
    function traverse(obj, depth = 0) {
      if (depth > 5) return;
      
      if (Array.isArray(obj)) {
        score += Math.min(20, obj.length * 0.5);
        obj.forEach(item => traverse(item, depth + 1));
      } else if (typeof obj === 'object' && obj !== null) {
        score += Object.keys(obj).length;
        Object.values(obj).forEach(value => traverse(value, depth + 1));
      }
    }
    
    traverse(json);
    return Math.min(50, score * 0.1);
  },
  
  generateRecommendationsReport(vulnerabilities) {
    const allVulnerabilities = Object.values(vulnerabilities).flat();
    
    // Группировка рекомендаций по приоритету
    const recommendations = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    allVulnerabilities.forEach(vuln => {
      if (vuln.remediation) {
        recommendations[vuln.severity].push({
          issue: vuln.description,
          remediation: vuln.remediation,
          endpoint: vuln.endpoint || 'N/A'
        });
      }
    });
    
    return {
      totalRecommendations: Object.values(recommendations).flat().length,
      byPriority: recommendations,
      immediateActions: [...recommendations.critical, ...recommendations.high].slice(0, 5),
      timeline: this.generateRemediationTimeline(recommendations)
    };
  },
  
  generateRemediationTimeline(recommendations) {
    return {
      immediate: {
        description: 'В течение 24 часов',
        items: recommendations.critical.slice(0, 3)
      },
      shortTerm: {
        description: 'В течение недели',
        items: recommendations.high.slice(0, 5)
      },
      mediumTerm: {
        description: 'В течение месяца',
        items: recommendations.medium.slice(0, 10)
      },
      longTerm: {
        description: 'В течение квартала',
        items: recommendations.low.slice(0, 15)
      }
    };
  },
  
  exportToJSON(capturedData, analysisResults, vulnerabilities) {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'YouTube API Interceptor',
        version: '2.0'
      },
      capturedData: {
        ...capturedData,
        endpoints: Array.from(capturedData.endpoints || [])
      },
      analysis: analysisResults,
      vulnerabilities: vulnerabilities,
      summary: this.generateSummaryReport(capturedData, vulnerabilities)
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  exportToCSV(capturedData) {
    const requests = capturedData.requests || [];
    
    if (requests.length === 0) return '';
    
    // Заголовки CSV
    const headers = ['URL', 'Method', 'Duration', 'Size', 'Status', 'Timestamp'];
    const rows = [headers.join(',')];
    
    // Данные
    requests.forEach(request => {
      const row = [
        `"${request.url}"`,
        request.method || 'GET',
        request.duration || 0,
        request.size || 0,
        request.status || 0,
        new Date(request.startTime).toISOString()
      ];
      
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  },
  
  exportToHTML(reports) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>YouTube API Interceptor Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #ff0000; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .vulnerability { padding: 10px; margin: 5px 0; border-left: 4px solid #ff0000; }
        .critical { border-color: #ff0000; background: #ffe6e6; }
        .high { border-color: #ff6600; background: #fff0e6; }
        .medium { border-color: #ffcc00; background: #fff9e6; }
        .low { border-color: #00cc00; background: #e6ffe6; }
        .endpoint-list { font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>YouTube API Interceptor Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <p>Total Requests: ${reports.summary.totalRequests || 0}</p>
        <p>Unique Endpoints: ${reports.summary.uniqueEndpoints || 0}</p>
        <p>Overall Risk: ${reports.summary.overallRisk || 'unknown'}</p>
    </div>
    
    <div class="section">
        <h2>Security Vulnerabilities</h2>
        <p>Total: ${reports.security.total || 0}</p>
        ${Object.entries(reports.security.bySeverity || {}).map(([severity, count]) => `
            <p>${severity}: ${count}</p>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Top Endpoints</h2>
        <div class="endpoint-list">
            ${(reports.summary.topEndpoints || []).map(endpoint => `
                <div>${endpoint}</div>
            `).join('')}
        </div>
    </div>
    
    <div class="section">
        <h2>Immediate Actions</h2>
        ${(reports.recommendations.immediateActions || []).map(action => `
            <div class="vulnerability critical">
                <strong>${action.issue}</strong><br>
                <em>Endpoint: ${action.endpoint}</em><br>
                ${action.remediation}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  },
  
  exportToMarkdown(reports) {
    return `# YouTube API Interceptor Report

## Summary
- **Generated**: ${new Date().toISOString()}
- **Total Requests**: ${reports.summary.totalRequests || 0}
- **Unique Endpoints**: ${reports.summary.uniqueEndpoints || 0}
- **Overall Risk**: ${reports.summary.overallRisk || 'unknown'}

## Security Vulnerabilities
**Total**: ${reports.security.total || 0}

${Object.entries(reports.security.bySeverity || {}).map(([severity, count]) => `
- **${severity}**: ${count}
`).join('')}

## Top 10 Endpoints
${(reports.summary.topEndpoints || []).slice(0, 10).map((endpoint, i) => `
${i + 1}. ${endpoint}
`).join('')}

## Immediate Actions (Critical/High Priority)
${(reports.recommendations.immediateActions || []).map(action => `
### ${action.issue}
**Endpoint**: ${action.endpoint}
**Remediation**: ${action.remediation}

`).join('')}

## Performance Summary
- **Average Request Duration**: ${reports.performance.averageDuration?.toFixed(2) || 0}ms
- **Max Duration**: ${reports.performance.maxDuration || 0}ms
- **Performance Score**: ${reports.performance.performanceScore || 0}/100

---
*Report generated by YouTube API Interceptor v2.0*
`;
  },
  
  getAPIRecommendations(vulnerabilities) {
    const recommendations = [];
    
    if (vulnerabilities.overallRisk === 'critical' || vulnerabilities.overallRisk === 'high') {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Немедленно устранить уязвимости безопасности',
        description: 'Обнаружены критические уязвимости, требующие срочного вмешательства'
      });
    }
    
    if (vulnerabilities.security.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Усилить меры безопасности API',
        description: `Найдено ${vulnerabilities.security.length} уязвимостей безопасности`
      });
    }
    
    if (vulnerabilities.authentication.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Пересмотреть систему аутентификации',
        description: 'Обнаружены проблемы с аутентификацией API'
      });
    }
    
    if (vulnerabilities.rateLimiting.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Добавить или улучшить rate limiting',
        description: 'Обнаружены возможности для DoS атак'
      });
    }
    
    // Общие рекомендации
    recommendations.push({
      priority: 'LOW',
      action: 'Регулярно обновлять API Interceptor',
      description: 'Для поддержания актуальности обнаружения уязвимостей'
    });
    
    return recommendations;
  },
  
  // Вспомогательные методы
  analyzeScriptContent(scriptContent) {
    // Поиск API вызовов в скриптах
    const apiCalls = this.findAPICallsInScript(scriptContent);
    
    if (apiCalls.length > 0) {
      this.saveScriptAnalysis({
        content: scriptContent.substring(0, 1000),
        apiCalls: apiCalls,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  findAPICallsInScript(scriptContent) {
    const apiCalls = [];
    
    // Поиск fetch вызовов
    const fetchPattern = /fetch\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = fetchPattern.exec(scriptContent)) !== null) {
      apiCalls.push({
        type: 'fetch',
        url: match[1],
        line: this.getLineNumber(scriptContent, match.index)
      });
    }
    
    // Поиск XMLHttpRequest
    const xhrPattern = /\.open\s*\(\s*['"](GET|POST|PUT|DELETE)['"]\s*,\s*['"]([^'"]+)['"]/g;
    while ((match = xhrPattern.exec(scriptContent)) !== null) {
      apiCalls.push({
        type: 'xhr',
        method: match[1],
        url: match[2],
        line: this.getLineNumber(scriptContent, match.index)
      });
    }
    
    // Поиск API endpoints в строках
    const endpointPattern = /https?:\/\/[^/]+\/(youtubei\/v1\/|api\/|live\/)[^'"]+/g;
    while ((match = endpointPattern.exec(scriptContent)) !== null) {
      apiCalls.push({
        type: 'endpoint_reference',
        url: match[0],
        line: this.getLineNumber(scriptContent, match.index)
      });
    }
    
    return apiCalls;
  },
  
  getLineNumber(text, position) {
    return text.substring(0, position).split('\n').length;
  },
  
  saveScriptAnalysis(analysis) {
    const storageKey = 'api_interceptor_scripts';
    let scripts = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        scripts = JSON.parse(stored);
      }
    } catch (e) {}
    
    scripts.push(analysis);
    
    // Ограничение размера
    if (scripts.length > 50) {
      scripts = scripts.slice(-25);
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(scripts));
    } catch (e) {}
  },
  
  analyzeIFrame(iframe) {
    const iframeAnalysis = {
      src: iframe.src,
      attributes: {},
      timestamp: new Date().toISOString()
    };
    
    // Сбор атрибутов iframe
    Array.from(iframe.attributes).forEach(attr => {
      iframeAnalysis.attributes[attr.name] = attr.value;
    });
    
    // Проверка на YouTube iframe API
    if (iframe.src.includes('youtube.com/embed')) {
      iframeAnalysis.type = 'youtube_embed';
      iframeAnalysis.videoId = this.extractVideoIdFromURL(iframe.src);
    }
    
    this.saveIFrameAnalysis(iframeAnalysis);
  },
  
  extractVideoIdFromURL(url) {
    const patterns = [
      /embed\/([^?]+)/,
      /v=([^&]+)/,
      /youtu\.be\/([^?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  },
  
  saveIFrameAnalysis(analysis) {
    const storageKey = 'api_interceptor_iframes';
    let iframes = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        iframes = JSON.parse(stored);
      }
    } catch (e) {}
    
    iframes.push(analysis);
    
    // Ограничение размера
    if (iframes.length > 20) {
      iframes = iframes.slice(-10);
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(iframes));
    } catch (e) {}
  },
  
  setupFilters(system) {
    // Динамическая фильтрация запросов
    const originalFilters = { ...system.filters };
    
    // Обновление фильтров на основе собранных данных
    setInterval(() => {
      this.updateFilters(system, originalFilters);
    }, 30000);
  },
  
  updateFilters(system, originalFilters) {
    // Анализ собранных данных для улучшения фильтров
    const capturedEndpoints = this.getCapturedEndpoints();
    
    if (capturedEndpoints.length > 0) {
      // Добавление новых endpoints в фильтры
      capturedEndpoints.forEach(endpoint => {
        if (!system.filters.endpoints.includes(endpoint)) {
          system.filters.endpoints.push(endpoint);
        }
      });
      
      // Ограничение размера списка endpoints
      if (system.filters.endpoints.length > 50) {
        system.filters.endpoints = system.filters.endpoints.slice(-30);
      }
    }
  },
  
  getCapturedEndpoints() {
    const storageKey = 'api_interceptor_requests';
    let endpoints = new Set();
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const requests = JSON.parse(stored);
        requests.forEach(request => {
          if (request.url) {
            endpoints.add(request.url.split('?')[0]);
          }
        });
      }
    } catch (e) {}
    
    return Array.from(endpoints);
  },
  
  async initStorage(system) {
    // Инициализация хранилища данных
    const storageKeys = [
      'api_interceptor_requests',
      'api_interceptor_websockets',
      'api_interceptor_beacons',
      'api_interceptor_scripts',
      'api_interceptor_iframes'
    ];
    
    storageKeys.forEach(key => {
      try {
        const existing = localStorage.getItem(key);
        if (!existing) {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } catch (e) {
        console.warn(`Не удалось инициализировать хранилище ${key}:`, e);
      }
    });
    
    system.storage.initialized = true;
    system.storage.keys = storageKeys;
  }
};

console.log('✅ API Interceptor Exploit модуль загружен (обновленная версия)');
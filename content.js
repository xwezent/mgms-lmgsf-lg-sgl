// YouTube Ultimate Exploits v2.1 - Main Content Script
// Оптимизирован под 15+ эксплойтов
console.log('🔧 Content Script: YouTube Ultimate Exploits v2.1 загружен');

const EXPLOIT_CONFIG = {
    // 📊 СТАТИСТИКА И ДАННЫЕ
    'video_stats': { module: 'video_stats', category: 'data' },
    'watchtime_exploit': { module: 'watchtime_exploit', category: 'data' },
    'channel_analyzer': { module: 'channel_analyzer', category: 'data' },
    'api_interceptor': { module: 'api_interceptor', category: 'data' },
    
    // ⚡ МАНИПУЛЯЦИИ
    'view_bot': { module: 'view_bot', category: 'manipulation' },
    'recommendation_killer': { module: 'recommendation_killer', category: 'manipulation' },
    'subscription_exploit': { module: 'subscription_exploit', category: 'manipulation' },
    'comment_bot': { module: 'comment_bot', category: 'manipulation' },
    
    // 🔧 СИСТЕМНЫЕ ЭКСПЛОЙТЫ
    'upload_exploit': { module: 'upload_exploit', category: 'system' },
    'video_downloader': { module: 'video_downloader', category: 'system' },
    'live_stream_exploit': { module: 'live_stream_exploit', category: 'system' },
    'cpn_generator': { module: 'cpn_generator', category: 'system' },
    
    // 🛡️ ОБХОД ОГРАНИЧЕНИЙ
    'adblock': { module: 'adblock', category: 'bypass' },
    'age_restriction_bypass': { module: 'age_restriction_bypass', category: 'bypass' },
    'monetization_bypass': { module: 'monetization_bypass', category: 'bypass' }
};

class ExploitManager {
    constructor() {
        this.modules = new Map();
        this.activeExploits = new Set();
        this.sessionData = {};
        this.init();
    }

    async init() {
        console.log('🔄 Инициализация ExploitManager...');
        await this.setupMessageListener();
        await this.setupDOMObserver();
        await this.collectInitialData();
    }

    async setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleRequest(request, sender, sendResponse).catch(console.error);
            return true;
        });
    }

    async handleRequest(request, sender, sendResponse) {
        try {
            switch(request.action) {
                case 'run_exploit':
                    const result = await this.executeExploit(request.exploitName, request.params);
                    sendResponse(result);
                    break;
                    
                case 'get_status':
                    const status = await this.getSystemStatus();
                    sendResponse(status);
                    break;
                    
                case 'analyze_page':
                    const analysis = await this.analyzeCurrentPage();
                    sendResponse(analysis);
                    break;
                    
                case 'stop_exploit':
                    const stopped = this.stopExploit(request.exploitName);
                    sendResponse({ success: stopped });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action', action: request.action });
            }
        } catch (error) {
            console.error('Ошибка обработки запроса:', error);
            sendResponse({ error: error.message });
        }
    }

    async executeExploit(exploitName, params) {
        if (!EXPLOIT_CONFIG[exploitName]) {
            throw new Error(`Эксплойт ${exploitName} не найден`);
        }

        try {
            // Загружаем модуль, если еще не загружен
            if (!this.modules.has(exploitName)) {
                await this.loadModule(exploitName);
            }

            const module = this.modules.get(exploitName);
            this.activeExploits.add(exploitName);

            console.log(`🚀 Запуск эксплойта: ${exploitName}`, params);
            const result = await module.execute(params || {});

            // Сохраняем результат
            this.sessionData[exploitName] = {
                ...result,
                executedAt: new Date().toISOString(),
                params: params
            };

            // Логируем успешное выполнение
            await this.logExecution(exploitName, result);

            return {
                success: true,
                exploit: exploitName,
                data: result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Ошибка выполнения ${exploitName}:`, error);
            
            await this.logError(exploitName, error);
            
            return {
                success: false,
                exploit: exploitName,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
        }
    }

    async loadModule(exploitName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(`exploits/${exploitName}.js`);
            script.type = 'module';
            
            script.onload = () => {
                if (window[`exploit_${exploitName}`]) {
                    this.modules.set(exploitName, window[`exploit_${exploitName}`]);
                    console.log(`✅ Модуль ${exploitName} загружен`);
                    resolve();
                } else {
                    reject(new Error(`Модуль ${exploitName} не экспортировал себя в window`));
                }
                script.remove();
            };
            
            script.onerror = () => {
                script.remove();
                reject(new Error(`Не удалось загрузить модуль ${exploitName}`));
            };
            
            document.head.appendChild(script);
        });
    }

    async collectInitialData() {
        // Собираем базовые данные о странице
        this.sessionData.pageInfo = {
            url: window.location.href,
            videoId: this.extractVideoId(),
            channelId: this.extractChannelId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Собираем ytInitialData если есть
        this.sessionData.ytData = this.getYouTubeData();

        // Инициализируем перехватчики
        this.setupNetworkInterceptors();
    }

    setupNetworkInterceptors() {
        // Перехват XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        const self = this;
        
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(method, url, async, user, password) {
                this._url = url;
                this._method = method;
                
                // Логируем YouTube API запросы
                if (url && url.includes('youtube.com')) {
                    self.logAPIRequest(method, url);
                }
                
                return originalOpen.apply(this, arguments);
            };
            
            xhr.send = function(body) {
                if (this._url && this._url.includes('youtube.com')) {
                    self.logAPIRequest(this._method, this._url, body);
                }
                return originalSend.apply(this, arguments);
            };
            
            return xhr;
        };
        
        // Перехват Fetch API
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('youtube.com')) {
                self.logAPIRequest(args[1]?.method || 'GET', url);
            }
            return originalFetch.apply(this, args);
        };
    }

    logAPIRequest(method, url, body = null) {
        if (!this.sessionData.apiRequests) {
            this.sessionData.apiRequests = [];
        }
        
        this.sessionData.apiRequests.push({
            method,
            url: url.substring(0, 500), // Ограничиваем длину
            timestamp: new Date().toISOString(),
            body: body ? String(body).substring(0, 1000) : null
        });
        
        // Ограничиваем размер лога
        if (this.sessionData.apiRequests.length > 1000) {
            this.sessionData.apiRequests = this.sessionData.apiRequests.slice(-500);
        }
    }

    async logExecution(exploitName, result) {
        if (!this.sessionData.executions) {
            this.sessionData.executions = [];
        }
        
        this.sessionData.executions.push({
            exploit: exploitName,
            success: result.success !== false,
            timestamp: new Date().toISOString(),
            summary: this.createExecutionSummary(result)
        });
    }

    async logError(exploitName, error) {
        if (!this.sessionData.errors) {
            this.sessionData.errors = [];
        }
        
        this.sessionData.errors.push({
            exploit: exploitName,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    createExecutionSummary(result) {
        if (!result) return 'No result';
        
        // Создаем краткое описание результата
        const keys = Object.keys(result);
        const summary = {};
        
        keys.slice(0, 5).forEach(key => {
            if (typeof result[key] !== 'object' || result[key] === null) {
                summary[key] = result[key];
            } else {
                summary[key] = `[Object: ${Object.keys(result[key]).length} keys]`;
            }
        });
        
        return summary;
    }

    async getSystemStatus() {
        return {
            activeExploits: Array.from(this.activeExploits),
            loadedModules: Array.from(this.modules.keys()),
            pageInfo: this.sessionData.pageInfo,
            executions: this.sessionData.executions?.length || 0,
            errors: this.sessionData.errors?.length || 0,
            apiRequests: this.sessionData.apiRequests?.length || 0,
            memoryUsage: this.getMemoryUsage(),
            timestamp: new Date().toISOString()
        };
    }

    async analyzeCurrentPage() {
        const videoId = this.extractVideoId();
        const channelId = this.extractChannelId();
        const ytData = this.getYouTubeData();
        
        return {
            videoId,
            channelId,
            hasVideo: !!videoId,
            hasChannel: !!channelId,
            ytDataAvailable: !!ytData,
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString()
        };
    }

    stopExploit(exploitName) {
        if (this.activeExploits.has(exploitName)) {
            this.activeExploits.delete(exploitName);
            return true;
        }
        return false;
    }

    // Вспомогательные методы
    extractVideoId() {
        const url = window.location.href;
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    extractChannelId() {
        const url = window.location.href;
        const match = url.match(/\/channel\/([^\/]+)/) || 
                      url.match(/\/c\/([^\/]+)/) || 
                      url.match(/\/@([^\/]+)/);
        return match ? match[1] : null;
    }

    getYouTubeData() {
        // Поиск ytInitialData
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            if (script.textContent.includes('ytInitialData')) {
                try {
                    const match = script.textContent.match(/ytInitialData\s*=\s*({.+?});/s);
                    if (match) {
                        return JSON.parse(match[1]);
                    }
                } catch(e) {}
            }
        }
        return null;
    }

    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return {
                usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
                totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
                jsHeapSizeLimit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return { error: 'Memory API not available' };
    }

    async setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleDOMChanges(mutation.addedNodes);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    handleDOMChanges(addedNodes) {
        // Обработка изменений DOM (можно добавить логику для конкретных эксплойтов)
        addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Проверяем, не добавились ли рекламные элементы
                if (node.querySelector && (
                    node.querySelector('.video-ads') ||
                    node.querySelector('.ytp-ad-module')
                )) {
                    console.log('[DOM Observer] Обнаружены рекламные элементы');
                }
            }
        });
    }
}

// Автоматическая инициализация
(function() {
    // Ждем полной загрузки страницы
    if (document.readyState === 'complete') {
        setTimeout(() => {
            window.YTExploitManager = new ExploitManager();
            console.log('✅ ExploitManager инициализирован');
        }, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.YTExploitManager = new ExploitManager();
                console.log('✅ ExploitManager инициализирован');
            }, 1000);
        });
    }
})();
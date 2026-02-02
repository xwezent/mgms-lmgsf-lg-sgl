// YouTube Ultimate Exploits v2.1 - Popup Controller
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Popup Controller инициализирован');
    
    // Конфигурация всех эксплойтов
    const EXPLOITS = {
        // 📊 СТАТИСТИКА И ДАННЫЕ
        'video_stats': {
            title: '📊 Полная статистика видео',
            description: 'Извлечение всей статистики, доступной автору в YouTube Studio',
            category: 'data',
            icon: '📊',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'depth', type: 'select', label: 'Глубина извлечения', options: [
                    { value: 'basic', label: 'Базовая статистика' },
                    { value: 'advanced', label: 'Расширенная (все данные)' },
                    { value: 'deep', label: 'Глубокая (скрытые метрики)' },
                    { value: 'full', label: 'Полная (все данные + анализ)' }
                ]}
            ]
        },
        
        'watchtime_exploit': {
            title: '⏱ Watchtime эксплойт',
            description: 'Манипуляция статистикой просмотров через IDOR уязвимости',
            category: 'data',
            icon: '⏱',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'intensity', type: 'select', label: 'Интенсивность', options: [
                    { value: 'low', label: 'Низкая' },
                    { value: 'medium', label: 'Средняя' },
                    { value: 'high', label: 'Высокая' },
                    { value: 'extreme', label: 'Экстремальная' }
                ]}
            ]
        },
        
        'channel_analyzer': {
            title: '📈 Анализ канала',
            description: 'Получение всей статистики и метрик канала',
            category: 'data',
            icon: '📈',
            params: [
                { id: 'channelUrl', type: 'text', label: 'URL канала', placeholder: 'https://www.youtube.com/@channel' },
                { id: 'depth', type: 'select', label: 'Глубина анализа', options: [
                    { value: 'basic', label: 'Базовый' },
                    { value: 'advanced', label: 'Расширенный' },
                    { value: 'deep', label: 'Глубокий' }
                ]}
            ]
        },
        
        'api_interceptor': {
            title: '🔌 Перехват API',
            description: 'Перехват и анализ всех API запросов YouTube',
            category: 'data',
            icon: '🔌',
            params: []
        },
        
        // ⚡ МАНИПУЛЯЦИИ
        'view_bot': {
            title: '📈 Накрутка просмотров',
            description: 'Экспериментальная накрутка просмотров через API уязвимости',
            category: 'manipulation',
            icon: '📈',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'views', type: 'number', label: 'Количество просмотров', defaultValue: 1000 },
                { id: 'method', type: 'select', label: 'Метод накрутки', options: [
                    { value: 'stealth', label: 'Стелс-режим' },
                    { value: 'aggressive', label: 'Агрессивный' },
                    { value: 'mixed', label: 'Смешанный' },
                    { value: 'smart', label: 'Умный (AI)' }
                ]}
            ]
        },
        
        'recommendation_killer': {
            title: '💀 Убийство рекомендаций',
            description: 'Ухудшение статистики видео для исключения из рекомендаций',
            category: 'manipulation',
            icon: '💀',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'intensity', type: 'select', label: 'Интенсивность', options: [
                    { value: 'low', label: 'Низкая' },
                    { value: 'medium', label: 'Средняя' },
                    { value: 'high', label: 'Высокая' },
                    { value: 'extreme', label: 'Экстремальная' }
                ]}
            ]
        },
        
        'subscription_exploit': {
            title: '📌 Эксплойт подписок',
            description: 'Манипуляция подписками и отписками',
            category: 'manipulation',
            icon: '📌',
            params: [
                { id: 'channelUrl', type: 'text', label: 'URL канала', placeholder: 'https://www.youtube.com/@channel' },
                { id: 'action', type: 'select', label: 'Действие', options: [
                    { value: 'subscribe', label: 'Массовая подписка' },
                    { value: 'unsubscribe', label: 'Массовая отписка' },
                    { value: 'analyze', label: 'Анализ подписчиков' }
                ]}
            ]
        },
        
        'comment_bot': {
            title: '💬 Комментарии бот',
            description: 'Автоматическая публикация и управление комментариями',
            category: 'manipulation',
            icon: '💬',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'mode', type: 'select', label: 'Режим работы', options: [
                    { value: 'post', label: 'Публикация' },
                    { value: 'reply', label: 'Ответы' },
                    { value: 'spam', label: 'Спам' },
                    { value: 'delete', label: 'Удаление' }
                ]},
                { id: 'count', type: 'number', label: 'Количество', defaultValue: 10 }
            ]
        },
        
        // 🔧 СИСТЕМНЫЕ ЭКСПЛОЙТЫ
        'upload_exploit': {
            title: '📤 Эксплойт загрузки',
            description: 'Обход ограничений загрузки видео (длительность, качество, размер)',
            category: 'system',
            icon: '📤',
            params: [
                { id: 'videoFile', type: 'file', label: 'Видео файл' },
                { id: 'methods', type: 'multiselect', label: 'Методы обхода', options: [
                    { value: 'duration', label: 'Обход длительности' },
                    { value: 'size', label: 'Обход размера' },
                    { value: 'quality', label: 'Обход качества' },
                    { value: 'verification', label: 'Обход проверки' }
                ]}
            ]
        },
        
        'video_downloader': {
            title: '💾 Скачивание видео',
            description: 'Скачивание видео в максимальном качестве, обход ограничений',
            category: 'system',
            icon: '💾',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'quality', type: 'select', label: 'Качество', options: [
                    { value: 'max', label: 'Максимальное' },
                    { value: '4k', label: '4K' },
                    { value: '1080p', label: '1080p' },
                    { value: '720p', label: '720p' }
                ]}
            ]
        },
        
        'live_stream_exploit': {
            title: '📡 Эксплойт стримов',
            description: 'Манипуляция живыми трансляциями и статистикой стримов',
            category: 'system',
            icon: '📡',
            params: [
                { id: 'streamUrl', type: 'text', label: 'URL стрима', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'action', type: 'select', label: 'Действие', options: [
                    { value: 'viewer_bot', label: 'Бот зрителей' },
                    { value: 'chat_control', label: 'Контроль чата' },
                    { value: 'stats_manipulation', label: 'Манипуляция статистикой' }
                ]}
            ]
        },
        
        'cpn_generator': {
            title: '🔑 Генератор CPN',
            description: 'Генерация предсказуемых CPN параметров для манипуляции статистикой',
            category: 'system',
            icon: '🔑',
            params: [
                { id: 'quantity', type: 'number', label: 'Количество CPN', defaultValue: 100 },
                { id: 'pattern', type: 'select', label: 'Паттерн генерации', options: [
                    { value: 'standard', label: 'Стандартный' },
                    { value: 'timestamp', label: 'На основе времени' },
                    { value: 'random', label: 'Случайный' },
                    { value: 'encoded', label: 'Закодированный' }
                ]}
            ]
        },
        
        // 🛡️ ОБХОД ОГРАНИЧЕНИЙ
        'adblock': {
            title: '🚫 Блокировщик рекламы',
            description: 'Полная блокировка рекламы и спонсорских блоков',
            category: 'bypass',
            icon: '🚫',
            params: [
                { id: 'mode', type: 'select', label: 'Режим блокировки', options: [
                    { value: 'standard', label: 'Стандартный' },
                    { value: 'aggressive', label: 'Агрессивный' },
                    { value: 'stealth', label: 'Стелс' }
                ]}
            ]
        },
        
        'age_restriction_bypass': {
            title: '🔞 Обход возрастных ограничений',
            description: 'Доступ к возрастно-ограниченному контенту',
            category: 'bypass',
            icon: '🔞',
            params: [
                { id: 'videoUrl', type: 'text', label: 'URL видео', placeholder: 'https://www.youtube.com/watch?v=...' },
                { id: 'method', type: 'select', label: 'Метод обхода', options: [
                    { value: 'cookie', label: 'Через куки' },
                    { value: 'api', label: 'Через API' },
                    { value: 'iframe', label: 'Через iframe' }
                ]}
            ]
        },
        
        'monetization_bypass': {
            title: '💰 Обход монетизации',
            description: 'Просмотр контента без рекламы и ограничений монетизации',
            category: 'bypass',
            icon: '💰',
            params: [
                { id: 'mode', type: 'select', label: 'Режим обхода', options: [
                    { value: 'full', label: 'Полный обход' },
                    { value: 'ads_only', label: 'Только реклама' },
                    { value: 'sponsor_only', label: 'Только спонсоры' },
                    { value: 'stealth', label: 'Стелс-режим' }
                ]}
            ]
        }
    };

    // Класс управления интерфейсом
    class PopupController {
        constructor() {
            this.currentExploit = 'video_stats';
            this.executionHistory = [];
            this.systemStatus = null;
            this.init();
        }

        async init() {
            console.log('🎮 Инициализация PopupController');
            
            // Получаем элементы DOM
            this.elements = this.getDOMElements();
            
            // Настраиваем слушатели событий
            this.setupEventListeners();
            
            // Загружаем системный статус
            await this.loadSystemStatus();
            
            // Строим интерфейс
            this.buildInterface();
            
            // Заполняем URL текущего видео
            await this.fillCurrentURL();
            
            console.log('✅ PopupController готов');
        }

        getDOMElements() {
            return {
                sidebar: document.querySelector('.sidebar'),
                mainContent: document.querySelector('.main-content'),
                executeBtn: document.getElementById('executeBtn'),
                stopBtn: document.getElementById('stopBtn'),
                resetBtn: document.getElementById('resetBtn'),
                resultOutput: document.getElementById('resultOutput'),
                progressBar: document.getElementById('progressBar'),
                terminal: document.getElementById('terminal'),
                exploitTitle: document.getElementById('exploitTitle'),
                exploitDesc: document.getElementById('exploitDesc'),
                clearAllBtn: document.getElementById('clearAll'),
                downloadDataBtn: document.getElementById('downloadData'),
                statusIndicator: document.querySelector('.status-dot')
            };
        }

        setupEventListeners() {
            // Кнопка выполнения
            this.elements.executeBtn.addEventListener('click', () => this.executeCurrentExploit());
            
            // Кнопка остановки
            this.elements.stopBtn.addEventListener('click', () => this.stopExecution());
            
            // Кнопка сброса
            this.elements.resetBtn.addEventListener('click', () => this.resetInterface());
            
            // Кнопки управления
            this.elements.clearAllBtn.addEventListener('click', () => this.clearAllData());
            this.elements.downloadDataBtn.addEventListener('click', () => this.downloadData());
            
            // Слушатель сообщений от content script
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleRuntimeMessage(request, sender, sendResponse);
                return true;
            });
        }

        async loadSystemStatus() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (tab && tab.url.includes('youtube.com')) {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'get_status' });
                    this.systemStatus = response;
                    this.updateStatusIndicator(response);
                }
            } catch (error) {
                console.warn('Не удалось получить статус:', error);
                this.logToTerminal('⚠️ Перейдите на страницу YouTube для активации', 'warning');
            }
        }

        updateStatusIndicator(status) {
            if (!status || !this.elements.statusIndicator) return;
            
            const indicator = this.elements.statusIndicator;
            indicator.classList.remove('active', 'warning', 'error');
            
            if (status.activeExploits && status.activeExploits.length > 0) {
                indicator.classList.add('active');
                indicator.style.animationDuration = '1s';
            } else if (status.errors > 0) {
                indicator.classList.add('warning');
            } else {
                indicator.classList.add('active');
                indicator.style.animationDuration = '2s';
            }
        }

        buildInterface() {
            this.buildSidebar();
            this.buildMainContent();
            this.updateExploitUI(this.currentExploit);
        }

        buildSidebar() {
            const categories = {
                data: '📊 СТАТИСТИКА И ДАННЫЕ',
                manipulation: '⚡ МАНИПУЛЯЦИИ',
                system: '🔧 СИСТЕМНЫЕ ЭКСПЛОЙТЫ',
                bypass: '🛡️ ОБХОД ОГРАНИЧЕНИЙ'
            };

            let sidebarHTML = '';
            
            Object.entries(categories).forEach(([categoryId, categoryName]) => {
                const categoryExploits = Object.entries(EXPLOITS)
                    .filter(([_, config]) => config.category === categoryId)
                    .map(([id, config]) => ({ id, ...config }));
                
                if (categoryExploits.length === 0) return;
                
                sidebarHTML += `
                    <div class="category">
                        <h3>${categoryName}</h3>
                        <ul class="exploit-list">
                            ${categoryExploits.map(exploit => `
                                <li class="exploit-item ${exploit.id === this.currentExploit ? 'active' : ''}" 
                                    data-exploit="${exploit.id}">
                                    ${exploit.icon} ${exploit.title}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });
            
            this.elements.sidebar.innerHTML = sidebarHTML;
            
            // Добавляем обработчики для элементов списка
            this.elements.sidebar.querySelectorAll('.exploit-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const exploitId = e.currentTarget.dataset.exploit;
                    this.switchExploit(exploitId);
                });
            });
        }

        buildMainContent() {
            // Основной контент уже есть в HTML, просто обновляем его
            this.updateControlForm(this.currentExploit);
        }

        switchExploit(exploitId) {
            if (!EXPLOITS[exploitId]) {
                this.logToTerminal(`❌ Эксплойт ${exploitId} не найден`, 'error');
                return;
            }
            
            // Обновляем активный элемент
            this.elements.sidebar.querySelectorAll('.exploit-item').forEach(item => {
                item.classList.toggle('active', item.dataset.exploit === exploitId);
            });
            
            this.currentExploit = exploitId;
            this.updateExploitUI(exploitId);
            this.updateControlForm(exploitId);
        }

        updateExploitUI(exploitId) {
            const exploit = EXPLOITS[exploitId];
            
            if (!exploit) return;
            
            this.elements.exploitTitle.textContent = exploit.title;
            this.elements.exploitDesc.textContent = exploit.description;
            
            // Обновляем прогресс-бар
            const historyEntry = this.executionHistory.find(h => h.exploit === exploitId);
            if (historyEntry && historyEntry.progress) {
                this.elements.progressBar.style.width = `${historyEntry.progress}%`;
            } else {
                this.elements.progressBar.style.width = '0%';
            }
        }

        updateControlForm(exploitId) {
            const exploit = EXPLOITS[exploitId];
            if (!exploit || !exploit.params) return;
            
            const controlsContainer = document.querySelector('.controls');
            if (!controlsContainer) return;
            
            let formHTML = '';
            
            exploit.params.forEach(param => {
                formHTML += this.renderParamInput(param);
            });
            
            // Добавляем кнопки
            formHTML += `
                <div class="progress-bar">
                    <div class="progress" id="progressBar"></div>
                </div>
                
                <div class="buttons">
                    <button class="btn btn-primary" id="executeBtn">Запустить эксплойт</button>
                    <button class="btn btn-secondary" id="stopBtn">Остановить</button>
                    <button class="btn btn-danger" id="resetBtn">Сбросить</button>
                </div>
            `;
            
            controlsContainer.innerHTML = formHTML;
            
            // Обновляем ссылки на элементы
            this.elements.executeBtn = document.getElementById('executeBtn');
            this.elements.stopBtn = document.getElementById('stopBtn');
            this.elements.resetBtn = document.getElementById('resetBtn');
            this.elements.progressBar = document.getElementById('progressBar');
            
            // Перепривязываем обработчики
            this.elements.executeBtn.addEventListener('click', () => this.executeCurrentExploit());
            this.elements.stopBtn.addEventListener('click', () => this.stopExecution());
            this.elements.resetBtn.addEventListener('click', () => this.resetInterface());
        }

        renderParamInput(param) {
            let inputHTML = '';
            
            switch(param.type) {
                case 'text':
                    inputHTML = `
                        <div class="control-group">
                            <label for="${param.id}">${param.label}:</label>
                            <input type="text" id="${param.id}" 
                                   placeholder="${param.placeholder || ''}" 
                                   value="${param.defaultValue || ''}">
                        </div>
                    `;
                    break;
                    
                case 'number':
                    inputHTML = `
                        <div class="control-group">
                            <label for="${param.id}">${param.label}:</label>
                            <input type="number" id="${param.id}" 
                                   value="${param.defaultValue || 0}" 
                                   min="${param.min || 0}" 
                                   max="${param.max || 1000000}">
                        </div>
                    `;
                    break;
                    
                case 'select':
                    const options = param.options.map(opt => 
                        `<option value="${opt.value}">${opt.label}</option>`
                    ).join('');
                    
                    inputHTML = `
                        <div class="control-group">
                            <label for="${param.id}">${param.label}:</label>
                            <select id="${param.id}">
                                ${options}
                            </select>
                        </div>
                    `;
                    break;
                    
                case 'multiselect':
                    const multiOptions = param.options.map(opt => 
                        `<option value="${opt.value}">${opt.label}</option>`
                    ).join('');
                    
                    inputHTML = `
                        <div class="control-group">
                            <label for="${param.id}">${param.label}:</label>
                            <select id="${param.id}" multiple>
                                ${multiOptions}
                            </select>
                        </div>
                    `;
                    break;
                    
                case 'file':
                    inputHTML = `
                        <div class="control-group">
                            <label for="${param.id}">${param.label}:</label>
                            <input type="file" id="${param.id}" accept="video/*">
                        </div>
                    `;
                    break;
            }
            
            return inputHTML;
        }

        async executeCurrentExploit() {
            const exploitId = this.currentExploit;
            const exploit = EXPLOITS[exploitId];
            
            if (!exploit) {
                this.logToTerminal('❌ Эксплойт не найден', 'error');
                return;
            }
            
            try {
                // Собираем параметры
                const params = this.collectParams(exploitId);
                
                // Проверяем обязательные параметры
                const validation = this.validateParams(params, exploit.params);
                if (!validation.valid) {
                    this.logToTerminal(`❌ ${validation.error}`, 'error');
                    return;
                }
                
                // Получаем активную вкладку YouTube
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (!tab || !tab.url.includes('youtube.com')) {
                    this.logToTerminal('⚠️ Перейдите на страницу YouTube', 'warning');
                    return;
                }
                
                // Отправляем команду на выполнение
                this.logToTerminal(`🚀 Запуск ${exploit.title}...`, 'info');
                this.elements.executeBtn.disabled = true;
                this.elements.executeBtn.textContent = 'Выполняется...';
                
                this.updateProgress(10);
                
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'run_exploit',
                    exploitName: exploitId,
                    params: params
                });
                
                this.handleExecutionResponse(response, exploit);
                
            } catch (error) {
                console.error('Ошибка выполнения:', error);
                this.logToTerminal(`❌ Ошибка: ${error.message}`, 'error');
                this.resetExecutionButtons();
            }
        }

        collectParams(exploitId) {
            const exploit = EXPLOITS[exploitId];
            if (!exploit || !exploit.params) return {};
            
            const params = {};
            
            exploit.params.forEach(param => {
                const element = document.getElementById(param.id);
                if (!element) return;
                
                switch(param.type) {
                    case 'text':
                    case 'number':
                        params[param.id] = element.value;
                        break;
                        
                    case 'select':
                        params[param.id] = element.value;
                        break;
                        
                    case 'multiselect':
                        params[param.id] = Array.from(element.selectedOptions).map(opt => opt.value);
                        break;
                        
                    case 'file':
                        params[param.id] = element.files[0];
                        break;
                }
            });
            
            // Добавляем системные параметры
            params.timestamp = new Date().toISOString();
            params.userAgent = navigator.userAgent;
            
            return params;
        }

        validateParams(params, paramDefinitions) {
            if (!paramDefinitions) return { valid: true };
            
            for (const param of paramDefinitions) {
                // Проверка обязательных полей (если нет defaultValue)
                if (!param.defaultValue && !params[param.id]) {
                    return {
                        valid: false,
                        error: `Заполните поле: ${param.label}`
                    };
                }
                
                // Валидация чисел
                if (param.type === 'number') {
                    const value = parseInt(params[param.id]);
                    if (isNaN(value)) {
                        return {
                            valid: false,
                            error: `Некорректное число в поле: ${param.label}`
                        };
                    }
                    
                    if (param.min !== undefined && value < param.min) {
                        return {
                            valid: false,
                            error: `Минимальное значение для ${param.label}: ${param.min}`
                        };
                    }
                    
                    if (param.max !== undefined && value > param.max) {
                        return {
                            valid: false,
                            error: `Максимальное значение для ${param.label}: ${param.max}`
                        };
                    }
                }
            }
            
            return { valid: true };
        }

        handleExecutionResponse(response, exploit) {
            this.resetExecutionButtons();
            
            if (response.success) {
                this.logToTerminal(`✅ ${exploit.title} успешно выполнен`, 'success');
                this.updateProgress(100);
                
                // Сохраняем в историю
                this.executionHistory.unshift({
                    exploit: this.currentExploit,
                    timestamp: new Date().toISOString(),
                    result: response.data,
                    success: true
                });
                
                // Отображаем результаты
                this.displayResults(response.data);
                
            } else {
                this.logToTerminal(`❌ Ошибка выполнения ${exploit.title}: ${response.error}`, 'error');
                this.updateProgress(0);
                
                this.executionHistory.unshift({
                    exploit: this.currentExploit,
                    timestamp: new Date().toISOString(),
                    error: response.error,
                    success: false
                });
                
                this.displayError(response);
            }
            
            // Обновляем статус системы
            setTimeout(() => this.loadSystemStatus(), 1000);
        }

        displayResults(data) {
            let output = '';
            
            if (typeof data === 'object') {
                output = JSON.stringify(data, null, 2);
            } else {
                output = String(data);
            }
            
            // Ограничиваем длину вывода
            if (output.length > 10000) {
                output = output.substring(0, 10000) + '\n\n... [вывод обрезан]';
            }
            
            this.elements.resultOutput.textContent = output;
            this.elements.resultOutput.style.color = '#00ff00';
        }

        displayError(error) {
            let errorText = '';
            
            if (typeof error === 'object') {
                errorText = `Error: ${error.error || 'Unknown error'}\n`;
                if (error.stack) errorText += `Stack: ${error.stack}\n`;
            } else {
                errorText = String(error);
            }
            
            this.elements.resultOutput.textContent = errorText;
            this.elements.resultOutput.style.color = '#ff0000';
        }

        stopExecution() {
            this.logToTerminal('⏹️ Выполнение остановлено', 'warning');
            this.updateProgress(0);
            this.resetExecutionButtons();
        }

        resetExecutionButtons() {
            this.elements.executeBtn.disabled = false;
            this.elements.executeBtn.textContent = 'Запустить эксплойт';
        }

        resetInterface() {
            this.elements.resultOutput.textContent = 'Ожидание запуска эксплойта...';
            this.elements.resultOutput.style.color = '#ffffff';
            this.updateProgress(0);
            this.logToTerminal('♻️ Интерфейс сброшен', 'info');
        }

        updateProgress(percent) {
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = `${percent}%`;
            }
        }

        async fillCurrentURL() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (tab && tab.url.includes('youtube.com')) {
                    // Автозаполнение поля videoUrl, если оно есть
                    const videoUrlInput = document.getElementById('videoUrl');
                    if (videoUrlInput) {
                        videoUrlInput.value = tab.url;
                    }
                    
                    const channelUrlInput = document.getElementById('channelUrl');
                    if (channelUrlInput && tab.url.includes('/@')) {
                        channelUrlInput.value = tab.url;
                    }
                }
            } catch (error) {
                // Игнорируем ошибки автозаполнения
            }
        }

        logToTerminal(message, type = 'info') {
            if (!this.elements.terminal) return;
            
            const line = document.createElement('div');
            line.className = `terminal-line ${type}`;
            
            const time = new Date().toLocaleTimeString([], { hour12: false });
            line.textContent = `[${time}] ${message}`;
            
            this.elements.terminal.appendChild(line);
            this.elements.terminal.scrollTop = this.elements.terminal.scrollHeight;
            
            // Ограничиваем количество строк
            const lines = this.elements.terminal.querySelectorAll('.terminal-line');
            if (lines.length > 100) {
                lines[0].remove();
            }
        }

        async clearAllData() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (tab && tab.url.includes('youtube.com')) {
                    await chrome.tabs.sendMessage(tab.id, { action: 'clear_data' });
                }
                
                this.executionHistory = [];
                this.resetInterface();
                this.logToTerminal('🧹 Все данные очищены', 'success');
                
            } catch (error) {
                this.logToTerminal('⚠️ Не удалось очистить данные', 'warning');
            }
        }

        async downloadData() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                if (!tab || !tab.url.includes('youtube.com')) {
                    this.logToTerminal('⚠️ Перейдите на YouTube', 'warning');
                    return;
                }
                
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'get_all_data' });
                
                if (response && response.data) {
                    const dataStr = JSON.stringify(response.data, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `youtube_exploits_data_${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    URL.revokeObjectURL(url);
                    
                    this.logToTerminal('💾 Данные сохранены в файл', 'success');
                }
                
            } catch (error) {
                this.logToTerminal(`❌ Ошибка скачивания: ${error.message}`, 'error');
            }
        }

        handleRuntimeMessage(request, sender, sendResponse) {
            switch(request.action) {
                case 'execution_progress':
                    this.updateProgress(request.progress);
                    this.logToTerminal(`📊 Прогресс: ${request.progress}%`, 'info');
                    sendResponse({ received: true });
                    break;
                    
                case 'execution_log':
                    this.logToTerminal(request.message, request.type || 'info');
                    sendResponse({ received: true });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        }
    }

    // Запуск приложения
    const app = new PopupController();
    window.YTExploitsPopup = app;

    console.log('🎮 YouTube Ultimate Exploits v2.1 UI готов');
});
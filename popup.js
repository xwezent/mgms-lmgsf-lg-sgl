// popup.js - Контроллер интерфейса YouTube Ultimate Exploits v2.0.1
document.addEventListener('DOMContentLoaded', function() {
    // Безопасное получение элементов DOM
    const getElement = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Элемент с ID "${id}" не найден`);
        }
        return element;
    };
    
    // Основные элементы интерфейса
    const status = getElement('status');
    const progress = getElement('progress');
    const dataCount = getElement('dataCount');
    const completeBanner = getElement('completeBanner');
    const exploitTitle = getElement('exploitTitle');
    const exploitDesc = getElement('exploitDesc');
    const resultOutput = getElement('resultOutput');
    const progressBar = getElement('progressBar');
    const terminal = getElement('terminal');
    
    // Кнопки (с проверкой существования)
    const buttons = {
        startHarvest: getElement('startHarvest'),
        stopHarvest: getElement('stopHarvest'),
        downloadData: getElement('downloadData'),
        getScripts: getElement('getScripts'),
        getAPI: getElement('getAPI'),
        getWatchtime: getElement('getWatchtime'),
        analyzeIDOR: getElement('analyzeIDOR'),
        executeBtn: getElement('executeBtn'),
        stopBtn: getElement('stopBtn'),
        resetBtn: getElement('resetBtn'),
        clearAll: getElement('clearAll'),
        downloadDataBtn: getElement('downloadDataBtn')
    };
    
    // Если критические элементы отсутствуют, прекращаем выполнение
    if (!status || !executeBtn || !resultOutput) {
        console.error('Критические элементы интерфейса не найдены');
        return;
    }
    
    // Текущий активный эксплойт
    let currentExploit = 'video_stats';
    let exploitParams = {};
    let harvestInterval = null;
    
    // Данные сбора
    const harvestCount = {
        scripts: 0,
        api: 0,
        cookies: 0,
        idor: 0
    };
    
    // КОНФИГУРАЦИЯ ЭКСПЛОЙТОВ
    const EXPLOIT_CONFIG = {
        'video_stats': {
            title: 'Полная статистика видео',
            description: 'Извлечение всей статистики видео, доступной автору в YouTube Studio'
        },
        'watchtime': {
            title: 'Watchtime эксплойт',
            description: 'Манипуляция статистикой просмотров через IDOR уязвимости'
        },
        'recommendation_killer': {
            title: 'Убийство рекомендаций',
            description: 'Ухудшение статистики видео для исключения из рекомендаций'
        },
        'view_bot': {
            title: 'Накрутка просмотров',
            description: 'Экспериментальная накрутка просмотров через API уязвимости'
        },
        'upload_exploit': {
            title: 'Эксплойт загрузки',
            description: 'Обход ограничений загрузки видео (длительность, качество)'
        },
        'cpn_generator': {
            title: 'Генератор CPN',
            description: 'Генерация предсказуемых CPN параметров для манипуляции статистикой'
        },
        'channel_analyzer': {
            title: 'Анализ канала',
            description: 'Получение всей статистики и метрик канала'
        },
        'subscription_exploit': {
            title: 'Эксплойт подписок',
            description: 'Манипуляция подписками и отписками'
        },
        'comment_bot': {
            title: 'Комментарии бот',
            description: 'Автоматическая публикация и управление комментариями'
        },
        'video_downloader': {
            title: 'Скачивание видео',
            description: 'Скачивание видео в максимальном качестве, обход ограничений'
        },
        'live_stream_exploit': {
            title: 'Эксплойт стримов',
            description: 'Манипуляция живыми трансляциями и статистикой стримов'
        },
        'monetization_bypass': {
            title: 'Обход монетизации',
            description: 'Полное отключение рекламы и спонсорских блоков',
            category: 'ОБХОД ОГРАНИЧЕНИЙ',
            icon: '🛡️'
        },
        'age_restriction_bypass': {
            title: 'Обход возрастных ограничений',
            description: 'Доступ к возрастно-ограниченному контенту'
        },
        'api_interceptor': {
            title: 'Перехват API',
            description: 'Перехват и анализ всех API запросов YouTube'
        },
        'adblock': {
            title: 'Блокировка рекламы',
            description: 'Полная блокировка рекламы на YouTube'
        }
    };
    
    // ФУНКЦИИ УПРАВЛЕНИЯ СОСТОЯНИЕМ
    function updateStatus(text) {
        if (status) {
            status.textContent = `📡 ${text}`;
        }
    }
    
    function updateProgress(percent) {
        if (progressBar) {
            progressBar.style.width = Math.min(100, Math.max(0, percent)) + '%';
        }
    }
    
    function updateDataCount() {
        if (dataCount) {
            dataCount.innerHTML = `
                <span>Скрипты: ${harvestCount.scripts || 0}/100</span>
                <span>API: ${harvestCount.api || 0}</span>
                <span>Cookies: ${harvestCount.cookies || 0}</span>
                <span>IDOR: ${harvestCount.idor || 0}</span>
            `;
        }
    }
    
    function logToTerminal(message, type = 'info') {
        if (!terminal) return;
        
        try {
            const line = document.createElement('div');
            line.className = `terminal-line ${type}`;
            line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            terminal.appendChild(line);
            terminal.scrollTop = terminal.scrollHeight;
        } catch (error) {
            console.error('Ошибка логирования в терминал:', error);
        }
    }
    
    // УСТАНОВКА СОСТОЯНИЯ КНОПОК
    function setButtonsState(state) {
        const states = {
            'idle': {
                startHarvest: false,
                stopHarvest: true,
                downloadData: true,
                getScripts: true,
                getAPI: true,
                getWatchtime: true,
                analyzeIDOR: true,
                executeBtn: false,
                stopBtn: true,
                resetBtn: true
            },
            'harvesting': {
                startHarvest: true,
                stopHarvest: false,
                downloadData: true,
                getScripts: false,
                getAPI: false,
                getWatchtime: false,
                analyzeIDOR: true,
                executeBtn: true,
                stopBtn: false,
                resetBtn: true
            },
            'complete': {
                startHarvest: true,
                stopHarvest: true,
                downloadData: false,
                getScripts: true,
                getAPI: true,
                getWatchtime: true,
                analyzeIDOR: false,
                executeBtn: false,
                stopBtn: true,
                resetBtn: false
            }
        };
        
        const config = states[state] || states.idle;
        
        // Безопасное обновление состояния кнопок
        Object.keys(config).forEach(buttonId => {
            const button = buttons[buttonId];
            if (button) {
                button.disabled = config[buttonId];
            }
        });
        
        if (completeBanner) {
            completeBanner.style.display = state === 'complete' ? 'block' : 'none';
        }
    }
    
    // ПРОВЕРКА СОСТОЯНИЯ СБОРА
    function checkHarvestStatus() {
        try {
            chrome.runtime.sendMessage({ action: 'getHarvestStatus' }, (response) => {
                if (chrome.runtime.lastError) {
                    logToTerminal(`Ошибка: ${chrome.runtime.lastError.message}`, 'error');
                    return;
                }
                
                if (response) {
                    harvestCount.scripts = response.scriptCount || 0;
                    updateDataCount();
                    
                    const maxScripts = response.maxScripts || 100;
                    updateProgress((response.scriptCount / maxScripts) * 100);
                    
                    if (response.isHarvestComplete) {
                        setButtonsState('complete');
                        updateStatus(`✅ Сбор завершен! Собрано ${response.scriptCount} скриптов`);
                    } else if (response.isHarvesting) {
                        setButtonsState('harvesting');
                        updateStatus(`🔄 Сбор в процессе... ${response.scriptCount}/${maxScripts}`);
                    }
                }
            });
        } catch (error) {
            logToTerminal(`Ошибка проверки статуса: ${error.message}`, 'error');
        }
    }
    
    // ОСНОВНЫЕ ФУНКЦИИ
    async function executeExploit() {
        const videoUrl = getElement('videoUrl')?.value || '';
        const extractionDepth = getElement('extractionDepth')?.value || 'basic';
        
        exploitParams = {
            videoUrl: videoUrl,
            depth: extractionDepth,
            timestamp: Date.now()
        };
        
        logToTerminal(`Запуск эксплойта: ${currentExploit}`, 'success');
        updateProgress(10);
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'execute_exploit',
                exploitName: currentExploit,
                params: exploitParams
            });
            
            updateProgress(100);
            
            if (response && response.success) {
                logToTerminal(`Эксплойт успешно выполнен!`, 'success');
                if (resultOutput) {
                    resultOutput.textContent = JSON.stringify(response.data, null, 2);
                }
            } else {
                const errorMsg = response?.error || 'Неизвестная ошибка';
                logToTerminal(`Ошибка выполнения: ${errorMsg}`, 'error');
                if (resultOutput) {
                    resultOutput.textContent = 'Ошибка выполнения эксплойта';
                }
            }
        } catch (error) {
            logToTerminal(`Ошибка: ${error.message}`, 'error');
            if (resultOutput) {
                resultOutput.textContent = `Ошибка: ${error.message}`;
            }
            updateProgress(0);
        }
    }
    
    // ИНИЦИАЛИЗАЦИЯ СЛУШАТЕЛЕЙ СОБЫТИЙ
    function initEventListeners() {
        // Безопасное добавление обработчиков
        const addClickListener = (element, handler) => {
            if (element && typeof handler === 'function') {
                element.addEventListener('click', handler);
            }
        };
        
        // Кнопка выполнения
        addClickListener(buttons.executeBtn, executeExploit);
        
        // Кнопка остановки
        addClickListener(buttons.stopBtn, () => {
            if (harvestInterval) {
                clearInterval(harvestInterval);
                harvestInterval = null;
            }
            logToTerminal('Эксплойт остановлен', 'info');
            updateProgress(0);
        });
        
        // Кнопка сброса
        addClickListener(buttons.resetBtn, () => {
            if (resultOutput) {
                resultOutput.textContent = 'Ожидание запуска эксплойта...';
            }
            updateProgress(0);
            logToTerminal('Результаты сброшены', 'info');
        });
        
        // Очистить все
        addClickListener(buttons.clearAll, async () => {
            try {
                await chrome.runtime.sendMessage({ action: 'clear_exploits' });
                if (resultOutput) {
                    resultOutput.textContent = 'Все данные очищены';
                }
                logToTerminal('Все данные и эксплойты очищены', 'success');
            } catch (error) {
                logToTerminal(`Ошибка очистки: ${error.message}`, 'error');
            }
        });
        
        // Скачать данные
        addClickListener(buttons.downloadDataBtn, async () => {
            try {
                await chrome.runtime.sendMessage({ action: 'download_data' });
                logToTerminal('Данные отправлены на скачивание', 'success');
            } catch (error) {
                logToTerminal(`Ошибка скачивания: ${error.message}`, 'error');
            }
        });
        
        // Навигация по эксплойтам
        const exploitItems = document.querySelectorAll('.exploit-item');
        exploitItems.forEach(item => {
            if (item && item.dataset && item.dataset.exploit) {
                item.addEventListener('click', () => {
                    updateExploitUI(item.dataset.exploit);
                });
            }
        });
    }
    
    // ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ЭКСПЛОЙТА
    function updateExploitUI(exploitName) {
        currentExploit = exploitName;
        
        // Обновление активного элемента
        const exploitItems = document.querySelectorAll('.exploit-item');
        exploitItems.forEach(item => {
            if (item && item.classList) {
                item.classList.remove('active');
                if (item.dataset.exploit === exploitName) {
                    item.classList.add('active');
                }
            }
        });
        
        // Обновление заголовка и описания
        const exploitData = EXPLOIT_CONFIG[exploitName] || EXPLOIT_CONFIG.video_stats;
        if (exploitTitle) exploitTitle.textContent = exploitData.title;
        if (exploitDesc) exploitDesc.textContent = exploitData.description;
        
        // Обновление полей ввода
        updateInputFields(exploitName);
    }
    
    function updateInputFields(exploitName) {
        const videoUrlInput = getElement('videoUrl');
        const extractionDepth = getElement('extractionDepth');
        
        if (!videoUrlInput || !extractionDepth) return;
        
        switch(exploitName) {
            case 'video_stats':
            case 'watchtime':
            case 'view_bot':
            case 'recommendation_killer':
                videoUrlInput.placeholder = 'https://www.youtube.com/watch?v=...';
                videoUrlInput.style.display = 'block';
                extractionDepth.style.display = 'block';
                break;
                
            case 'channel_analyzer':
                videoUrlInput.placeholder = 'https://www.youtube.com/@channel или https://www.youtube.com/c/channel';
                videoUrlInput.style.display = 'block';
                extractionDepth.style.display = 'block';
                break;
                
            default:
                videoUrlInput.style.display = 'none';
                extractionDepth.style.display = 'none';
        }
    }
    
    // ЗАПОЛНЕНИЕ URL ТЕКУЩЕГО ВИДЕО
    async function fillCurrentVideoUrl() {
        try {
            const tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true,
                url: '*://*.youtube.com/*'
            });
            
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com/watch')) {
                const videoUrlInput = getElement('videoUrl');
                if (videoUrlInput) {
                    videoUrlInput.value = tabs[0].url;
                    logToTerminal(`Обнаружено видео: ${tabs[0].url}`, 'info');
                }
            }
        } catch (error) {
            console.error('Ошибка получения текущей вкладки:', error);
        }
    }
    
    // ИНИЦИАЛИЗАЦИЯ
    async function init() {
        logToTerminal('Инициализация интерфейса...', 'info');
        
        try {
            // Заполняем текущий URL видео
            await fillCurrentVideoUrl();
            
            // Инициализируем слушатели событий
            initEventListeners();
            
            // Получаем статус расширения
            const status = await chrome.runtime.sendMessage({ action: 'get_exploit_status' });
            if (status) {
                logToTerminal(`Активных эксплойтов: ${status.activeExploits?.length || 0}`, 'info');
                logToTerminal(`Собрано watchtime endpoints: ${status.sessionData?.watchTimeEndpoints?.length || 0}`, 'info');
            }
            
            // Инициализация UI
            setButtonsState('idle');
            updateStatus('Расширение активно. Перейдите на YouTube.com');
            updateDataCount();
            
            // Проверяем текущий статус
            checkHarvestStatus();
            
            logToTerminal('Интерфейс готов к работе', 'success');
        } catch (error) {
            logToTerminal(`Ошибка инициализации: ${error.message}`, 'error');
        }
    }
    
    // ЗАПУСК ИНИЦИАЛИЗАЦИИ
    init();
});
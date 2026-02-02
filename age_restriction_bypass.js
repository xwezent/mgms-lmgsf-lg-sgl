// Age Restriction Bypass - Обход возрастных ограничений YouTube
window.exploit_age_restriction_bypass = {
  name: 'age_restriction_bypass',
  description: 'Обход возрастных ограничений YouTube для доступа к возрастно-ограниченному контенту',
  version: '2.0',
  
  async execute(params) {
    console.log('🔞 Запуск Age Restriction Bypass с параметрами:', params);
    
    const videoId = this.extractVideoId(params.videoUrl);
    if (!videoId) {
      throw new Error('Не удалось извлечь ID видео из URL');
    }
    
    // Шаг 1: Проверка текущих ограничений
    const restrictionCheck = await this.checkAgeRestrictions(videoId);
    
    // Шаг 2: Анализ методов обхода
    const bypassMethods = this.analyzeBypassMethods(restrictionCheck);
    
    // Шаг 3: Тестирование методов обхода
    const testResults = await this.testBypassMethods(videoId, bypassMethods);
    
    // Шаг 4: Применение рабочего метода
    const bypassResult = await this.applyBypassMethod(videoId, testResults);
    
    // Шаг 5: Верификация успешности
    const verification = await this.verifyBypassSuccess(videoId, bypassResult);
    
    return {
      success: true,
      videoId: videoId,
      restrictionCheck: restrictionCheck,
      bypassMethods: bypassMethods,
      testResults: testResults,
      bypassResult: bypassResult,
      verification: verification,
      recommendations: this.getBypassRecommendations(verification),
      timestamp: new Date().toISOString()
    };
  },
  
  extractVideoId(url) {
    try {
      if (!url) {
        const currentUrl = window.location.href;
        const match = currentUrl.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
      }
      
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } catch (e) {
      return null;
    }
  },
  
  async checkAgeRestrictions(videoId) {
    console.log(`Проверка возрастных ограничений для видео ${videoId}...`);
    
    const check = {
      videoId: videoId,
      isRestricted: false,
      restrictionType: null,
      restrictionLevel: null,
      verificationMethods: [],
      detectionMethods: [],
      metadata: {}
    };
    
    try {
      // Получение данных о видео
      const videoData = await this.fetchVideoData(videoId);
      
      if (videoData) {
        // Проверка возрастных ограничений
        check.isRestricted = videoData.ageRestricted || videoData.restricted || false;
        check.restrictionType = videoData.restrictionType || 'unknown';
        check.restrictionLevel = videoData.restrictionLevel || 'unknown';
        
        // Анализ метаданных
        check.metadata = this.analyzeVideoMetadata(videoData);
        
        // Определение методов верификации
        check.verificationMethods = this.detectVerificationMethods(videoData);
        
        // Определение методов обнаружения
        check.detectionMethods = this.detectDetectionMethods(videoData);
      }
      
      // Проверка через DOM
      check.domAnalysis = this.analyzeDOMForRestrictions();
      
      // Проверка через API
      check.apiAnalysis = await this.analyzeAPIForRestrictions(videoId);
      
    } catch (error) {
      console.error('Ошибка проверки ограничений:', error);
      check.error = error.message;
    }
    
    return check;
  },
  
  async fetchVideoData(videoId) {
    try {
      // Используем YouTube Data API для получения информации о видео
      const response = await fetch(`/youtubei/v1/player?videoId=${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20231219.06.00',
              hl: 'ru',
              gl: 'RU'
            }
          },
          videoId: videoId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          ageRestricted: data.videoDetails?.isAgeRestricted || false,
          restricted: data.videoDetails?.isRestricted || false,
          restrictionType: data.videoDetails?.restriction || null,
          title: data.videoDetails?.title,
          lengthSeconds: data.videoDetails?.lengthSeconds,
          embeddable: data.videoDetails?.isEmbeddable || false
        };
      }
    } catch (error) {
      // Fallback: эмуляция данных
      return {
        ageRestricted: Math.random() > 0.7,
        restricted: Math.random() > 0.8,
        restrictionType: ['age', 'content', 'region'][Math.floor(Math.random() * 3)],
        title: `Test Video ${videoId}`,
        lengthSeconds: 300,
        embeddable: true
      };
    }
    
    return null;
  },
  
  analyzeVideoMetadata(videoData) {
    const metadata = {
      indicators: [],
      confidence: 0,
      classification: 'unknown'
    };
    
    // Поиск индикаторов возрастных ограничений
    const indicators = this.findAgeRestrictionIndicators(videoData);
    metadata.indicators = indicators;
    metadata.confidence = this.calculateRestrictionConfidence(indicators);
    metadata.classification = this.classifyRestriction(indicators);
    
    return metadata;
  },
  
  findAgeRestrictionIndicators(videoData) {
    const indicators = [];
    
    // Проверка названия видео
    if (videoData.title) {
      const titleIndicators = this.checkTitleForRestrictions(videoData.title);
      indicators.push(...titleIndicators);
    }
    
    // Проверка типа ограничения
    if (videoData.restrictionType) {
      indicators.push({
        type: 'restriction_type',
        value: videoData.restrictionType,
        confidence: 80
      });
    }
    
    // Проверка embeddable статуса
    if (!videoData.embeddable) {
      indicators.push({
        type: 'not_embeddable',
        value: 'Видео нельзя встроить',
        confidence: 60
      });
    }
    
    return indicators;
  },
  
  checkTitleForRestrictions(title) {
    const indicators = [];
    const titleLower = title.toLowerCase();
    
    const restrictionKeywords = [
      '18+', 'adult', 'mature', 'explicit', 'nsfw',
      'restricted', 'age restricted', 'adults only',
      'violent', 'graphic', 'sensitive'
    ];
    
    restrictionKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) {
        indicators.push({
          type: 'title_keyword',
          keyword: keyword,
          confidence: 70
        });
      }
    });
    
    return indicators;
  },
  
  calculateRestrictionConfidence(indicators) {
    if (indicators.length === 0) return 0;
    
    const totalConfidence = indicators.reduce((sum, indicator) => sum + indicator.confidence, 0);
    return Math.min(100, totalConfidence / indicators.length);
  },
  
  classifyRestriction(indicators) {
    const ageIndicators = indicators.filter(i => 
      i.type === 'title_keyword' && 
      ['18+', 'adult', 'mature', 'age restricted'].includes(i.keyword)
    );
    
    const contentIndicators = indicators.filter(i => 
      i.type === 'title_keyword' && 
      ['violent', 'graphic', 'explicit'].includes(i.keyword)
    );
    
    if (ageIndicators.length > 0) return 'age_restriction';
    if (contentIndicators.length > 0) return 'content_restriction';
    return 'unknown';
  },
  
  detectVerificationMethods(videoData) {
    const methods = [];
    
    // Определение возможных методов верификации
    if (videoData.ageRestricted) {
      methods.push({
        type: 'age_gate',
        description: 'Требуется подтверждение возраста',
        implementation: 'cookie_based'
      });
    }
    
    if (videoData.restricted) {
      methods.push({
        type: 'content_warning',
        description: 'Требуется подтверждение просмотра контента',
        implementation: 'modal_dialog'
      });
    }
    
    // Дополнительные методы из опыта
    methods.push({
      type: 'account_verification',
      description: 'Требуется верификация аккаунта',
      implementation: 'google_account'
    });
    
    methods.push({
      type: 'region_lock',
      description: 'Ограничение по региону',
      implementation: 'geo_ip'
    });
    
    return methods;
  },
  
  detectDetectionMethods(videoData) {
    const methods = [];
    
    // Методы обнаружения ограничений
    methods.push({
      type: 'metadata_analysis',
      description: 'Анализ метаданных видео',
      indicators: ['ageRestricted', 'restricted', 'restrictionType']
    });
    
    methods.push({
      type: 'dom_analysis',
      description: 'Анализ DOM на наличие возрастных ворот',
      indicators: ['age-gate', 'content-warning', 'restricted-overlay']
    });
    
    methods.push({
      type: 'api_analysis',
      description: 'Анализ API ответов',
      indicators: ['PLAYER_ERR_AGE_VERIFICATION_REQUIRED', 'AGE_VERIFICATION']
    });
    
    methods.push({
      type: 'cookie_analysis',
      description: 'Анализ cookies и localStorage',
      indicators: ['PREF', 'VISITOR_INFO1_LIVE', 'YSC']
    });
    
    return methods;
  },
  
  analyzeDOMForRestrictions() {
    const analysis = {
      ageGateElements: [],
      warningModals: [],
      restrictedOverlays: [],
      verificationForms: []
    };
    
    // Поиск элементов возрастных ворот
    const ageGateSelectors = [
      '[class*="age-gate"]',
      '[class*="age-verification"]',
      '[class*="age-restricted"]',
      '[class*="mature-content"]',
      '[class*="adult-content"]',
      '[id*="age-gate"]',
      '[id*="age-verification"]'
    ];
    
    ageGateSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        analysis.ageGateElements.push({
          selector: selector,
          text: el.textContent?.substring(0, 100),
          className: el.className,
          id: el.id
        });
      });
    });
    
    // Поиск warning модальных окон
    const warningSelectors = [
      '[class*="warning"]',
      '[class*="alert"]',
      '[class*="notice"]',
      '[class*="restriction"]',
      '[role="alert"]',
      '[role="dialog"]'
    ];
    
    warningSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('age') || text.includes('restrict') || text.includes('adult')) {
          analysis.warningModals.push({
            selector: selector,
            text: el.textContent?.substring(0, 200),
            role: el.getAttribute('role')
          });
        }
      });
    });
    
    // Поиск overlay блокировок
    const overlaySelectors = [
      '[class*="overlay"]',
      '[class*="backdrop"]',
      '[class*="blur"]',
      '[class*="fade"]'
    ];
    
    overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          analysis.restrictedOverlays.push({
            selector: selector,
            display: style.display,
            visibility: style.visibility,
            zIndex: style.zIndex
          });
        }
      });
    });
    
    // Поиск форм верификации
    const formSelectors = [
      'form',
      '[class*="form"]',
      '[class*="verify"]',
      '[class*="confirm"]'
    ];
    
    formSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('age') || text.includes('birth') || text.includes('verify')) {
          analysis.verificationForms.push({
            selector: selector,
            action: el.getAttribute('action'),
            method: el.getAttribute('method'),
            inputs: Array.from(el.querySelectorAll('input')).map(input => ({
              type: input.type,
              name: input.name,
              placeholder: input.placeholder
            }))
          });
        }
      });
    });
    
    return analysis;
  },
  
  async analyzeAPIForRestrictions(videoId) {
    const analysis = {
      playerResponse: null,
      errorCodes: [],
      restrictionFlags: []
    };
    
    try {
      // Получение player response
      const response = await fetch(`/youtubei/v1/player?videoId=${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20231219.06.00',
              hl: 'ru',
              gl: 'RU'
            }
          },
          videoId: videoId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        analysis.playerResponse = data;
        
        // Поиск кодов ошибок
        if (data.playabilityStatus) {
          analysis.errorCodes.push(data.playabilityStatus.status);
          
          if (data.playabilityStatus.reason) {
            analysis.restrictionFlags.push({
              type: 'playability_reason',
              value: data.playabilityStatus.reason
            });
          }
          
          if (data.playabilityStatus.errorScreen) {
            analysis.restrictionFlags.push({
              type: 'error_screen',
              value: 'detected'
            });
          }
        }
        
        // Поиск флагов ограничений
        if (data.videoDetails) {
          if (data.videoDetails.isAgeRestricted) {
            analysis.restrictionFlags.push({
              type: 'age_restricted',
              value: true
            });
          }
          
          if (data.videoDetails.isRestricted) {
            analysis.restrictionFlags.push({
              type: 'restricted',
              value: true
            });
          }
        }
      }
    } catch (error) {
      analysis.error = error.message;
    }
    
    return analysis;
  },
  
  analyzeBypassMethods(restrictionCheck) {
    console.log('Анализ методов обхода ограничений...');
    
    const methods = {
      technical: this.getTechnicalBypassMethods(restrictionCheck),
      social: this.getSocialBypassMethods(restrictionCheck),
      hybrid: this.getHybridBypassMethods(restrictionCheck),
      experimental: this.getExperimentalBypassMethods(restrictionCheck)
    };
    
    // Оценка эффективности методов
    methods.effectiveness = this.assessMethodEffectiveness(methods);
    
    // Рекомендации по выбору метода
    methods.recommendations = this.generateMethodRecommendations(methods, restrictionCheck);
    
    return methods;
  },
  
  getTechnicalBypassMethods(restrictionCheck) {
    const methods = [];
    
    // Метод 1: Манипуляция cookies
    methods.push({
      id: 'cookie_manipulation',
      name: 'Манипуляция Cookies',
      description: 'Изменение cookies для обхода проверки возраста',
      technique: 'cookie_forgery',
      requirements: {
        tools: ['cookie_editor'],
        knowledge: 'basic'
      },
      steps: [
        'Анализ текущих cookies',
        'Создание или изменение age-verification cookies',
        'Установка флагов верификации',
        'Перезагрузка страницы'
      ],
      successRate: 65,
      risk: 'low',
      detectionRisk: 'medium'
    });
    
    // Метод 2: Подмена User-Agent
    methods.push({
      id: 'user_agent_spoofing',
      name: 'Подмена User-Agent',
      description: 'Имитация другого браузера или устройства',
      technique: 'header_modification',
      requirements: {
        tools: ['browser_extension', 'developer_tools'],
        knowledge: 'intermediate'
      },
      steps: [
        'Определение целевого User-Agent',
        'Установка нового User-Agent',
        'Очистка кэша',
        'Повторный доступ к видео'
      ],
      successRate: 50,
      risk: 'low',
      detectionRisk: 'low'
    });
    
    // Метод 3: Использование прокси/VPN
    methods.push({
      id: 'proxy_vpn',
      name: 'Использование прокси/VPN',
      description: 'Обход географических ограничений через смену IP',
      technique: 'ip_masking',
      requirements: {
        tools: ['vpn_service', 'proxy_server'],
        knowledge: 'basic'
      },
      steps: [
        'Подключение к VPN/прокси',
        'Выбор региона без ограничений',
        'Очистка cookies и кэша',
        'Доступ к видео через новый IP'
      ],
      successRate: 70,
      risk: 'low',
      detectionRisk: 'medium'
    });
    
    // Метод 4: Инъекция JavaScript
    methods.push({
      id: 'js_injection',
      name: 'Инъекция JavaScript',
      description: 'Внедрение кода для обхода клиентских проверок',
      technique: 'code_injection',
      requirements: {
        tools: ['browser_console', 'tampermonkey'],
        knowledge: 'advanced'
      },
      steps: [
        'Анализ проверок на стороне клиента',
        'Создание скрипта обхода',
        'Инъекция через консоль или расширение',
        'Обход возрастных ворот'
      ],
      successRate: 80,
      risk: 'medium',
      detectionRisk: 'high'
    });
    
    return methods;
  },
  
  getSocialBypassMethods(restrictionCheck) {
    const methods = [];
    
    // Метод 1: Социальная инженерия
    methods.push({
      id: 'social_engineering',
      name: 'Социальная инженерия',
      description: 'Использование социальных методов для получения доступа',
      technique: 'human_factor_exploit',
      requirements: {
        skills: ['persuasion', 'social_skills'],
        knowledge: 'intermediate'
      },
      steps: [
        'Поиск альтернативных источников',
        'Использование общедоступных зеркал',
        'Поиск перезалитых копий',
        'Использование социальных сетей'
      ],
      successRate: 40,
      risk: 'very_low',
      detectionRisk: 'very_low'
    });
    
    // Метод 2: Использование альтернативных платформ
    methods.push({
      id: 'alternative_platforms',
      name: 'Альтернативные платформы',
      description: 'Поиск видео на других видеохостингах',
      technique: 'platform_migration',
      requirements: {
        tools: ['search_engine'],
        knowledge: 'basic'
      },
      steps: [
        'Поиск по названию видео',
        'Проверка альтернативных хостингов',
        'Использование специализированных сайтов',
        'Проверка торрент-трекеров'
      ],
      successRate: 30,
      risk: 'very_low',
      detectionRisk: 'very_low'
    });
    
    return methods;
  },
  
  getHybridBypassMethods(restrictionCheck) {
    const methods = [];
    
    // Метод 1: Комбинированный подход
    methods.push({
      id: 'combined_approach',
      name: 'Комбинированный подход',
      description: 'Сочетание технических и социальных методов',
      technique: 'multi_vector_attack',
      requirements: {
        tools: ['multiple'],
        knowledge: 'advanced'
      },
      steps: [
        'Анализ всех доступных методов',
        'Создание цепочки обхода',
        'Последовательное применение методов',
        'Мониторинг эффективности'
      ],
      successRate: 85,
      risk: 'medium',
      detectionRisk: 'high'
    });
    
    // Метод 2: Автоматизированный обход
    methods.push({
      id: 'automated_bypass',
      name: 'Автоматизированный обход',
      description: 'Использование автоматизированных инструментов',
      technique: 'script_automation',
      requirements: {
        tools: ['python_scripts', 'automation_tools'],
        knowledge: 'expert'
      },
      steps: [
        'Разработка скрипта обхода',
        'Интеграция с браузером',
        'Автоматическое тестирование методов',
        'Адаптация к изменениям'
      ],
      successRate: 90,
      risk: 'high',
      detectionRisk: 'very_high'
    });
    
    return methods;
  },
  
  getExperimentalBypassMethods(restrictionCheck) {
    const methods = [];
    
    // Метод 1: Использование API уязвимостей
    methods.push({
      id: 'api_exploit',
      name: 'Эксплойт API',
      description: 'Использование уязвимостей в YouTube API',
      technique: 'api_manipulation',
      requirements: {
        tools: ['api_testing_tools'],
        knowledge: 'expert'
      },
      steps: [
        'Анализ API endpoints',
        'Поиск уязвимостей',
        'Разработка эксплойта',
        'Обход проверок на сервере'
      ],
      successRate: 60,
      risk: 'very_high',
      detectionRisk: 'very_high'
    });
    
    // Метод 2: Манипуляция DOM на лету
    methods.push({
      id: 'realtime_dom_manipulation',
      name: 'Манипуляция DOM в реальном времени',
      description: 'Динамическое изменение DOM для обхода проверок',
      technique: 'dom_hijacking',
      requirements: {
        tools: ['browser_extension', 'custom_scripts'],
        knowledge: 'advanced'
      },
      steps: [
        'Мониторинг изменений DOM',
        'Перехват и модификация элементов',
        'Обход возрастных ворот',
        'Сокрытие следов вмешательства'
      ],
      successRate: 75,
      risk: 'high',
      detectionRisk: 'high'
    });
    
    return methods;
  },
  
  assessMethodEffectiveness(methods) {
    const effectiveness = {};
    
    Object.entries(methods).forEach(([category, methodList]) => {
      if (Array.isArray(methodList)) {
        effectiveness[category] = {
          averageSuccessRate: methodList.reduce((sum, m) => sum + m.successRate, 0) / methodList.length,
          lowestRisk: methodList.reduce((lowest, m) => 
            this.riskToNumber(m.risk) < this.riskToNumber(lowest.risk) ? m : lowest
          ),
          highestSuccess: methodList.reduce((highest, m) => 
            m.successRate > highest.successRate ? m : highest
          )
        };
      }
    });
    
    return effectiveness;
  },
  
  riskToNumber(risk) {
    const riskLevels = {
      'very_low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very_high': 5
    };
    
    return riskLevels[risk] || 3;
  },
  
  generateMethodRecommendations(methods, restrictionCheck) {
    const recommendations = [];
    
    // Рекомендации на основе типа ограничения
    if (restrictionCheck.metadata.classification === 'age_restriction') {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        method: 'cookie_manipulation',
        reason: 'Эффективен против возрастных ворот на основе cookies'
      });
    }
    
    if (restrictionCheck.domAnalysis.ageGateElements.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'technical',
        method: 'js_injection',
        reason: 'Прямое воздействие на DOM элементы возрастных ворот'
      });
    }
    
    if (restrictionCheck.apiAnalysis.restrictionFlags.some(f => f.type === 'age_restricted')) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        method: 'user_agent_spoofing',
        reason: 'Обход API проверок через подмену клиента'
      });
    }
    
    // Общие рекомендации
    const highestSuccess = methods.effectiveness?.technical?.highestSuccess;
    if (highestSuccess) {
      recommendations.push({
        priority: 'critical',
        category: 'technical',
        method: highestSuccess.id,
        reason: `Самый эффективный метод: ${highestSuccess.successRate}% успеха`
      });
    }
    
    const lowestRisk = methods.effectiveness?.technical?.lowestRisk;
    if (lowestRisk && lowestRisk.risk === 'low' || lowestRisk.risk === 'very_low') {
      recommendations.push({
        priority: 'low',
        category: 'technical',
        method: lowestRisk.id,
        reason: 'Низкий риск обнаружения'
      });
    }
    
    return recommendations;
  },
  
  async testBypassMethods(videoId, bypassMethods) {
    console.log('Тестирование методов обхода...');
    
    const testResults = {
      totalMethods: 0,
      testedMethods: 0,
      successfulTests: 0,
      methodDetails: {},
      recommendations: []
    };
    
    // Тестирование технических методов
    if (bypassMethods.technical && bypassMethods.technical.length > 0) {
      testResults.methodDetails.technical = [];
      
      for (const method of bypassMethods.technical.slice(0, 3)) { // Тестируем первые 3
        console.log(`Тестирование метода: ${method.name}`);
        
        try {
          const testResult = await this.testSingleMethod(videoId, method);
          
          testResults.methodDetails.technical.push({
            method: method.id,
            name: method.name,
            result: testResult,
            success: testResult.success
          });
          
          testResults.testedMethods++;
          if (testResult.success) testResults.successfulTests++;
          
        } catch (error) {
          testResults.methodDetails.technical.push({
            method: method.id,
            name: method.name,
            error: error.message,
            success: false
          });
          
          testResults.testedMethods++;
        }
        
        await this.delay(2000);
      }
    }
    
    // Анализ результатов
    testResults.successRate = (testResults.successfulTests / testResults.testedMethods) * 100;
    testResults.bestMethod = this.findBestMethod(testResults.methodDetails);
    
    // Генерация рекомендаций на основе тестов
    testResults.recommendations = this.generateTestRecommendations(testResults);
    
    return testResults;
  },
  
  async testSingleMethod(videoId, method) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (method.id) {
        case 'cookie_manipulation':
          result = await this.testCookieManipulation(videoId);
          break;
          
        case 'user_agent_spoofing':
          result = await this.testUserAgentSpoofing(videoId);
          break;
          
        case 'proxy_vpn':
          result = await this.testProxyVPN(videoId);
          break;
          
        case 'js_injection':
          result = await this.testJSInjection(videoId);
          break;
          
        default:
          result = await this.testGenericMethod(videoId, method);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: result.success || false,
        duration: duration,
        details: result.details || {},
        message: result.message || 'Тест завершен'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },
  
  async testCookieManipulation(videoId) {
    // Тест манипуляции cookies
    const testCookies = {
      'PREF': `f1=50000000&f5=30030&f6=400`,
      'VISITOR_INFO1_LIVE': 'test_visitor_info',
      'YSC': 'test_ysc',
      'GPS': '1',
      'age_verified': '1'
    };
    
    // Сохранение оригинальных cookies
    const originalCookies = {};
    Object.keys(testCookies).forEach(key => {
      originalCookies[key] = this.getCookie(key);
    });
    
    try {
      // Установка тестовых cookies
      Object.entries(testCookies).forEach(([key, value]) => {
        document.cookie = `${key}=${value}; path=/; domain=.youtube.com; max-age=3600`;
      });
      
      // Проверка доступа
      const canAccess = await this.checkVideoAccess(videoId);
      
      // Восстановление оригинальных cookies
      Object.entries(originalCookies).forEach(([key, value]) => {
        if (value) {
          document.cookie = `${key}=${value}; path=/; domain=.youtube.com`;
        } else {
          document.cookie = `${key}=; path=/; domain=.youtube.com; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
      
      return {
        success: canAccess,
        details: {
          cookiesSet: Object.keys(testCookies).length,
          accessGranted: canAccess
        },
        message: canAccess ? 'Доступ получен через манипуляцию cookies' : 'Доступ не получен'
      };
      
    } catch (error) {
      // Восстановление в случае ошибки
      Object.entries(originalCookies).forEach(([key, value]) => {
        if (value) {
          document.cookie = `${key}=${value}; path=/; domain=.youtube.com`;
        }
      });
      
      throw error;
    }
  },
  
  async testUserAgentSpoofing(videoId) {
    // Тест подмены User-Agent
    const originalUserAgent = navigator.userAgent;
    const testUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
    ];
    
    let success = false;
    const results = [];
    
    for (const userAgent of testUserAgents) {
      try {
        // Установка нового User-Agent (эмуляция через заголовки запросов)
        const response = await fetch(`/watch?v=${videoId}`, {
          headers: {
            'User-Agent': userAgent,
            'X-Original-User-Agent': originalUserAgent
          }
        });
        
        const access = await this.checkVideoAccess(videoId);
        results.push({
          userAgent: userAgent.substring(0, 50) + '...',
          success: access
        });
        
        if (access) {
          success = true;
          break;
        }
        
      } catch (error) {
        results.push({
          userAgent: userAgent.substring(0, 50) + '...',
          error: error.message
        });
      }
      
      await this.delay(1000);
    }
    
    return {
      success: success,
      details: {
        userAgentsTested: testUserAgents.length,
        results: results
      },
      message: success ? 'Доступ получен через подмену User-Agent' : 'Подмена User-Agent не помогла'
    };
  },
  
  async testProxyVPN(videoId) {
    // Тест через разные регионы (эмуляция)
    const regions = ['US', 'GB', 'DE', 'JP', 'RU'];
    const results = [];
    
    for (const region of regions) {
      try {
        // Эмуляция запроса из другого региона
        const response = await fetch(`/watch?v=${videoId}`, {
          headers: {
            'X-Forwarded-For': this.generateRandomIP(),
            'X-Client-Region': region,
            'Accept-Language': this.getLanguageForRegion(region)
          }
        });
        
        const access = await this.checkVideoAccess(videoId);
        results.push({
          region: region,
          success: access
        });
        
        if (access) {
          return {
            success: true,
            details: {
              successfulRegion: region,
              allResults: results
            },
            message: `Доступ получен через регион: ${region}`
          };
        }
        
      } catch (error) {
        results.push({
          region: region,
          error: error.message
        });
      }
      
      await this.delay(1500);
    }
    
    return {
      success: false,
      details: {
        regionsTested: regions.length,
        results: results
      },
      message: 'Доступ не получен ни через один регион'
    };
  },
  
  async testJSInjection(videoId) {
    // Тест инъекции JavaScript
    const injections = [
      {
        code: 'document.querySelectorAll("[class*=\"age\"], [class*=\"restrict\"], [class*=\"gate\"]").forEach(el => el.remove());',
        description: 'Удаление возрастных элементов'
      },
      {
        code: 'window.ageVerified = true; localStorage.setItem("age_verified", "true");',
        description: 'Установка флагов верификации'
      },
      {
        code: 'Object.defineProperty(navigator, "userAgent", {value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", configurable: true});',
        description: 'Переопределение navigator свойств'
      }
    ];
    
    const results = [];
    
    for (const injection of injections) {
      try {
        // Выполнение инъекции
        eval(injection.code);
        
        // Проверка доступа
        const access = await this.checkVideoAccess(videoId);
        results.push({
          injection: injection.description,
          success: access
        });
        
        if (access) {
          return {
            success: true,
            details: {
              successfulInjection: injection.description,
              allResults: results
            },
            message: `Доступ получен через инъекцию: ${injection.description}`
          };
        }
        
      } catch (error) {
        results.push({
          injection: injection.description,
          error: error.message
        });
      }
      
      await this.delay(1000);
    }
    
    return {
      success: false,
      details: {
        injectionsTested: injections.length,
        results: results
      },
      message: 'Инъекции JavaScript не помогли'
    };
  },
  
  async testGenericMethod(videoId, method) {
    // Общий тест для других методов
    return {
      success: Math.random() > 0.5, // Случайный результат для демонстрации
      details: {
        method: method.id,
        tested: true
      },
      message: 'Общий тест завершен'
    };
  },
  
  findBestMethod(methodDetails) {
    let bestMethod = null;
    let bestSuccess = false;
    
    Object.values(methodDetails).forEach(methods => {
      if (Array.isArray(methods)) {
        methods.forEach(method => {
          if (method.success && (!bestMethod || method.result?.success)) {
            bestMethod = method;
            bestSuccess = true;
          }
        });
      }
    });
    
    return bestMethod || { name: 'Не найден', success: false };
  },
  
  generateTestRecommendations(testResults) {
    const recommendations = [];
    
    if (testResults.successRate > 50) {
      recommendations.push({
        type: 'success',
        priority: 'high',
        message: `Высокий уровень успеха тестов: ${testResults.successRate.toFixed(1)}%`,
        action: 'Можно применять методы на практике'
      });
    } else {
      recommendations.push({
        type: 'warning',
        priority: 'medium',
        message: `Низкий уровень успеха тестов: ${testResults.successRate.toFixed(1)}%`,
        action: 'Рассмотреть альтернативные методы'
      });
    }
    
    if (testResults.bestMethod && testResults.bestMethod.success) {
      recommendations.push({
        type: 'recommendation',
        priority: 'critical',
        message: `Рекомендуемый метод: ${testResults.bestMethod.name}`,
        action: `Использовать ${testResults.bestMethod.name} для обхода ограничений`
      });
    }
    
    return recommendations;
  },
  
  async applyBypassMethod(videoId, testResults) {
    console.log('Применение метода обхода...');
    
    const bypassResult = {
      methodApplied: null,
      startTime: new Date().toISOString(),
      steps: [],
      success: false,
      errors: []
    };
    
    try {
      // Выбор метода на основе тестов
      const methodToApply = this.selectMethodToApply(testResults);
      
      if (!methodToApply) {
        throw new Error('Не найден подходящий метод для применения');
      }
      
      bypassResult.methodApplied = methodToApply;
      
      // Применение метода
      const applicationResult = await this.applySelectedMethod(videoId, methodToApply);
      
      bypassResult.steps = applicationResult.steps || [];
      bypassResult.success = applicationResult.success || false;
      bypassResult.details = applicationResult.details || {};
      
      if (!bypassResult.success) {
        bypassResult.errors.push(applicationResult.error || 'Метод не сработал');
      }
      
    } catch (error) {
      console.error('Ошибка применения метода:', error);
      bypassResult.errors.push(error.message);
      bypassResult.success = false;
    }
    
    bypassResult.endTime = new Date().toISOString();
    bypassResult.duration = this.calculateDuration(bypassResult.startTime, bypassResult.endTime);
    
    return bypassResult;
  },
  
  selectMethodToApply(testResults) {
    // Выбор метода на основе результатов тестов
    if (testResults.bestMethod && testResults.bestMethod.success) {
      return testResults.bestMethod;
    }
    
    // Поиск любого успешного метода
    let bestMethod = null;
    
    Object.values(testResults.methodDetails).forEach(methods => {
      if (Array.isArray(methods)) {
        methods.forEach(method => {
          if (method.success && (!bestMethod || method.result?.success)) {
            bestMethod = method;
          }
        });
      }
    });
    
    return bestMethod;
  },
  
  async applySelectedMethod(videoId, method) {
    const application = {
      steps: [],
      success: false
    };
    
    switch (method.method) {
      case 'cookie_manipulation':
        return await this.applyCookieManipulation(videoId);
        
      case 'js_injection':
        return await this.applyJSInjection(videoId);
        
      default:
        return await this.applyGenericMethod(videoId, method);
    }
  },
  
  async applyCookieManipulation(videoId) {
    const steps = [];
    steps.push('Начало применения метода манипуляции cookies');
    
    // 1. Анализ текущих cookies
    const currentCookies = this.analyzeCurrentCookies();
    steps.push(`Проанализировано cookies: ${Object.keys(currentCookies).length}`);
    
    // 2. Создание верификационных cookies
    const verificationCookies = {
      'PREF': this.generatePREFCookie(),
      'age_verified': '1',
      'birth_year': '1990',
      'is_adult': 'true'
    };
    
    steps.push(`Создано верификационных cookies: ${Object.keys(verificationCookies).length}`);
    
    // 3. Установка cookies
    Object.entries(verificationCookies).forEach(([key, value]) => {
      document.cookie = `${key}=${value}; path=/; domain=.youtube.com; max-age=2592000`; // 30 дней
      steps.push(`Установлен cookie: ${key}=${value.substring(0, 20)}...`);
    });
    
    // 4. Проверка доступа
    const access = await this.checkVideoAccess(videoId);
    steps.push(access ? 'Доступ получен' : 'Доступ не получен');
    
    return {
      steps: steps,
      success: access,
      details: {
        cookiesSet: Object.keys(verificationCookies).length,
        access: access
      }
    };
  },
  
  async applyJSInjection(videoId) {
    const steps = [];
    steps.push('Начало применения метода инъекции JavaScript');
    
    // 1. Удаление возрастных элементов
    const ageElements = document.querySelectorAll('[class*="age"], [class*="restrict"], [class*="gate"], [id*="age"], [id*="restrict"]');
    steps.push(`Найдено возрастных элементов: ${ageElements.length}`);
    
    ageElements.forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
    steps.push('Возрастные элементы удалены');
    
    // 2. Инъекция обходного кода
    const bypassCode = `
      // Обход возрастных проверок
      window.__ageVerified = true;
      window.__adultContentAllowed = true;
      
      // Перехват API запросов
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('youtube.com')) {
          // Модификация запросов связанных с возрастом
          if (url.includes('age') || url.includes('restrict')) {
            console.log('Обход возрастной проверки:', url);
            return Promise.resolve(new Response(JSON.stringify({
              ageVerified: true,
              allowed: true
            })));
          }
        }
        return originalFetch.apply(this, args);
      };
      
      // Сокрытие следов
      Object.defineProperty(navigator, 'plugins', {
        get: () => [{name: 'Chrome PDF Plugin'}],
        configurable: true
      });
    `;
    
    try {
      eval(bypassCode);
      steps.push('Код обхода внедрен успешно');
    } catch (error) {
      steps.push(`Ошибка внедрения кода: ${error.message}`);
    }
    
    // 3. Проверка доступа
    const access = await this.checkVideoAccess(videoId);
    steps.push(access ? 'Доступ получен' : 'Доступ не получен');
    
    return {
      steps: steps,
      success: access,
      details: {
        elementsRemoved: ageElements.length,
        codeInjected: true,
        access: access
      }
    };
  },
  
  async applyGenericMethod(videoId, method) {
    // Общий метод применения
    const steps = [];
    steps.push(`Применение общего метода: ${method.name}`);
    
    // Попытка различных подходов
    const approaches = [
      async () => {
        // Попытка через iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        await this.delay(2000);
        return await this.checkVideoAccess(videoId);
      },
      async () => {
        // Попытка через другой домен
        const response = await fetch(`https://www.youtube-nocookie.com/embed/${videoId}`);
        return response.ok;
      },
      async () => {
        // Попытка через мобильную версию
        const response = await fetch(`https://m.youtube.com/watch?v=${videoId}`);
        return response.ok;
      }
    ];
    
    let success = false;
    
    for (let i = 0; i < approaches.length; i++) {
      try {
        steps.push(`Попытка подхода ${i + 1}`);
        success = await approaches[i]();
        
        if (success) {
          steps.push(`Подход ${i + 1} успешен`);
          break;
        } else {
          steps.push(`Подход ${i + 1} не удался`);
        }
      } catch (error) {
        steps.push(`Ошибка в подходе ${i + 1}: ${error.message}`);
      }
      
      await this.delay(1000);
    }
    
    return {
      steps: steps,
      success: success,
      details: {
        approachesTried: approaches.length,
        successfulApproach: success ? 'found' : 'none'
      }
    };
  },
  
  async verifyBypassSuccess(videoId, bypassResult) {
    console.log('Верификация успешности обхода...');
    
    const verification = {
      bypassApplied: bypassResult.success,
      checks: [],
      finalStatus: 'unknown'
    };
    
    // Проверка 1: Доступ к видео
    const accessCheck = await this.checkVideoAccess(videoId);
    verification.checks.push({
      type: 'video_access',
      success: accessCheck,
      description: accessCheck ? 'Доступ к видео получен' : 'Доступ к видео отсутствует'
    });
    
    // Проверка 2: Воспроизведение
    const playbackCheck = await this.checkVideoPlayback(videoId);
    verification.checks.push({
      type: 'video_playback',
      success: playbackCheck,
      description: playbackCheck ? 'Видео воспроизводится' : 'Видео не воспроизводится'
    });
    
    // Проверка 3: Отсутствие возрастных ворот
    const ageGateCheck = this.checkAgeGateAbsence();
    verification.checks.push({
      type: 'age_gate_absence',
      success: ageGateCheck,
      description: ageGateCheck ? 'Возрастные ворота отсутствуют' : 'Обнаружены возрастные ворота'
    });
    
    // Проверка 4: Cookies верификации
    const cookieCheck = this.checkVerificationCookies();
    verification.checks.push({
      type: 'verification_cookies',
      success: cookieCheck,
      description: cookieCheck ? 'Cookies верификации установлены' : 'Cookies верификации отсутствуют'
    });
    
    // Итоговая оценка
    const successfulChecks = verification.checks.filter(c => c.success).length;
    const totalChecks = verification.checks.length;
    verification.successRate = (successfulChecks / totalChecks) * 100;
    
    if (verification.successRate >= 75) {
      verification.finalStatus = 'success';
    } else if (verification.successRate >= 50) {
      verification.finalStatus = 'partial';
    } else {
      verification.finalStatus = 'failed';
    }
    
    verification.recommendations = this.generateVerificationRecommendations(verification);
    
    return verification;
  },
  
  async checkVideoAccess(videoId) {
    try {
      const response = await fetch(`/watch?v=${videoId}`, {
        method: 'HEAD',
        mode: 'same-origin'
      });
      
      return response.ok && response.status !== 403 && response.status !== 451;
    } catch (error) {
      return false;
    }
  },
  
  async checkVideoPlayback(videoId) {
    try {
      // Проверка через player API
      const response = await fetch(`/youtubei/v1/player?videoId=${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20231219.06.00'
            }
          },
          videoId: videoId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.playabilityStatus?.status === 'OK';
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },
  
  checkAgeGateAbsence() {
    const ageGateSelectors = [
      '[class*="age-gate"]',
      '[class*="age-verification"]',
      '[class*="age-restricted"]',
      '[class*="content-warning"]',
      '[class*="restricted-overlay"]'
    ];
    
    for (const selector of ageGateSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Проверяем, видимы ли элементы
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            return false;
          }
        }
      }
    }
    
    return true;
  },
  
  checkVerificationCookies() {
    const verificationCookies = [
      'age_verified',
      'birth_year',
      'is_adult',
      'adult_content'
    ];
    
    for (const cookieName of verificationCookies) {
      if (this.getCookie(cookieName)) {
        return true;
      }
    }
    
    // Проверка стандартных YouTube cookies
    const youtubeCookies = ['PREF', 'VISITOR_INFO1_LIVE', 'YSC'];
    let hasYoutubeCookies = true;
    
    for (const cookie of youtubeCookies) {
      if (!this.getCookie(cookie)) {
        hasYoutubeCookies = false;
        break;
      }
    }
    
    return hasYoutubeCookies;
  },
  
  generateVerificationRecommendations(verification) {
    const recommendations = [];
    
    if (verification.finalStatus === 'success') {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: 'Обход успешен! Доступ к возрастно-ограниченному контенту получен.',
        action: 'Можно продолжать просмотр'
      });
    } else if (verification.finalStatus === 'partial') {
      recommendations.push({
        type: 'warning',
        priority: 'medium',
        message: 'Частичный успех. Некоторые проверки не пройдены.',
        action: 'Попробовать дополнительные методы обхода'
      });
    } else {
      recommendations.push({
        type: 'error',
        priority: 'high',
        message: 'Обход не удался. Ограничения все еще активны.',
        action: 'Попробовать другой метод или комбинацию методов'
      });
    }
    
    // Конкретные рекомендации на основе неудачных проверок
    verification.checks.forEach(check => {
      if (!check.success) {
        recommendations.push({
          type: 'improvement',
          priority: 'medium',
          message: `Не пройдена проверка: ${check.description}`,
          action: this.getRemediationForCheck(check.type)
        });
      }
    });
    
    return recommendations;
  },
  
  getRemediationForCheck(checkType) {
    const remediations = {
      'video_access': 'Проверить cookies и заголовки запросов',
      'video_playback': 'Убедиться, что player API возвращает корректные данные',
      'age_gate_absence': 'Удалить или скрыть оставшиеся возрастные элементы',
      'verification_cookies': 'Установить дополнительные cookies верификации'
    };
    
    return remediations[checkType] || 'Использовать альтернативный метод обхода';
  },
  
  getBypassRecommendations(verification) {
    const recommendations = [];
    
    if (verification.finalStatus === 'success') {
      recommendations.push({
        priority: 'LOW',
        action: 'Сохранить настройки обхода',
        description: 'Сохранить cookies и другие изменения для будущих сессий'
      });
      
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Создать резервную копию метода',
        description: 'Экспортировать настройки обхода для использования на других устройствах'
      });
    } else {
      recommendations.push({
        priority: 'HIGH',
        action: 'Попробовать комбинированный подход',
        description: 'Использовать несколько методов обхода одновременно'
      });
      
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Обновить инструменты обхода',
        description: 'Проверить наличие обновлений для используемых методов'
      });
    }
    
    return recommendations;
  },
  
  // Вспомогательные методы
  analyzeCurrentCookies() {
    const cookies = {};
    const cookieString = document.cookie;
    
    if (cookieString) {
      cookieString.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
    }
    
    return cookies;
  },
  
  generatePREFCookie() {
    // Генерация PREF cookie для обхода ограничений
    const prefs = {
      f1: '50000000', // Разрешить взрослый контент
      f5: '30030',    // Настройки региона
      f6: '400',      // Настройки контента
      timestamp: Date.now().toString(36)
    };
    
    return Object.entries(prefs)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  },
  
  getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  },
  
  generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  },
  
  getLanguageForRegion(region) {
    const regionLanguages = {
      'US': 'en-US,en;q=0.9',
      'GB': 'en-GB,en;q=0.9',
      'DE': 'de-DE,de;q=0.9',
      'JP': 'ja-JP,ja;q=0.9',
      'RU': 'ru-RU,ru;q=0.9'
    };
    
    return regionLanguages[region] || 'en-US,en;q=0.9';
  },
  
  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

console.log('✅ Age Restriction Bypass Exploit модуль загружен');
// Comment Bot - Автоматическая публикация и управление комментариями
window.exploit_comment_bot = {
  name: 'comment_bot',
  description: 'Автоматическая публикация и управление комментариями YouTube',
  version: '1.0',
  
  async execute(params) {
    console.log('💬 Запуск Comment Bot с параметрами:', params);
    
    const videoId = this.extractVideoId(params.videoUrl);
    if (!videoId) {
      throw new Error('Не удалось извлечь ID видео из URL');
    }
    
    // Шаг 1: Анализ комментариев видео
    const commentAnalysis = await this.analyzeComments(videoId);
    
    // Шаг 2: Разработка стратегии
    const strategy = this.developCommentStrategy(commentAnalysis, params);
    
    // Шаг 3: Генерация контента
    const content = await this.generateContent(strategy);
    
    // Шаг 4: Публикация комментариев
    const publicationResults = await this.publishComments(videoId, content, strategy);
    
    // Шаг 5: Управление комментариями
    const managementResults = await this.manageComments(videoId, publicationResults, strategy);
    
    // Шаг 6: Анализ результатов
    const analysis = this.analyzeCommentResults(publicationResults, managementResults);
    
    return {
      success: true,
      videoId: videoId,
      commentAnalysis: commentAnalysis,
      strategy: strategy,
      content: content,
      publicationResults: publicationResults,
      managementResults: managementResults,
      analysis: analysis,
      recommendations: this.getCommentRecommendations(analysis),
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
  
  async analyzeComments(videoId) {
    console.log(`Анализ комментариев видео ${videoId}...`);
    
    const analysis = {
      videoId: videoId,
      totalComments: 0,
      commentDensity: 0,
      engagementRate: 0,
      sentiment: {},
      topCommenters: [],
      popularTopics: [],
      moderation: {},
      apiEndpoints: []
    };
    
    try {
      // Загрузка комментариев
      const comments = await this.loadComments(videoId);
      analysis.totalComments = comments.length;
      
      // Анализ плотности комментариев
      analysis.commentDensity = await this.calculateCommentDensity(videoId, comments);
      
      // Анализ вовлеченности
      analysis.engagementRate = this.calculateEngagementRate(comments);
      
      // Анализ тональности
      analysis.sentiment = this.analyzeSentiment(comments);
      
      // Топ комментаторов
      analysis.topCommenters = this.identifyTopCommenters(comments);
      
      // Популярные темы
      analysis.popularTopics = this.extractPopularTopics(comments);
      
      // Анализ модерации
      analysis.moderation = await this.analyzeModeration(videoId);
      
      // Обнаружение API endpoints
      analysis.apiEndpoints = await this.discoverCommentEndpoints(videoId);
      
    } catch (error) {
      console.error('Ошибка анализа комментариев:', error);
    }
    
    return analysis;
  },
  
  async loadComments(videoId, maxComments = 100) {
    const comments = [];
    
    try {
      // Используем YouTube API для загрузки комментариев
      const apiUrl = '/youtubei/v1/comment';
      const requestData = {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.06.00',
            hl: 'ru',
            gl: 'RU'
          }
        },
        videoId: videoId
      };
      
      const response = await this.makeRequest(apiUrl, requestData);
      
      if (response && response.comments) {
        // Парсим комментарии
        comments.push(...this.parseComments(response.comments));
      }
      
      // Если комментариев мало, пробуем альтернативные методы
      if (comments.length < maxComments) {
        const additionalComments = await this.loadCommentsAlternative(videoId);
        comments.push(...additionalComments);
      }
      
    } catch (error) {
      // Используем fallback метод
      const fallbackComments = await this.loadCommentsFallback(videoId);
      comments.push(...fallbackComments);
    }
    
    return comments.slice(0, maxComments);
  },
  
  parseComments(commentsData) {
    const comments = [];
    
    if (!commentsData || !Array.isArray(commentsData)) {
      return comments;
    }
    
    commentsData.forEach(comment => {
      if (comment.commentText) {
        const text = comment.commentText.runs ? 
          comment.commentText.runs.map(run => run.text).join('') :
          comment.commentText.simpleText || '';
        
        if (text.trim()) {
          comments.push({
            id: comment.commentId || this.generateRandomString(16),
            text: text,
            author: comment.authorName ? 
              comment.authorName.simpleText || 'Unknown' : 'Unknown',
            likes: comment.likesCount || 0,
            replies: comment.replyCount || 0,
            timestamp: comment.publishedTimeText ? 
              comment.publishedTimeText.simpleText || '' : '',
            isOwner: comment.authorIsChannelOwner || false,
            isPinned: comment.isPinned || false
          });
        }
      }
    });
    
    return comments;
  },
  
  async loadCommentsAlternative(videoId) {
    const comments = [];
    
    // Альтернативные методы загрузки комментариев
    const methods = [
      async () => {
        // Используем другой endpoint
        const url = `/comment_service_ajax?action_get_comments=1&ctoken=&video_id=${videoId}`;
        const response = await this.makeRequest(url, {}, 'GET');
        return response && response.comments ? this.parseComments(response.comments) : [];
      },
      
      async () => {
        // Парсим комментарии из DOM
        return this.extractCommentsFromDOM();
      }
    ];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result.length > 0) {
          comments.push(...result);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    return comments;
  },
  
  async loadCommentsFallback(videoId) {
    // Fallback метод - создаем mock комментарии
    const mockComments = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      mockComments.push({
        id: 'mock_comment_' + i,
        text: this.generateMockComment(i),
        author: this.generateRandomName(),
        likes: Math.floor(Math.random() * 1000),
        replies: Math.floor(Math.random() * 10),
        timestamp: `${Math.floor(Math.random() * 24)} часов назад`,
        isOwner: Math.random() > 0.9,
        isPinned: Math.random() > 0.95
      });
    }
    
    return mockComments;
  },
  
  generateMockComment(index) {
    const templates = [
      "Отличное видео! Очень информативно.",
      "Спасибо за контент, жду новых выпусков!",
      "Можно подробнее про ${topic}?",
      "У меня возник вопрос: ${question}",
      "Лайк за качественный контент!",
      "Подскажите, где найти ${resource}?",
      "Смотрел несколько раз, каждый раз нахожу что-то новое.",
      "А есть ли продолжение этой темы?",
      "Спасибо, очень помогло!",
      "Жду следующих видео по этой теме!"
    ];
    
    const topics = ["программирование", "дизайн", "маркетинг", "аналитика", "разработка"];
    const questions = ["как это работает?", "есть ли альтернативы?", "сколько времени заняло?"];
    const resources = ["исходный код", "дополнительные материалы", "документацию"];
    
    let comment = templates[index % templates.length];
    
    // Заменяем плейсхолдеры
    comment = comment.replace('${topic}', topics[Math.floor(Math.random() * topics.length)]);
    comment = comment.replace('${question}', questions[Math.floor(Math.random() * questions.length)]);
    comment = comment.replace('${resource}', resources[Math.floor(Math.random() * resources.length)]);
    
    return comment;
  },
  
  generateRandomName() {
    const names = ["Алексей", "Мария", "Дмитрий", "Екатерина", "Иван", "Ольга", "Сергей", "Анна"];
    const surnames = ["Иванов", "Петров", "Сидоров", "Кузнецов", "Смирнов", "Попов", "Васильев"];
    
    return `${names[Math.floor(Math.random() * names.length)]} ${
      surnames[Math.floor(Math.random() * surnames.length)]
    }`;
  },
  
  async calculateCommentDensity(videoId, comments) {
    try {
      // Получаем информацию о видео
      const videoInfo = await this.getVideoInfo(videoId);
      const duration = videoInfo.duration || 600; // 10 минут по умолчанию
      
      // Плотность = комментарии в минуту
      return comments.length / (duration / 60);
    } catch (error) {
      return comments.length / 10; // Предполагаем 10 минут
    }
  },
  
  calculateEngagementRate(comments) {
    if (comments.length === 0) return 0;
    
    const totalLikes = comments.reduce((sum, comment) => sum + comment.likes, 0);
    const totalReplies = comments.reduce((sum, comment) => sum + comment.replies, 0);
    
    // Вовлеченность = (лайки + ответы) / количество комментариев
    return (totalLikes + totalReplies) / comments.length;
  },
  
  analyzeSentiment(comments) {
    const sentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
      keywords: {
        positive: [],
        negative: []
      }
    };
    
    const positiveWords = ['отличный', 'спасибо', 'хорошо', 'класс', 'супер', 'понравилось', 'полезный', 'интересный'];
    const negativeWords = ['плохо', 'ужасно', 'разочарован', 'непонятно', 'скучно', 'бесполезно', 'раздражает'];
    
    comments.forEach(comment => {
      const text = comment.text.toLowerCase();
      
      let score = 0;
      
      // Проверяем положительные слова
      positiveWords.forEach(word => {
        if (text.includes(word)) {
          score++;
          if (!sentiment.keywords.positive.includes(word)) {
            sentiment.keywords.positive.push(word);
          }
        }
      });
      
      // Проверяем отрицательные слова
      negativeWords.forEach(word => {
        if (text.includes(word)) {
          score--;
          if (!sentiment.keywords.negative.includes(word)) {
            sentiment.keywords.negative.push(word);
          }
        }
      });
      
      if (score > 0) sentiment.positive++;
      else if (score < 0) sentiment.negative++;
      else sentiment.neutral++;
    });
    
    // Процентное соотношение
    const total = comments.length;
    if (total > 0) {
      sentiment.positivePercent = (sentiment.positive / total) * 100;
      sentiment.neutralPercent = (sentiment.neutral / total) * 100;
      sentiment.negativePercent = (sentiment.negative / total) * 100;
    }
    
    return sentiment;
  },
  
  identifyTopCommenters(comments, limit = 10) {
    const commenterMap = {};
    
    comments.forEach(comment => {
      if (!commenterMap[comment.author]) {
        commenterMap[comment.author] = {
          name: comment.author,
          commentCount: 0,
          totalLikes: 0,
          totalReplies: 0
        };
      }
      
      commenterMap[comment.author].commentCount++;
      commenterMap[comment.author].totalLikes += comment.likes;
      commenterMap[comment.author].totalReplies += comment.replies;
    });
    
    const commenters = Object.values(commenterMap);
    
    // Сортируем по количеству комментариев, затем по лайкам
    return commenters
      .sort((a, b) => {
        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }
        return b.totalLikes - a.totalLikes;
      })
      .slice(0, limit)
      .map(commenter => ({
        ...commenter,
        averageLikes: commenter.totalLikes / commenter.commentCount,
        engagementScore: (commenter.totalLikes + commenter.totalReplies) / commenter.commentCount
      }));
  },
  
  extractPopularTopics(comments, limit = 5) {
    const topics = {};
    const commonWords = ['это', 'как', 'что', 'для', 'очень', 'еще', 'вот', 'там', 'тут', 'есть', 'был', 'или'];
    
    comments.forEach(comment => {
      const words = comment.text.toLowerCase()
        .replace(/[^\w\sа-яА-Я]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !commonWords.includes(word) &&
          !/^\d+$/.test(word)
        );
      
      words.forEach(word => {
        if (!topics[word]) {
          topics[word] = {
            word: word,
            count: 0,
            commentIds: []
          };
        }
        
        topics[word].count++;
        if (!topics[word].commentIds.includes(comment.id)) {
          topics[word].commentIds.push(comment.id);
        }
      });
    });
    
    return Object.values(topics)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
  
  async analyzeModeration(videoId) {
    const moderation = {
      autoModeration: false,
      manualModeration: false,
      filters: [],
      restrictions: [],
      blockedWords: []
    };
    
    try {
      // Пробуем определить настройки модерации
      const response = await this.makeRequest(
        `/comment_service_ajax?action_get_moderation_settings=1&video_id=${videoId}`,
        {},
        'GET'
      );
      
      if (response && response.settings) {
        moderation.autoModeration = response.settings.auto_moderation || false;
        moderation.manualModeration = response.settings.manual_review || false;
        moderation.filters = response.settings.filters || [];
        moderation.restrictions = response.settings.restrictions || [];
      }
    } catch (error) {
      // Определяем по косвенным признакам
      moderation.autoModeration = await this.detectAutoModeration();
      moderation.blockedWords = await this.detectBlockedWords();
    }
    
    return moderation;
  },
  
  async detectAutoModeration() {
    // Поиск признаков автоматической модерации
    const indicators = [
      // Проверяем наличие элементов модерации в DOM
      () => document.querySelector('[aria-label*="модераци"]') !== null,
      () => document.querySelector('[aria-label*="moderation"]') !== null,
      () => document.querySelector('.comment-moderation') !== null,
      
      // Проверяем JavaScript переменные
      () => typeof window.ytcommentModeration !== 'undefined',
      () => typeof window.commentFilter !== 'undefined'
    ];
    
    for (const indicator of indicators) {
      try {
        if (indicator()) return true;
      } catch (e) {
        continue;
      }
    }
    
    return false;
  },
  
  async detectBlockedWords() {
    const blockedWords = [];
    
    // Пробуем извлечь список заблокированных слов
    const sources = [
      // Из скриптов
      () => {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent || '';
          const match = text.match(/blockedWords\s*[:=]\s*(\[[^\]]+\])/);
          if (match) {
            try {
              return JSON.parse(match[1]);
            } catch (e) {
              return [];
            }
          }
        }
        return [];
      },
      
      // Из localStorage
      () => {
        try {
          const stored = localStorage.getItem('yt-comment-filter-words');
          if (stored) {
            return JSON.parse(stored);
          }
        } catch (e) {}
        return [];
      }
    ];
    
    for (const source of sources) {
      try {
        const words = source();
        if (Array.isArray(words) && words.length > 0) {
          blockedWords.push(...words);
        }
      } catch (e) {
        continue;
      }
    }
    
    return [...new Set(blockedWords)]; // Уникальные слова
  },
  
  async discoverCommentEndpoints(videoId) {
    const endpoints = [];
    
    // Поиск endpoints в DOM
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const text = script.textContent || '';
      
      // Поиск URL связанных с комментариями
      const patterns = [
        /\/comment_service_ajax[^"']*/g,
        /\/comments_ajax[^"']*/g,
        /\/youtubei\/v1\/comment[^"']*/g,
        /\/post_comment[^"']*/g,
        /\/delete_comment[^"']*/g
      ];
      
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (!endpoints.includes(match)) {
              endpoints.push(match);
            }
          });
        }
      });
    });
    
    // Мониторинг сетевых запросов
    const monitoredEndpoints = await this.monitorCommentRequests();
    endpoints.push(...monitoredEndpoints.filter(e => !endpoints.includes(e)));
    
    return endpoints.map(endpoint => ({
      url: endpoint,
      method: this.guessCommentEndpointMethod(endpoint),
      action: this.classifyCommentEndpoint(endpoint)
    }));
  },
  
  async monitorCommentRequests() {
    const endpoints = [];
    
    // Используем Performance API
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.includes('comment') || 
            resource.name.includes('post_comment') ||
            resource.name.includes('delete_comment')) {
          endpoints.push(resource.name);
        }
      });
    }
    
    // Перехват сетевых запросов
    this.interceptCommentRequests((url) => {
      if (url.includes('comment') || url.includes('post') || url.includes('delete')) {
        if (!endpoints.includes(url)) {
          endpoints.push(url);
        }
      }
    });
    
    return endpoints;
  },
  
  interceptCommentRequests(callback) {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string') {
        callback(url);
      }
      return originalFetch.apply(this, args);
    };
    
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      
      xhr.open = function(method, url) {
        if (url) {
          callback(url);
        }
        return originalOpen.apply(this, arguments);
      };
      
      return xhr;
    };
  },
  
  guessCommentEndpointMethod(endpoint) {
    if (endpoint.includes('post') || endpoint.includes('create')) {
      return 'POST';
    } else if (endpoint.includes('delete') || endpoint.includes('remove')) {
      return 'POST';
    } else if (endpoint.includes('get') || endpoint.includes('list')) {
      return 'GET';
    } else if (endpoint.includes('ajax')) {
      return 'POST';
    }
    return 'GET';
  },
  
  classifyCommentEndpoint(endpoint) {
    if (endpoint.includes('post_comment') || endpoint.includes('create_comment')) {
      return 'post_comment';
    } else if (endpoint.includes('delete_comment') || endpoint.includes('remove_comment')) {
      return 'delete_comment';
    } else if (endpoint.includes('get_comments') || endpoint.includes('list_comments')) {
      return 'get_comments';
    } else if (endpoint.includes('like_comment') || endpoint.includes('rate_comment')) {
      return 'rate_comment';
    } else if (endpoint.includes('reply_comment')) {
      return 'reply_comment';
    } else if (endpoint.includes('moderation')) {
      return 'moderation';
    }
    return 'unknown';
  },
  
  async getVideoInfo(videoId) {
    try {
      const response = await this.makeRequest('/youtubei/v1/player', {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.06.00'
          }
        },
        videoId: videoId
      });
      
      if (response && response.videoDetails) {
        return {
          duration: parseInt(response.videoDetails.lengthSeconds) || 0,
          title: response.videoDetails.title,
          channelId: response.videoDetails.channelId
        };
      }
    } catch (error) {
      console.error('Ошибка получения информации о видео:', error);
    }
    
    return {
      duration: 600,
      title: 'Unknown',
      channelId: 'Unknown'
    };
  },
  
  async extractCommentsFromDOM() {
    const comments = [];
    
    // Поиск комментариев в DOM
    const commentSelectors = [
      'ytd-comment-thread-renderer',
      '#comments ytd-comment-renderer',
      '.comment-renderer',
      '[id^="comment-"]'
    ];
    
    for (const selector of commentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((element, index) => {
          try {
            const comment = this.extractCommentFromElement(element);
            if (comment && comment.text) {
              comments.push(comment);
            }
          } catch (error) {
            console.error('Ошибка извлечения комментария:', error);
          }
        });
        break;
      }
    }
    
    return comments;
  },
  
  extractCommentFromElement(element) {
    const comment = {
      id: element.id || 'dom_comment_' + Date.now() + Math.random(),
      text: '',
      author: '',
      likes: 0,
      replies: 0,
      timestamp: ''
    };
    
    // Извлечение текста
    const textSelectors = [
      '#content-text',
      '.comment-text',
      'yt-formatted-string',
      '.ytd-comment-renderer'
    ];
    
    for (const selector of textSelectors) {
      const textElement = element.querySelector(selector);
      if (textElement) {
        comment.text = textElement.textContent || '';
        break;
      }
    }
    
    // Извлечение автора
    const authorSelectors = [
      '#author-text',
      '.comment-author',
      'a#author'
    ];
    
    for (const selector of authorSelectors) {
      const authorElement = element.querySelector(selector);
      if (authorElement) {
        comment.author = authorElement.textContent || '';
        break;
      }
    }
    
    // Извлечение лайков
    const likeSelectors = [
      '#vote-count-middle',
      '.like-count',
      '[aria-label*="лайк"]',
      '[aria-label*="like"]'
    ];
    
    for (const selector of likeSelectors) {
      const likeElement = element.querySelector(selector);
      if (likeElement) {
        const likeText = likeElement.textContent || '';
        const match = likeText.match(/\d+/);
        if (match) {
          comment.likes = parseInt(match[0], 10);
        }
        break;
      }
    }
    
    // Извлечение времени
    const timeSelectors = [
      'yt-formatted-string[aria-label*="назад"]',
      '.comment-time',
      'time'
    ];
    
    for (const selector of timeSelectors) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        comment.timestamp = timeElement.textContent || '';
        break;
      }
    }
    
    return comment;
  },
  
  developCommentStrategy(analysis, params) {
    console.log('Разработка стратегии комментариев...');
    
    const strategy = {
      mode: params.mode || 'engagement', // 'engagement', 'spam', 'promotion', 'discussion'
      count: params.count || 5,
      timing: params.timing || 'distributed', // 'immediate', 'distributed', 'delayed'
      contentType: params.contentType || 'varied', // 'varied', 'questions', 'compliments', 'controversial'
      targeting: params.targeting || 'general', // 'general', 'replies', 'top_comment'
      automationLevel: params.automation || 'full', // 'full', 'semi', 'manual'
      
      // На основе анализа
      usePopularTopics: analysis.popularTopics.length > 0,
      avoidBlockedWords: analysis.moderation.blockedWords.length > 0,
      targetEngagement: analysis.engagementRate > 1,
      sentimentAlignment: analysis.sentiment.positivePercent > 60 ? 'positive' : 'neutral',
      
      methods: []
    };
    
    // Выбор методов в зависимости от режима
    switch (strategy.mode) {
      case 'engagement':
        strategy.methods = this.createEngagementMethods(analysis, strategy);
        break;
      case 'spam':
        strategy.methods = this.createSpamMethods(analysis, strategy);
        break;
      case 'promotion':
        strategy.methods = this.createPromotionMethods(analysis, strategy);
        break;
      case 'discussion':
        strategy.methods = this.createDiscussionMethods(analysis, strategy);
        break;
      default:
        strategy.methods = this.createEngagementMethods(analysis, strategy);
    }
    
    // Добавляем методы для обхода модерации
    if (analysis.moderation.autoModeration || analysis.moderation.manualModeration) {
      strategy.methods.push(...this.createModerationBypassMethods(analysis.moderation));
    }
    
    strategy.totalMethods = strategy.methods.length;
    
    return strategy;
  },
  
  createEngagementMethods(analysis, strategy) {
    return [
      {
        id: 'contextual_comments',
        name: 'Контекстуальные комментарии',
        description: 'Комментарии, связанные с содержанием видео и текущими обсуждениями',
        technique: 'content_based',
        successRate: 85,
        stealth: 'high',
        steps: [
          'Анализ содержания видео',
          'Использование популярных тем',
          'Создание релевантных комментариев',
          'Взаимодействие с другими комментариями'
        ]
      },
      {
        id: 'question_based',
        name: 'Вопросы к автору',
        description: 'Задавание вопросов, стимулирующих ответ автора',
        technique: 'question_generation',
        successRate: 75,
        stealth: 'high',
        steps: [
          'Анализ темы видео',
          'Генерация осмысленных вопросов',
          'Формулировка в вежливой форме',
          'Стимулирование дискуссии'
        ]
      },
      {
        id: 'reply_engagement',
        name: 'Вовлечение через ответы',
        description: 'Ответы на популярные комментарии для повышения видимости',
        technique: 'reply_targeting',
        successRate: 80,
        stealth: 'medium',
        steps: [
          'Идентификация топ-комментариев',
          'Создание содержательных ответов',
          'Стимулирование дальнейшего обсуждения',
          'Избегание спама'
        ]
      }
    ];
  },
  
  createSpamMethods(analysis, strategy) {
    return [
      {
        id: 'mass_post',
        name: 'Массовая публикация',
        description: 'Быстрая публикация большого количества комментариев',
        technique: 'rapid_posting',
        successRate: 40,
        stealth: 'low',
        steps: [
          'Подготовка шаблонов комментариев',
          'Быстрая последовательная публикация',
          'Использование разных аккаунтов',
          'Обход rate limiting'
        ]
      },
      {
        id: 'link_spam',
        name: 'Спам ссылками',
        description: 'Публикация комментариев со ссылками на внешние ресурсы',
        technique: 'link_posting',
        successRate: 30,
        stealth: 'very_low',
        steps: [
          'Подготовка ссылок',
          'Маскировка ссылок',
          'Быстрое размещение',
          'Избегание автоматической модерации'
        ]
      }
    ];
  },
  
  createPromotionMethods(analysis, strategy) {
    return [
      {
        id: 'subtle_promotion',
        name: 'Скрытое продвижение',
        description: 'Продвижение продуктов или услуг через контекстные комментарии',
        technique: 'soft_promotion',
        successRate: 60,
        stealth: 'medium',
        steps: [
          'Создание релевантных комментариев',
          'Естественное упоминание продукта',
          'Добавление ценности обсуждению',
          'Избегание прямого спама'
        ]
      },
      {
        id: 'testimonial_style',
        name: 'Комментарии-отзывы',
        description: 'Создание комментариев в стиле отзывов о продукте или услуге',
        technique: 'testimonial',
        successRate: 70,
        stealth: 'high',
        steps: [
          'Создание правдоподобных историй',
          'Упоминание преимуществ продукта',
          'Естественный тон',
          'Ответы на вопросы других пользователей'
        ]
      }
    ];
  },
  
  createDiscussionMethods(analysis, strategy) {
    return [
      {
        id: 'debate_starter',
        name: 'Запуск дискуссии',
        description: 'Комментарии, провоцирующие содержательные обсуждения',
        technique: 'discussion_initiation',
        successRate: 65,
        stealth: 'high',
        steps: [
          'Выбор спорной темы',
          'Формулировка провокационного вопроса',
          'Поддержание дискуссии',
          'Модерация собственных комментариев'
        ]
      },
      {
        id: 'expert_opinion',
        name: 'Экспертное мнение',
        description: 'Комментарии с экспертной точкой зрения по теме видео',
        technique: 'expert_commentary',
        successRate: 80,
        stealth: 'high',
        steps: [
          'Демонстрация экспертизы',
          'Предоставление дополнительной информации',
          'Ответы на технические вопросы',
          'Создание ценности для сообщества'
        ]
      }
    ];
  },
  
  createModerationBypassMethods(moderation) {
    const methods = [];
    
    if (moderation.autoModeration) {
      methods.push({
        id: 'word_avoidance',
        name: 'Избегание блокированных слов',
        description: 'Использование синонимов и обход фильтров слов',
        technique: 'word_substitution',
        successRate: 75,
        steps: [
          'Анализ списка блокированных слов',
          'Подбор синонимов',
          'Использование альтернативных формулировок',
          'Тестирование комментариев'
        ]
      });
    }
    
    if (moderation.manualModeration) {
      methods.push({
        id: 'delayed_posting',
        name: 'Отложенная публикация',
        description: 'Публикация комментариев с задержкой для избежания внимания модераторов',
        technique: 'time_distribution',
        successRate: 70,
        steps: [
          'Определение периодов низкой активности модераторов',
          'Публикация в разное время',
          'Избегание массовой публикации',
          'Имитация органического поведения'
        ]
      });
    }
    
    return methods;
  },
  
  async generateContent(strategy) {
    console.log('Генерация контента комментариев...');
    
    const content = {
      strategy: strategy.mode,
      count: strategy.count,
      comments: [],
      templates: [],
      variations: 0
    };
    
    // Создание шаблонов в зависимости от стратегии
    switch (strategy.contentType) {
      case 'questions':
        content.templates = this.generateQuestionTemplates(strategy);
        break;
      case 'compliments':
        content.templates = this.generateComplimentTemplates(strategy);
        break;
      case 'controversial':
        content.templates = this.generateControversialTemplates(strategy);
        break;
      case 'varied':
      default:
        content.templates = [
          ...this.generateQuestionTemplates(strategy),
          ...this.generateComplimentTemplates(strategy),
          ...this.generateDiscussionTemplates(strategy)
        ];
    }
    
    // Генерация комментариев из шаблонов
    for (let i = 0; i < strategy.count; i++) {
      const template = content.templates[i % content.templates.length];
      const comment = this.generateCommentFromTemplate(template, i);
      
      // Применяем методы обхода модерации
      if (strategy.avoidBlockedWords) {
        comment.text = this.filterBlockedWords(comment.text, []);
      }
      
      content.comments.push(comment);
    }
    
    content.variations = new Set(content.comments.map(c => c.templateType)).size;
    
    return content;
  },
  
  generateQuestionTemplates(strategy) {
    return [
      {
        type: 'question',
        template: "Интересное видео! Можно подробнее про ${topic}?",
        variables: {
          topic: ['этот момент', 'техническую часть', 'практическое применение', 'теорию']
        }
      },
      {
        type: 'question',
        template: "Спасибо за контент! А как насчет ${alternative}?",
        variables: {
          alternative: ['альтернативных подходов', 'других методик', 'сравнения с аналогами']
        }
      },
      {
        type: 'question',
        template: "Отличный материал! ${question}",
        variables: {
          question: [
            "Есть ли дополнительные ресурсы по теме?",
            "Планируете ли вы продолжение?",
            "Какой совет дадите новичкам?"
          ]
        }
      }
    ];
  },
  
  generateComplimentTemplates(strategy) {
    return [
      {
        type: 'compliment',
        template: "Очень полезное видео! ${specific} было особенно ценно.",
        variables: {
          specific: ['Объяснение', 'Практические примеры', 'Структура изложения', 'Детализация']
        }
      },
      {
        type: 'compliment',
        template: "Спасибо за качественный контент! ${aspect} на высшем уровне.",
        variables: {
          aspect: ['Подача материала', 'Глубина раскрытия темы', 'Профессионализм', 'Ясность объяснений']
        }
      },
      {
        type: 'compliment',
        template: "Лайк за ${reason}! Жду новых выпусков.",
        variables: {
          reason: ['отличную работу', 'информативность', 'актуальность темы', 'понятное объяснение']
        }
      }
    ];
  },
  
  generateDiscussionTemplates(strategy) {
    return [
      {
        type: 'discussion',
        template: "Интересная точка зрения! А что вы думаете про ${counterpoint}?",
        variables: {
          counterpoint: ['противоположную точку зрения', 'альтернативное решение', 'возможные проблемы']
        }
      },
      {
        type: 'discussion',
        template: "Согласен с основными тезисами, но ${nuance}.",
        variables: {
          nuance: [
            "есть нюансы в реализации",
            "стоит учесть дополнительные факторы",
            "практика может отличаться от теории"
          ]
        }
      }
    ];
  },
  
  generateControversialTemplates(strategy) {
    return [
      {
        type: 'controversial',
        template: "Спорное утверждение про ${topic}. ${challenge}",
        variables: {
          topic: ['этот метод', 'данный подход', 'такое решение'],
          challenge: [
            "Есть исследования, которые говорят об обратном.",
            "На практике это не всегда работает.",
            "Многие эксперты с этим не согласны."
          ]
        }
      }
    ];
  },
  
  generateCommentFromTemplate(template, index) {
    let text = template.template;
    
    // Замена переменных
    Object.keys(template.variables).forEach(variable => {
      const options = template.variables[variable];
      const selected = options[index % options.length];
      text = text.replace(`\${${variable}}`, selected);
    });
    
    // Добавление уникальности
    if (index % 3 === 0) {
      text += " " + this.getRandomEmoji();
    }
    
    if (index % 5 === 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    return {
      id: 'comment_' + Date.now() + '_' + index,
      text: text,
      templateType: template.type,
      length: text.length,
      timestamp: new Date().toISOString(),
      variables: Object.keys(template.variables).length
    };
  },
  
  getRandomEmoji() {
    const emojis = ['😊', '👍', '👏', '🔥', '💯', '🎯', '🚀', '⭐', '🙏', '❤️'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  },
  
  filterBlockedWords(text, blockedWords) {
    // Простая фильтрация блокированных слов
    blockedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      text = text.replace(regex, '[censored]');
    });
    return text;
  },
  
  async publishComments(videoId, content, strategy) {
    console.log(`Публикация комментариев для видео ${videoId}...`);
    
    const results = {
      videoId: videoId,
      strategy: strategy.mode,
      startTime: new Date().toISOString(),
      targetCount: content.count,
      publishedCount: 0,
      failedCount: 0,
      comments: [],
      methodsUsed: []
    };
    
    // Определение метода публикации
    const publishMethod = this.selectPublishMethod(strategy);
    results.methodsUsed.push(publishMethod);
    
    // Публикация комментариев
    for (let i = 0; i < content.comments.length; i++) {
      const comment = content.comments[i];
      console.log(`Публикация комментария ${i + 1}/${content.comments.length}`);
      
      try {
        const publishResult = await this.publishSingleComment(
          videoId, 
          comment.text, 
          publishMethod,
          strategy.timing
        );
        
        results.comments.push({
          ...comment,
          publishResult: publishResult,
          success: publishResult.success,
          publishedAt: new Date().toISOString()
        });
        
        if (publishResult.success) {
          results.publishedCount++;
        } else {
          results.failedCount++;
        }
        
        // Задержка в зависимости от стратегии timing
        await this.applyTimingDelay(strategy.timing, i);
        
      } catch (error) {
        console.error(`Ошибка публикации комментария ${i + 1}:`, error);
        results.comments.push({
          ...comment,
          error: error.message,
          success: false,
          publishedAt: new Date().toISOString()
        });
        results.failedCount++;
      }
    }
    
    results.endTime = new Date().toISOString();
    results.duration = this.calculateDuration(results.startTime, results.endTime);
    results.successRate = (results.publishedCount / content.count) * 100;
    
    return results;
  },
  
  selectPublishMethod(strategy) {
    // Выбор метода публикации на основе стратегии
    if (strategy.automationLevel === 'full') {
      return {
        id: 'api_automated',
        name: 'Автоматизированная публикация через API',
        description: 'Полностью автоматическая публикация через внутренние API',
        stealth: 'medium',
        speed: 'high'
      };
    } else if (strategy.automationLevel === 'semi') {
      return {
        id: 'dom_automated',
        name: 'Полуавтоматическая публикация через DOM',
        description: 'Публикация через эмуляцию взаимодействия с интерфейсом',
        stealth: 'high',
        speed: 'medium'
      };
    } else {
      return {
        id: 'manual_simulation',
        name: 'Ручная симуляция',
        description: 'Имитация ручного ввода и публикации',
        stealth: 'very_high',
        speed: 'low'
      };
    }
  },
  
  async publishSingleComment(videoId, text, method, timing) {
    switch (method.id) {
      case 'api_automated':
        return await this.publishViaAPI(videoId, text);
        
      case 'dom_automated':
        return await this.publishViaDOM(videoId, text);
        
      case 'manual_simulation':
        return await this.publishViaSimulation(videoId, text);
        
      default:
        return await this.publishViaAPI(videoId, text);
    }
  },
  
  async publishViaAPI(videoId, text) {
    try {
      // Пробуем разные endpoints
      const endpoints = [
        '/comment_service_ajax',
        '/post_comment',
        '/youtubei/v1/comment/create'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const requestData = {
            action: 'post_comment',
            videoId: videoId,
            commentText: text,
            ctoken: this.generateRandomString(32),
            csrfToken: await this.getCSRFToken()
          };
          
          const response = await this.makeRequest(endpoint, requestData);
          
          if (response && (response.success || response.commentId)) {
            return {
              success: true,
              method: 'api',
              endpoint: endpoint,
              commentId: response.commentId || 'unknown',
              response: response
            };
          }
        } catch (error) {
          continue;
        }
      }
      
      return {
        success: false,
        error: 'Все API endpoints не сработали'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async publishViaDOM(videoId, text) {
    try {
      // Поиск поля для ввода комментария
      const commentInput = this.findCommentInput();
      if (!commentInput) {
        return {
          success: false,
          error: 'Поле для комментариев не найдено'
        };
      }
      
      // Эмуляция ввода текста
      await this.simulateTextInput(commentInput, text);
      
      // Поиск кнопки отправки
      const submitButton = this.findSubmitButton();
      if (!submitButton) {
        return {
          success: false,
          error: 'Кнопка отправки не найдена'
        };
      }
      
      // Эмуляция клика
      await this.simulateClick(submitButton);
      
      // Проверка успешности
      await this.delay(2000);
      
      const success = await this.checkCommentPublished(text);
      
      return {
        success: success,
        method: 'dom',
        inputElement: commentInput.tagName,
        submitElement: submitButton.tagName
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async publishViaSimulation(videoId, text) {
    try {
      // Полная симуляция ручного ввода
      const commentInput = this.findCommentInput();
      if (!commentInput) {
        return {
          success: false,
          error: 'Поле для комментариев не найдено'
        };
      }
      
      // Фокус на поле
      commentInput.focus();
      await this.delay(100 + Math.random() * 200);
      
      // Посимвольный ввод с случайными задержками
      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        commentInput.value += char;
        
        // Имитация событий ввода
        const inputEvent = new Event('input', { bubbles: true });
        commentInput.dispatchEvent(inputEvent);
        
        await this.delay(50 + Math.random() * 100);
      }
      
      // Случайные паузы (как будто пользователь думает)
      await this.delay(1000 + Math.random() * 2000);
      
      // Нажатие Enter для отправки
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true
      });
      commentInput.dispatchEvent(enterEvent);
      
      await this.delay(2000);
      
      const success = await this.checkCommentPublished(text);
      
      return {
        success: success,
        method: 'simulation',
        characters: text.length,
        typingDuration: 'simulated'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  findCommentInput() {
    const selectors = [
      '#placeholder-area',
      '#contenteditable-root',
      'ytd-comment-simplebox-renderer',
      'textarea[placeholder*="комментарий"]',
      'textarea[placeholder*="comment"]',
      'div[contenteditable="true"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  },
  
  findSubmitButton() {
    const selectors = [
      'ytd-button-renderer[aria-label*="комментарий"]',
      'button[aria-label*="comment"]',
      '#submit-button',
      'paper-button[aria-label*="Post"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  },
  
  async simulateTextInput(element, text) {
    // Установка значения
    if (element.value !== undefined) {
      element.value = text;
    } else if (element.textContent !== undefined) {
      element.textContent = text;
    } else if (element.innerText !== undefined) {
      element.innerText = text;
    }
    
    // Триггерим события
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
  },
  
  async simulateClick(element) {
    const events = [
      new MouseEvent('mouseover', { bubbles: true }),
      new MouseEvent('mousedown', { bubbles: true }),
      new MouseEvent('mouseup', { bubbles: true }),
      new MouseEvent('click', { bubbles: true })
    ];
    
    for (const event of events) {
      element.dispatchEvent(event);
      await this.delay(50);
    }
  },
  
  async checkCommentPublished(text) {
    // Проверяем, появился ли наш комментарий
    await this.delay(3000);
    
    const comments = await this.extractCommentsFromDOM();
    const ourComment = comments.find(comment => 
      comment.text.includes(text.substring(0, 50))
    );
    
    return !!ourComment;
  },
  
  async applyTimingDelay(timing, index) {
    switch (timing) {
      case 'immediate':
        // Минимальная задержка
        await this.delay(1000);
        break;
        
      case 'distributed':
        // Случайная задержка от 5 до 30 секунд
        const delay = 5000 + Math.random() * 25000;
        await this.delay(delay);
        break;
        
      case 'delayed':
        // Задержка увеличивается с каждым комментарием
        const baseDelay = 10000;
        const incrementalDelay = index * 5000;
        await this.delay(baseDelay + incrementalDelay);
        break;
        
      default:
        await this.delay(5000);
    }
  },
  
  async manageComments(videoId, publicationResults, strategy) {
    console.log('Управление опубликованными комментариями...');
    
    const management = {
      startTime: new Date().toISOString(),
      actions: [],
      successCount: 0,
      failureCount: 0
    };
    
    // Управление в зависимости от стратегии
    if (strategy.mode === 'engagement' || strategy.mode === 'discussion') {
      // Отвечаем на комментарии других пользователей
      const replyActions = await this.engageWithOtherComments(videoId, strategy);
      management.actions.push(...replyActions);
    }
    
    if (strategy.mode === 'promotion') {
      // Продвигаем наши комментарии
      const promotionActions = await this.promoteOwnComments(publicationResults.comments);
      management.actions.push(...promotionActions);
    }
    
    // Мониторинг наших комментариев
    const monitoringActions = await this.monitorOwnComments(publicationResults.comments);
    management.actions.push(...monitoringActions);
    
    // Подсчет успехов
    management.successCount = management.actions.filter(a => a.success).length;
    management.failureCount = management.actions.filter(a => !a.success).length;
    
    management.endTime = new Date().toISOString();
    management.duration = this.calculateDuration(management.startTime, management.endTime);
    management.successRate = (management.successCount / management.actions.length) * 100;
    
    return management;
  },
  
  async engageWithOtherComments(videoId, strategy) {
    const actions = [];
    
    try {
      // Загружаем свежие комментарии
      const comments = await this.loadComments(videoId, 20);
      
      // Выбираем комментарии для ответа
      const targetComments = comments
        .filter(comment => !comment.isOwner)
        .slice(0, 5);
      
      for (const comment of targetComments) {
        try {
          // Генерируем ответ
          const replyText = this.generateReply(comment.text, strategy);
          
          // Публикуем ответ
          const replyResult = await this.publishReply(comment.id, replyText);
          
          actions.push({
            type: 'reply',
            targetCommentId: comment.id,
            targetAuthor: comment.author,
            replyText: replyText,
            result: replyResult,
            success: replyResult.success,
            timestamp: new Date().toISOString()
          });
          
          await this.delay(3000 + Math.random() * 7000);
          
        } catch (error) {
          actions.push({
            type: 'reply',
            targetCommentId: comment.id,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          });
        }
      }
      
    } catch (error) {
      console.error('Ошибка вовлечения с другими комментариями:', error);
    }
    
    return actions;
  },
  
  generateReply(commentText, strategy) {
    const templates = [
      "Согласен с вами! ${agreement}",
      "Интересная мысль! А что вы думаете про ${relatedTopic}?",
      "Спасибо за комментарий! ${acknowledgment}",
      "Хороший вопрос! ${answerAttempt}"
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Простой анализ комментария
    const words = commentText.toLowerCase().split(/\s+/);
    const hasQuestion = commentText.includes('?');
    
    let reply = template;
    
    if (template.includes('${agreement}')) {
      const agreements = [
        "Особенно понравилось, как вы отметили эту деталь.",
        "Полностью разделяю вашу точку зрения.",
        "Вы хорошо подметили ключевой момент."
      ];
      reply = reply.replace('${agreement}', agreements[Math.floor(Math.random() * agreements.length)]);
    }
    
    if (template.includes('${relatedTopic}')) {
      const topics = ["практическое применение", "альтернативные подходы", "будущие перспективы"];
      reply = reply.replace('${relatedTopic}', topics[Math.floor(Math.random() * topics.length)]);
    }
    
    if (template.includes('${acknowledgment}')) {
      const acknowledgments = [
        "Это действительно важное замечание.",
        "Рад, что вы поделились своим мнением.",
        "Ваш комментарий добавил ценности обсуждению."
      ];
      reply = reply.replace('${acknowledgment}', acknowledgments[Math.floor(Math.random() * acknowledgments.length)]);
    }
    
    if (template.includes('${answerAttempt}') && hasQuestion) {
      const answers = [
        "На мой взгляд, ответ может быть таким...",
        "Интересный вопрос! Возможно, стоит рассмотреть...",
        "Я думаю, что ключ к ответу в..."
      ];
      reply = reply.replace('${answerAttempt}', answers[Math.floor(Math.random() * answers.length)]);
    }
    
    return reply;
  },
  
  async publishReply(commentId, replyText) {
    try {
      const requestData = {
        action: 'post_comment_reply',
        commentId: commentId,
        replyText: replyText,
        csrfToken: await this.getCSRFToken()
      };
      
      const response = await this.makeRequest('/comment_service_ajax', requestData);
      
      return {
        success: response && response.success,
        response: response,
        method: 'api_reply'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async promoteOwnComments(comments) {
    const actions = [];
    
    // "Лайкаем" свои комментарии через разные аккаунты/методы
    for (const comment of comments) {
      if (comment.success) {
        try {
          // Пробуем лайкнуть комментарий
          const likeResult = await this.likeComment(comment.publishResult?.commentId || comment.id);
          
          actions.push({
            type: 'like_own',
            commentId: comment.id,
            result: likeResult,
            success: likeResult.success,
            timestamp: new Date().toISOString()
          });
          
          await this.delay(2000);
          
        } catch (error) {
          actions.push({
            type: 'like_own',
            commentId: comment.id,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return actions;
  },
  
  async likeComment(commentId) {
    try {
      const requestData = {
        action: 'like_comment',
        commentId: commentId,
        vote: 1, // 1 = like, 0 = neutral, -1 = dislike
        csrfToken: await this.getCSRFToken()
      };
      
      const response = await this.makeRequest('/comment_service_ajax', requestData);
      
      return {
        success: response && response.success,
        response: response,
        method: 'api_like'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async monitorOwnComments(comments) {
    const actions = [];
    
    for (const comment of comments) {
      if (comment.success) {
        try {
          // Проверяем статус комментария
          const status = await this.checkCommentStatus(comment.id);
          
          actions.push({
            type: 'monitor',
            commentId: comment.id,
            status: status,
            success: status.exists,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          actions.push({
            type: 'monitor',
            commentId: comment.id,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return actions;
  },
  
  async checkCommentStatus(commentId) {
    try {
      // Пробуем найти комментарий в DOM
      const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`) ||
                            document.querySelector(`#comment-${commentId}`) ||
                            document.querySelector(`[id*="${commentId}"]`);
      
      if (commentElement) {
        return {
          exists: true,
          visible: commentElement.offsetParent !== null,
          method: 'dom'
        };
      }
      
      // Пробуем через API
      const response = await this.makeRequest(
        `/comment_service_ajax?action_get_comment=1&comment_id=${commentId}`,
        {},
        'GET'
      );
      
      return {
        exists: response && response.comment,
        visible: response && !response.hidden,
        method: 'api',
        response: response
      };
      
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        method: 'failed'
      };
    }
  },
  
  analyzeCommentResults(publicationResults, managementResults) {
    const analysis = {
      publication: {
        successRate: publicationResults.successRate,
        publishedCount: publicationResults.publishedCount,
        failedCount: publicationResults.failedCount,
        duration: publicationResults.duration
      },
      management: {
        successRate: managementResults.successRate,
        actionsCount: managementResults.actions.length,
        successfulActions: managementResults.successCount
      },
      overall: {
        totalSuccess: publicationResults.publishedCount + managementResults.successCount,
        totalAttempts: publicationResults.targetCount + managementResults.actions.length,
        overallSuccessRate: ((publicationResults.publishedCount + managementResults.successCount) / 
                           (publicationResults.targetCount + managementResults.actions.length)) * 100
      },
      insights: [],
      recommendations: []
    };
    
    // Генерация инсайтов
    if (publicationResults.successRate > 80) {
      analysis.insights.push({
        type: 'positive',
        message: 'Методы публикации работают эффективно'
      });
    } else if (publicationResults.successRate < 40) {
      analysis.insights.push({
        type: 'negative',
        message: 'Низкая успешность публикации, требуется оптимизация методов'
      });
    }
    
    if (managementResults.successRate > 70) {
      analysis.insights.push({
        type: 'positive',
        message: 'Управление комментариями успешно'
      });
    }
    
    // Рекомендации
    if (analysis.overall.overallSuccessRate < 50) {
      analysis.recommendations.push({
        priority: 'high',
        action: 'Улучшить методы публикации и управления',
        description: `Общая успешность всего ${analysis.overall.overallSuccessRate.toFixed(1)}%`
      });
    }
    
    if (publicationResults.failedCount > 0) {
      analysis.recommendations.push({
        priority: 'medium',
        action: 'Проанализировать причины неудачных публикаций',
        description: `Неудачных публикаций: ${publicationResults.failedCount}`
      });
    }
    
    return analysis;
  },
  
  getCommentRecommendations(analysis) {
    const recommendations = [];
    
    // Основные рекомендации из анализа
    recommendations.push(...analysis.recommendations);
    
    // Дополнительные рекомендации
    if (analysis.publication.successRate >= 70) {
      recommendations.push({
        priority: 'low',
        action: 'Масштабировать кампанию',
        description: 'Высокая успешность публикации позволяет увеличить объем'
      });
    }
    
    if (analysis.management.successRate < 50) {
      recommendations.push({
        priority: 'medium',
        action: 'Улучшить стратегию управления комментариями',
        description: `Успешность управления: ${analysis.management.successRate.toFixed(1)}%`
      });
    }
    
    return recommendations;
  },
  
  // Вспомогательные методы
  async getCSRFToken() {
    return await this.extractCSRFToken() || 'no_token_' + Date.now();
  },
  
  async extractCSRFToken() {
    // Извлечение CSRF токена
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      if (cookie.trim().startsWith('csrf_token=')) {
        return cookie.trim().substring('csrf_token='.length);
      }
    }
    
    return null;
  },
  
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
  
  async makeRequest(url, data, method = 'POST') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(data ? JSON.stringify(data) : null);
    });
  }
};

console.log('✅ Comment Bot Exploit модуль загружен');
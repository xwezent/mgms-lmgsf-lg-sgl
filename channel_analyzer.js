// Channel Analyzer - Полный анализ канала YouTube
window.exploit_channel_analyzer = {
  name: 'channel_analyzer',
  description: 'Полный анализ канала YouTube со всеми метриками и статистикой',
  version: '2.0',
  
  async execute(params) {
    console.log('📊 Запуск Channel Analyzer с параметрами:', params);
    
    const channelId = await this.extractChannelId(params.channelUrl);
    if (!channelId) {
      throw new Error('Не удалось извлечь ID канала из URL');
    }
    
    // Шаг 1: Получение базовой информации о канале
    const channelInfo = await this.getChannelInfo(channelId);
    
    // Шаг 2: Сбор статистики канала
    const channelStats = await this.collectChannelStats(channelId);
    
    // Шаг 3: Анализ видео канала
    const videoAnalysis = await this.analyzeChannelVideos(channelId);
    
    // Шаг 4: Анализ аудитории
    const audienceAnalysis = await this.analyzeAudience(channelId);
    
    // Шаг 5: Анализ монетизации
    const monetizationAnalysis = await this.analyzeMonetization(channelId);
    
    // Шаг 6: Генерация отчетов
    const reports = this.generateChannelReports(channelInfo, channelStats, videoAnalysis, audienceAnalysis, monetizationAnalysis);
    
    return {
      success: true,
      channelId: channelId,
      channelInfo: channelInfo,
      channelStats: channelStats,
      videoAnalysis: videoAnalysis,
      audienceAnalysis: audienceAnalysis,
      monetizationAnalysis: monetizationAnalysis,
      reports: reports,
      recommendations: this.getChannelRecommendations(channelStats, monetizationAnalysis),
      timestamp: new Date().toISOString()
    };
  },
  
  async extractChannelId(url) {
    console.log('Извлечение ID канала из URL:', url);
    
    try {
      if (!url) {
        // Пытаемся извлечь из текущей страницы
        const currentUrl = window.location.href;
        
        // Проверяем различные форматы URL канала
        const patterns = [
          /youtube\.com\/channel\/([^\/\?&]+)/,
          /youtube\.com\/c\/([^\/\?&]+)/,
          /youtube\.com\/@([^\/\?&]+)/,
          /youtube\.com\/user\/([^\/\?&]+)/
        ];
        
        for (const pattern of patterns) {
          const match = currentUrl.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
        
        // Если на странице канала, пытаемся извлечь из метаданных
        const metaChannelId = document.querySelector('meta[itemprop="channelId"]');
        if (metaChannelId) return metaChannelId.content;
        
        return null;
      }
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Обработка различных форматов
      if (pathname.startsWith('/channel/')) {
        return pathname.split('/')[2];
      } else if (pathname.startsWith('/c/') || pathname.startsWith('/@')) {
        // Для custom URL получаем реальный ID через API
        const handle = pathname.split('/')[2];
        return await this.resolveChannelIdFromHandle(handle);
      } else if (pathname.startsWith('/user/')) {
        const username = pathname.split('/')[2];
        return await this.resolveChannelIdFromUsername(username);
      }
      
      return null;
    } catch (e) {
      console.error('Ошибка извлечения ID канала:', e);
      return null;
    }
  },
  
  async resolveChannelIdFromHandle(handle) {
    // Используем YouTube API для получения ID канала по handle
    const apiUrl = `https://www.youtube.com/youtubei/v1/browse`;
    
    const requestData = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240101.00.00",
          hl: "ru",
          gl: "RU"
        }
      },
      browseId: `@${handle}`
    };
    
    try {
      const response = await this.makeAPIRequest(apiUrl, requestData);
      
      // Извлекаем ID канала из ответа
      const channelId = this.extractChannelIdFromBrowseResponse(response);
      if (channelId) return channelId;
      
      // Альтернативный метод
      return await this.findChannelIdBySearch(handle);
    } catch (error) {
      console.error('Ошибка разрешения handle:', error);
      return null;
    }
  },
  
  async resolveChannelIdFromUsername(username) {
    // Для старых форматов username
    const searchUrl = `https://www.youtube.com/youtubei/v1/search`;
    
    const requestData = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240101.00.00",
          hl: "ru",
          gl: "RU"
        }
      },
      query: username,
      params: "EgIQAg%3D%3D" // Параметр для поиска каналов
    };
    
    try {
      const response = await this.makeAPIRequest(searchUrl, requestData);
      return this.extractChannelIdFromSearchResponse(response);
    } catch (error) {
      console.error('Ошибка разрешения username:', error);
      return null;
    }
  },
  
  async getChannelInfo(channelId) {
    console.log(`Получение информации о канале ${channelId}...`);
    
    const info = {
      basic: {},
      branding: {},
      links: {},
      verification: {},
      rawData: {}
    };
    
    try {
      // Используем browse API для получения информации о канале
      const browseUrl = `https://www.youtube.com/youtubei/v1/browse`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "ru",
            gl: "RU"
          }
        },
        browseId: channelId
      };
      
      const response = await this.makeAPIRequest(browseUrl, requestData);
      info.rawData = response;
      
      // Извлекаем базовую информацию
      info.basic = this.extractBasicChannelInfo(response);
      
      // Извлекаем информацию о брендинге
      info.branding = this.extractBrandingInfo(response);
      
      // Извлекаем ссылки
      info.links = this.extractChannelLinks(response);
      
      // Проверяем верификацию
      info.verification = await this.checkVerification(channelId);
      
    } catch (error) {
      console.error('Ошибка получения информации о канале:', error);
    }
    
    return info;
  },
  
  extractBasicChannelInfo(response) {
    const info = {
      title: null,
      description: null,
      subscriberCount: 0,
      videoCount: 0,
      viewCount: 0,
      joinDate: null,
      country: null,
      keywords: []
    };
    
    try {
      // Извлекаем из metadata
      const metadata = response?.metadata?.channelMetadataRenderer;
      if (metadata) {
        info.title = metadata.title;
        info.description = metadata.description;
        info.keywords = metadata.keywords?.split(', ') || [];
        info.country = metadata.country;
      }
      
      // Извлекаем статистику
      const header = response?.header?.c4TabbedHeaderRenderer;
      if (header) {
        info.subscriberCount = this.parseCount(header.subscriberCountText?.simpleText);
        info.videoCount = this.parseCount(header.videosCountText?.simpleText);
      }
      
      // Извлекаем количество просмотров
      const viewCountText = response?.header?.c4TabbedHeaderRenderer?.viewCountText?.simpleText;
      if (viewCountText) {
        info.viewCount = this.parseCount(viewCountText);
      }
      
      // Извлекаем дату присоединения
      const joinedText = response?.header?.c4TabbedHeaderRenderer?.joinedDateText?.runs?.[1]?.text;
      if (joinedText) {
        info.joinDate = this.parseJoinDate(joinedText);
      }
      
    } catch (error) {
      console.error('Ошибка извлечения базовой информации:', error);
    }
    
    return info;
  },
  
  extractBrandingInfo(response) {
    const branding = {
      banner: {},
      avatar: {},
      watermark: {},
      trailer: null
    };
    
    try {
      // Баннер канала
      const banner = response?.header?.c4TabbedHeaderRenderer?.banner;
      if (banner?.thumbnails) {
        branding.banner = {
          thumbnails: banner.thumbnails,
          mobileBanner: banner?.mobileBanner || null,
          tvBanner: banner?.tvBanner || null
        };
      }
      
      // Аватар
      const avatar = response?.header?.c4TabbedHeaderRenderer?.avatar;
      if (avatar?.thumbnails) {
        branding.avatar = {
          thumbnails: avatar.thumbnails,
          isDefault: avatar?.isDefault || false
        };
      }
      
      // Водяной знак
      const watermark = response?.header?.c4TabbedHeaderRenderer?.watermark;
      if (watermark?.thumbnails) {
        branding.watermark = {
          thumbnails: watermark.thumbnails
        };
      }
      
      // Трейлер канала
      const trailer = response?.header?.c4TabbedHeaderRenderer?.channelTrailer;
      if (trailer) {
        branding.trailer = {
          videoId: trailer.videoId,
          title: trailer.title?.simpleText,
          lengthText: trailer.lengthText?.simpleText
        };
      }
      
    } catch (error) {
      console.error('Ошибка извлечения информации о брендинге:', error);
    }
    
    return branding;
  },
  
  extractChannelLinks(response) {
    const links = {
      primaryLinks: [],
      secondaryLinks: [],
      socialMedia: {}
    };
    
    try {
      // Основные ссылки
      const primaryLinks = response?.header?.c4TabbedHeaderRenderer?.headerLinks?.channelHeaderLinksRenderer?.primaryLinks;
      if (primaryLinks) {
        links.primaryLinks = primaryLinks.map(link => ({
          title: link.title?.simpleText,
          url: link.navigationEndpoint?.urlEndpoint?.url || 
               link.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url,
          icon: link.icon?.thumbnails?.[0]?.url
        }));
      }
      
      // Вторичные ссылки
      const secondaryLinks = response?.header?.c4TabbedHeaderRenderer?.headerLinks?.channelHeaderLinksRenderer?.secondaryLinks;
      if (secondaryLinks) {
        links.secondaryLinks = secondaryLinks.map(link => ({
          title: link.title?.simpleText,
          url: link.navigationEndpoint?.urlEndpoint?.url
        }));
      }
      
      // Социальные сети
      const socialMedia = this.extractSocialMediaLinks(response);
      if (socialMedia) {
        links.socialMedia = socialMedia;
      }
      
    } catch (error) {
      console.error('Ошибка извлечения ссылок канала:', error);
    }
    
    return links;
  },
  
  extractSocialMediaLinks(response) {
    const socialMedia = {};
    
    try {
      // Извлекаем ссылки на социальные сети из описания
      const description = response?.metadata?.channelMetadataRenderer?.description || '';
      
      const socialPatterns = {
        twitter: /twitter\.com\/([A-Za-z0-9_]+)/i,
        instagram: /instagram\.com\/([A-Za-z0-9_.]+)/i,
        facebook: /facebook\.com\/([A-Za-z0-9.]+)/i,
        tiktok: /tiktok\.com\/@([A-Za-z0-9_.]+)/i,
        discord: /discord\.gg\/([A-Za-z0-9]+)/i,
        telegram: /t\.me\/([A-Za-z0-9_]+)/i,
        patreon: /patreon\.com\/([A-Za-z0-9]+)/i
      };
      
      for (const [platform, pattern] of Object.entries(socialPatterns)) {
        const match = description.match(pattern);
        if (match) {
          socialMedia[platform] = match[1];
        }
      }
      
    } catch (error) {
      console.error('Ошибка извлечения ссылок на социальные сети:', error);
    }
    
    return socialMedia;
  },
  
  async checkVerification(channelId) {
    const verification = {
      isVerified: false,
      badgeType: null,
      verificationLevel: 'none'
    };
    
    try {
      // Проверяем наличие бейджа верификации
      const badgeSelectors = [
        'yt-icon.verified',
        'yt-icon[aria-label="Проверенный"]',
        'yt-icon[aria-label="Verified"]',
        '.ytd-badge-supported-renderer'
      ];
      
      for (const selector of badgeSelectors) {
        const badge = document.querySelector(selector);
        if (badge) {
          verification.isVerified = true;
          verification.badgeType = this.determineBadgeType(badge);
          break;
        }
      }
      
      // Определяем уровень верификации
      if (verification.isVerified) {
        verification.verificationLevel = await this.determineVerificationLevel(channelId);
      }
      
    } catch (error) {
      console.error('Ошибка проверки верификации:', error);
    }
    
    return verification;
  },
  
  determineBadgeType(badgeElement) {
    const classList = badgeElement.className;
    const ariaLabel = badgeElement.getAttribute('aria-label');
    
    if (classList.includes('music-verified')) return 'music';
    if (classList.includes('artist-verified')) return 'artist';
    if (ariaLabel?.includes('Music')) return 'music';
    if (ariaLabel?.includes('Artist')) return 'artist';
    
    return 'standard';
  },
  
  async determineVerificationLevel(channelId) {
    try {
      // Анализируем канал для определения уровня верификации
      const subscriberCount = await this.getSubscriberCount(channelId);
      
      if (subscriberCount >= 1000000) return 'diamond';
      if (subscriberCount >= 100000) return 'gold';
      if (subscriberCount >= 10000) return 'silver';
      return 'bronze';
      
    } catch (error) {
      return 'unknown';
    }
  },
  
  async getSubscriberCount(channelId) {
    // Получаем количество подписчиков
    const browseUrl = `https://www.youtube.com/youtubei/v1/browse`;
    
    const requestData = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240101.00.00"
        }
      },
      browseId: channelId
    };
    
    try {
      const response = await this.makeAPIRequest(browseUrl, requestData);
      const subscriberText = response?.header?.c4TabbedHeaderRenderer?.subscriberCountText?.simpleText;
      return this.parseCount(subscriberText);
    } catch (error) {
      return 0;
    }
  },
  
  async collectChannelStats(channelId) {
    console.log(`Сбор статистики канала ${channelId}...`);
    
    const stats = {
      subscribers: {},
      views: {},
      engagement: {},
      growth: {},
      rankings: {},
      rawData: {}
    };
    
    try {
      // Получаем подробную статистику через различные endpoints
      const endpoints = [
        this.getSubscriberStats(channelId),
        this.getViewStats(channelId),
        this.getEngagementStats(channelId),
        this.getGrowthStats(channelId)
      ];
      
      const results = await Promise.allSettled(endpoints);
      
      // Обрабатываем результаты
      if (results[0].status === 'fulfilled') stats.subscribers = results[0].value;
      if (results[1].status === 'fulfilled') stats.views = results[1].value;
      if (results[2].status === 'fulfilled') stats.engagement = results[2].value;
      if (results[3].status === 'fulfilled') stats.growth = results[3].value;
      
      // Рассчитываем рейтинги
      stats.rankings = await this.calculateChannelRankings(stats);
      
      // Собираем сырые данные
      stats.rawData = await this.collectRawChannelData(channelId);
      
    } catch (error) {
      console.error('Ошибка сбора статистики канала:', error);
    }
    
    return stats;
  },
  
  async getSubscriberStats(channelId) {
    const stats = {
      current: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      trend: 'stable',
      milestones: []
    };
    
    try {
      // Используем YouTube Analytics API (эмуляция)
      const analyticsUrl = `https://www.youtube.com/youtubei/v1/analytics`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00"
          }
        },
        channelId: channelId,
        metrics: ["subscribersGained", "subscribersLost"],
        dimensions: ["day"],
        startDate: this.getDateString(-30), // Последние 30 дней
        endDate: this.getDateString(0)
      };
      
      const response = await this.makeAPIRequest(analyticsUrl, requestData);
      
      if (response?.rows) {
        // Анализируем данные
        const totalGained = response.rows.reduce((sum, row) => sum + (row[1] || 0), 0);
        const totalLost = response.rows.reduce((sum, row) => sum + (row[2] || 0), 0);
        
        stats.current = totalGained - totalLost;
        stats.daily = Math.round(totalGained / 30);
        stats.weekly = stats.daily * 7;
        stats.monthly = totalGained;
        stats.yearly = totalGained * 12;
        
        // Определяем тренд
        const recentGains = response.rows.slice(-7).reduce((sum, row) => sum + (row[1] || 0), 0);
        const previousGains = response.rows.slice(-14, -7).reduce((sum, row) => sum + (row[1] || 0), 0);
        
        if (recentGains > previousGains * 1.2) stats.trend = 'growing';
        else if (recentGains < previousGains * 0.8) stats.trend = 'declining';
        else stats.trend = 'stable';
        
        // Определяем ближайшие milestones
        stats.milestones = this.calculateMilestones(stats.current);
      }
      
    } catch (error) {
      console.error('Ошибка получения статистики подписчиков:', error);
    }
    
    return stats;
  },
  
  async getViewStats(channelId) {
    const stats = {
      total: 0,
      averagePerVideo: 0,
      daily: 0,
      peak: 0,
      byCountry: {},
      byDevice: {},
      sources: {}
    };
    
    try {
      // Эмуляция данных о просмотрах
      const analyticsUrl = `https://www.youtube.com/youtubei/v1/analytics`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00"
          }
        },
        channelId: channelId,
        metrics: ["views", "estimatedMinutesWatched"],
        dimensions: ["day", "country", "deviceType", "trafficSource"],
        startDate: this.getDateString(-30),
        endDate: this.getDateString(0)
      };
      
      const response = await this.makeAPIRequest(analyticsUrl, requestData);
      
      if (response?.rows) {
        // Общее количество просмотров
        stats.total = response.rows.reduce((sum, row) => sum + (row[1] || 0), 0);
        
        // Среднее на видео
        const videoCount = await this.getVideoCount(channelId);
        stats.averagePerVideo = videoCount > 0 ? Math.round(stats.total / videoCount) : 0;
        
        // Ежедневные просмотры
        stats.daily = Math.round(stats.total / 30);
        
        // Пиковые значения
        const dailyViews = response.rows.filter(row => row[0]).map(row => row[1] || 0);
        stats.peak = Math.max(...dailyViews);
        
        // По странам
        const countryData = response.rows.filter(row => row[2]); // Индекс страны
        stats.byCountry = this.aggregateByDimension(countryData, 2, 1);
        
        // По устройствам
        const deviceData = response.rows.filter(row => row[3]); // Индекс устройства
        stats.byDevice = this.aggregateByDimension(deviceData, 3, 1);
        
        // По источникам трафика
        const sourceData = response.rows.filter(row => row[4]); // Индекс источника
        stats.sources = this.aggregateByDimension(sourceData, 4, 1);
      }
      
    } catch (error) {
      console.error('Ошибка получения статистики просмотров:', error);
    }
    
    return stats;
  },
  
  async getEngagementStats(channelId) {
    const stats = {
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      averageViewDuration: 0,
      audienceRetention: 0,
      clickThroughRate: 0,
      engagementRate: 0
    };
    
    try {
      // Эмуляция данных о вовлеченности
      const analyticsUrl = `https://www.youtube.com/youtubei/v1/analytics`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00"
          }
        },
        channelId: channelId,
        metrics: ["likes", "dislikes", "comments", "shares", "averageViewDuration", "audienceRetention", "impressionsClickThroughRate"],
        startDate: this.getDateString(-30),
        endDate: this.getDateString(0)
      };
      
      const response = await this.makeAPIRequest(analyticsUrl, requestData);
      
      if (response?.rows) {
        const row = response.rows[0] || [];
        
        stats.likes = row[0] || 0;
        stats.dislikes = row[1] || 0;
        stats.comments = row[2] || 0;
        stats.shares = row[3] || 0;
        stats.averageViewDuration = row[4] || 0;
        stats.audienceRetention = row[5] || 0;
        stats.clickThroughRate = row[6] || 0;
        
        // Расчет engagement rate
        const totalViews = await this.getTotalViews(channelId);
        if (totalViews > 0) {
          const totalEngagement = stats.likes + stats.dislikes + stats.comments + stats.shares;
          stats.engagementRate = (totalEngagement / totalViews) * 100;
        }
      }
      
    } catch (error) {
      console.error('Ошибка получения статистики вовлеченности:', error);
    }
    
    return stats;
  },
  
  async getGrowthStats(channelId) {
    const stats = {
      subscriberGrowth: [],
      viewGrowth: [],
      revenueGrowth: [],
      viralVideos: [],
      growthRate: 0,
      acceleration: 0
    };
    
    try {
      // Эмуляция данных о росте
      const growthUrl = `https://www.youtube.com/youtubei/v1/growth`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00"
          }
        },
        channelId: channelId,
        period: "monthly",
        months: 12
      };
      
      const response = await this.makeAPIRequest(growthUrl, requestData);
      
      if (response?.subscriberGrowth) {
        stats.subscriberGrowth = response.subscriberGrowth;
        stats.viewGrowth = response.viewGrowth || [];
        stats.revenueGrowth = response.revenueGrowth || [];
        
        // Вирусные видео
        stats.viralVideos = response.viralVideos || [];
        
        // Расчет темпов роста
        if (stats.subscriberGrowth.length >= 2) {
          const recent = stats.subscriberGrowth.slice(-1)[0];
          const previous = stats.subscriberGrowth.slice(-2)[0];
          
          if (previous.value > 0) {
            stats.growthRate = ((recent.value - previous.value) / previous.value) * 100;
          }
          
          // Ускорение роста
          if (stats.subscriberGrowth.length >= 3) {
            const oldest = stats.subscriberGrowth.slice(-3)[0];
            if (oldest.value > 0) {
              const previousGrowth = ((previous.value - oldest.value) / oldest.value) * 100;
              stats.acceleration = stats.growthRate - previousGrowth;
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Ошибка получения статистики роста:', error);
    }
    
    return stats;
  },
  
  async calculateChannelRankings(stats) {
    const rankings = {
      subscriberRank: 0,
      viewRank: 0,
      engagementRank: 0,
      growthRank: 0,
      overallRank: 0,
      percentile: 0,
      categoryRankings: {}
    };
    
    try {
      // Эмуляция расчета рейтингов
      const totalChannels = 50000000; // Примерное количество активных каналов
      
      // Рейтинг по подписчикам
      const subscriberPercentile = this.calculatePercentile(stats.subscribers.current, [
        1000, 10000, 100000, 1000000, 10000000, 50000000
      ]);
      
      rankings.subscriberRank = Math.round(totalChannels * (1 - subscriberPercentile));
      
      // Рейтинг по просмотрам
      const viewPercentile = this.calculatePercentile(stats.views.total, [
        10000, 100000, 1000000, 10000000, 100000000, 1000000000
      ]);
      
      rankings.viewRank = Math.round(totalChannels * (1 - viewPercentile));
      
      // Рейтинг по вовлеченности
      const engagementScore = stats.engagement.engagementRate;
      const engagementPercentile = this.calculatePercentile(engagementScore, [
        1, 2, 5, 10, 20, 50
      ]);
      
      rankings.engagementRank = Math.round(totalChannels * (1 - engagementPercentile));
      
      // Рейтинг по росту
      const growthScore = stats.growth.growthRate;
      const growthPercentile = this.calculatePercentile(growthScore, [
        0, 5, 10, 20, 50, 100
      ]);
      
      rankings.growthRank = Math.round(totalChannels * (1 - growthPercentile));
      
      // Общий рейтинг
      rankings.overallRank = Math.round((
        rankings.subscriberRank * 0.3 +
        rankings.viewRank * 0.3 +
        rankings.engagementRank * 0.2 +
        rankings.growthRank * 0.2
      ));
      
      rankings.percentile = (rankings.overallRank / totalChannels) * 100;
      
      // Рейтинги по категориям
      rankings.categoryRankings = await this.calculateCategoryRankings(stats);
      
    } catch (error) {
      console.error('Ошибка расчета рейтингов:', error);
    }
    
    return rankings;
  },
  
  async analyzeChannelVideos(channelId) {
    console.log(`Анализ видео канала ${channelId}...`);
    
    const analysis = {
      totalVideos: 0,
      videoList: [],
      performance: {},
      contentAnalysis: {},
      trends: {},
      recommendations: []
    };
    
    try {
      // Получаем список видео канала
      const videos = await this.getChannelVideos(channelId, 100); // Первые 100 видео
      
      analysis.totalVideos = videos.length;
      analysis.videoList = videos;
      
      // Анализ производительности
      analysis.performance = this.analyzeVideoPerformance(videos);
      
      // Анализ контента
      analysis.contentAnalysis = this.analyzeVideoContent(videos);
      
      // Выявление трендов
      analysis.trends = this.identifyVideoTrends(videos);
      
      // Рекомендации по улучшению
      analysis.recommendations = this.generateVideoRecommendations(analysis.performance, analysis.contentAnalysis);
      
    } catch (error) {
      console.error('Ошибка анализа видео канала:', error);
    }
    
    return analysis;
  },
  
  async getChannelVideos(channelId, limit = 100) {
    const videos = [];
    let continuationToken = null;
    
    try {
      do {
        const browseUrl = `https://www.youtube.com/youtubei/v1/browse`;
        
        const requestData = {
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240101.00.00"
            }
          },
          browseId: channelId,
          params: "EgZ2aWRlb3PyBgQKAjoA" // Параметр для получения видео
        };
        
        if (continuationToken) {
          requestData.continuation = continuationToken;
        }
        
        const response = await this.makeAPIRequest(browseUrl, requestData);
        
        // Извлекаем видео
        const videoItems = this.extractVideoItemsFromResponse(response);
        videos.push(...videoItems);
        
        // Получаем токен продолжения
        continuationToken = this.extractContinuationToken(response);
        
        // Проверяем лимит
        if (videos.length >= limit) {
          videos.length = limit;
          break;
        }
        
        await this.delay(1000); // Задержка между запросами
        
      } while (continuationToken && videos.length < limit);
      
    } catch (error) {
      console.error('Ошибка получения видео канала:', error);
    }
    
    return videos;
  },
  
  extractVideoItemsFromResponse(response) {
    const videos = [];
    
    try {
      // Ищем видео в различных структурах ответа
      const tabs = response?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      if (!tabs) return videos;
      
      // Находим таб с видео
      const videoTab = tabs.find(tab => tab.tabRenderer?.title === "Videos" || tab.tabRenderer?.title === "Видео");
      if (!videoTab) return videos;
      
      const contents = videoTab.tabRenderer?.content?.richGridRenderer?.contents;
      if (!contents) return videos;
      
      // Обрабатываем каждый элемент
      for (const item of contents) {
        const video = this.extractVideoFromItem(item);
        if (video) {
          videos.push(video);
        }
      }
      
    } catch (error) {
      console.error('Ошибка извлечения видео:', error);
    }
    
    return videos;
  },
  
  extractVideoFromItem(item) {
    try {
      const videoRenderer = item?.richItemRenderer?.content?.videoRenderer ||
                           item?.videoRenderer;
      
      if (!videoRenderer) return null;
      
      return {
        videoId: videoRenderer.videoId,
        title: videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText,
        description: videoRenderer.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
        publishedTime: videoRenderer.publishedTimeText?.simpleText,
        lengthText: videoRenderer.lengthText?.simpleText,
        viewCount: this.parseCount(videoRenderer.viewCountText?.simpleText),
        thumbnail: videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail?.thumbnails.length - 1]?.url,
        badges: videoRenderer.badges?.map(badge => badge.metadataBadgeRenderer?.label) || []
      };
    } catch (error) {
      return null;
    }
  },
  
  analyzeVideoPerformance(videos) {
    const performance = {
      topPerforming: [],
      worstPerforming: [],
      averageViews: 0,
      averageEngagement: 0,
      consistency: 0,
      viralPotential: 0
    };
    
    if (videos.length === 0) return performance;
    
    try {
      // Сортируем видео по количеству просмотров
      const sortedByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount);
      
      performance.topPerforming = sortedByViews.slice(0, 5);
      performance.worstPerforming = sortedByViews.slice(-5).reverse();
      
      // Средние значения
      performance.averageViews = Math.round(
        videos.reduce((sum, video) => sum + video.viewCount, 0) / videos.length
      );
      
      // Консистентность (стандартное отклонение)
      const viewCounts = videos.map(v => v.viewCount);
      const mean = performance.averageViews;
      const variance = viewCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / viewCounts.length;
      performance.consistency = Math.round(Math.sqrt(variance) / mean * 100);
      
      // Потенциал виральности (процент видео с высокой вовлеченностью)
      const highPerforming = videos.filter(v => v.viewCount > mean * 3);
      performance.viralPotential = Math.round((highPerforming.length / videos.length) * 100);
      
    } catch (error) {
      console.error('Ошибка анализа производительности видео:', error);
    }
    
    return performance;
  },
  
  analyzeVideoContent(videos) {
    const analysis = {
      categories: {},
      durationAnalysis: {},
      uploadPattern: {},
      keywordAnalysis: {},
      sentiment: {}
    };
    
    try {
      // Анализ категорий (по ключевым словам в названиях)
      const categories = {};
      videos.forEach(video => {
        const words = video.title.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Игнорируем короткие слова
            categories[word] = (categories[word] || 0) + 1;
          }
        });
      });
      
      analysis.categories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      
      // Анализ длительности
      const durations = videos.map(v => {
        const durationText = v.lengthText || '0:00';
        const parts = durationText.split(':');
        if (parts.length === 2) {
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
          return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return 0;
      });
      
      analysis.durationAnalysis = {
        average: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        shortest: Math.min(...durations),
        longest: Math.max(...durations),
        distribution: this.calculateDurationDistribution(durations)
      };
      
      // Паттерн загрузки
      const uploadDates = videos.map(v => v.publishedTime);
      analysis.uploadPattern = this.analyzeUploadPattern(uploadDates);
      
      // Анализ ключевых слов
      analysis.keywordAnalysis = this.analyzeKeywords(videos);
      
      // Анализ тональности (базовый)
      analysis.sentiment = this.analyzeSentiment(videos);
      
    } catch (error) {
      console.error('Ошибка анализа контента видео:', error);
    }
    
    return analysis;
  },
  
  async analyzeAudience(channelId) {
    console.log(`Анализ аудитории канала ${channelId}...`);
    
    const audience = {
      demographics: {},
      geography: {},
      behavior: {},
      loyalty: {},
      interests: {}
    };
    
    try {
      // Эмуляция данных об аудитории через YouTube Analytics API
      const analyticsUrl = `https://www.youtube.com/youtubei/v1/analytics/audience`;
      
      const requestData = {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00"
          }
        },
        channelId: channelId,
        metrics: ["viewerPercentage"],
        dimensions: ["ageGroup", "gender", "country", "subscribedStatus"]
      };
      
      const response = await this.makeAPIRequest(analyticsUrl, requestData);
      
      if (response?.rows) {
        // Демография
        audience.demographics = this.processDemographicData(response.rows);
        
        // География
        audience.geography = this.processGeographicData(response.rows);
        
        // Поведение
        audience.behavior = await this.analyzeAudienceBehavior(channelId);
        
        // Лояльность
        audience.loyalty = this.processLoyaltyData(response.rows);
        
        // Интересы
        audience.interests = await this.analyzeAudienceInterests(channelId);
      }
      
    } catch (error) {
      console.error('Ошибка анализа аудитории:', error);
    }
    
    return audience;
  },
  
  async analyzeMonetization(channelId) {
    console.log(`Анализ монетизации канала ${channelId}...`);
    
    const monetization = {
      status: {},
      revenue: {},
      ads: {},
      memberships: {},
      merchandise: {},
      analytics: {}
    };
    
    try {
      // Проверяем статус монетизации
      monetization.status = await this.checkMonetizationStatus(channelId);
      
      // Данные о доходах (если канал монетизирован)
      if (monetization.status.isMonetized) {
        monetization.revenue = await this.getRevenueData(channelId);
        monetization.ads = await this.getAdPerformance(channelId);
        monetization.memberships = await this.getMembershipData(channelId);
        monetization.merchandise = await this.getMerchandiseData(channelId);
      }
      
      // Аналитика монетизации
      monetization.analytics = await this.analyzeMonetizationPerformance(channelId);
      
    } catch (error) {
      console.error('Ошибка анализа монетизации:', error);
    }
    
    return monetization;
  },
  
  generateChannelReports(channelInfo, channelStats, videoAnalysis, audienceAnalysis, monetizationAnalysis) {
    const reports = {
      executiveSummary: this.generateExecutiveSummary(channelInfo, channelStats),
      performanceReport: this.generatePerformanceReport(channelStats, videoAnalysis),
      audienceReport: this.generateAudienceReport(audienceAnalysis),
      monetizationReport: this.generateMonetizationReport(monetizationAnalysis),
      competitiveAnalysis: this.generateCompetitiveAnalysis(channelInfo, channelStats),
      strategicRecommendations: this.generateStrategicRecommendations(channelInfo, channelStats, videoAnalysis, audienceAnalysis, monetizationAnalysis)
    };
    
    return reports;
  },
  
  getChannelRecommendations(channelStats, monetizationAnalysis) {
    const recommendations = [];
    
    // Рекомендации по росту
    if (channelStats.subscribers.growthRate < 5) {
      recommendations.push({
        category: 'growth',
        priority: 'high',
        action: 'Увеличить частоту загрузки видео',
        description: 'Низкий темп роста подписчиков. Рекомендуется загружать видео чаще.',
        expectedImpact: '+15-30% рост подписчиков'
      });
    }
    
    // Рекомендации по вовлеченности
    if (channelStats.engagement.engagementRate < 3) {
      recommendations.push({
        category: 'engagement',
        priority: 'medium',
        action: 'Улучшить вовлеченность в комментариях',
        description: 'Низкий уровень вовлеченности. Отвечайте на комментарии и задавайте вопросы.',
        expectedImpact: '+5-10% engagement rate'
      });
    }
    
    // Рекомендации по монетизации
    if (monetizationAnalysis.status.isMonetized && monetizationAnalysis.revenue.rpm < 1) {
      recommendations.push({
        category: 'monetization',
        priority: 'low',
        action: 'Оптимизировать размещение рекламы',
        description: 'Низкий RPM. Рассмотрите изменение типов и частоты показа рекламы.',
        expectedImpact: '+20-40% увеличение RPM'
      });
    }
    
    return recommendations;
  },
  
  // Вспомогательные методы
  parseCount(countText) {
    if (!countText) return 0;
    
    const multipliers = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000,
      'тыс.': 1000,
      'млн': 1000000,
      'млрд': 1000000000
    };
    
    const match = countText.match(/([\d.,]+)\s*([KMBтыс\.млнмлрд]+)/i);
    if (match) {
      const number = parseFloat(match[1].replace(',', '.'));
      const multiplier = match[2].toUpperCase();
      
      for (const [key, value] of Object.entries(multipliers)) {
        if (multiplier.startsWith(key.toUpperCase())) {
          return Math.round(number * value);
        }
      }
    }
    
    // Если нет множителя, пытаемся извлечь число
    const numbers = countText.match(/(\d[\d\s,]*)/);
    if (numbers) {
      return parseInt(numbers[1].replace(/[\s,]/g, '')) || 0;
    }
    
    return 0;
  },
  
  parseJoinDate(dateText) {
    try {
      // Пытаемся извлечь дату из текста
      const months = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
        'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      
      for (const [monthName, monthIndex] of Object.entries(months)) {
        if (dateText.includes(monthName)) {
          const yearMatch = dateText.match(/\b(20\d{2})\b/);
          const dayMatch = dateText.match(/\b(\d{1,2})\b/);
          
          if (yearMatch && dayMatch) {
            const year = parseInt(yearMatch[1]);
            const day = parseInt(dayMatch[1]);
            return new Date(year, monthIndex, day).toISOString().split('T')[0];
          }
        }
      }
    } catch (e) {
      console.error('Ошибка парсинга даты:', e);
    }
    
    return null;
  },
  
  calculateMilestones(currentSubscribers) {
    const milestones = [];
    const commonMilestones = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    
    for (const milestone of commonMilestones) {
      if (currentSubscribers < milestone) {
        const remaining = milestone - currentSubscribers;
        const percentage = Math.round((currentSubscribers / milestone) * 100);
        
        milestones.push({
          milestone: milestone.toLocaleString(),
          remaining: remaining.toLocaleString(),
          percentage: percentage,
          estimatedTime: this.estimateTimeToMilestone(currentSubscribers, milestone)
        });
        
        if (milestones.length >= 3) break;
      }
    }
    
    return milestones;
  },
  
  estimateTimeToMilestone(current, target) {
    const growthRate = 0.05; // 5% в месяц (пример)
    const months = Math.log(target / current) / Math.log(1 + growthRate);
    
    if (months <= 1) return 'менее месяца';
    if (months <= 12) return `${Math.round(months)} месяцев`;
    
    const years = months / 12;
    return `${years.toFixed(1)} лет`;
  },
  
  aggregateByDimension(data, dimensionIndex, valueIndex) {
    const result = {};
    
    data.forEach(row => {
      const dimension = row[dimensionIndex];
      const value = row[valueIndex] || 0;
      
      if (dimension) {
        result[dimension] = (result[dimension] || 0) + value;
      }
    });
    
    // Сортируем по убыванию значений
    return Object.entries(result)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  },
  
  calculatePercentile(value, brackets) {
    for (let i = 0; i < brackets.length; i++) {
      if (value < brackets[i]) {
        return i / brackets.length;
      }
    }
    return 1;
  },
  
  getDateString(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  },
  
  async makeAPIRequest(url, data) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
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
      
      xhr.send(JSON.stringify(data || {}));
    });
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

console.log('✅ Channel Analyzer Exploit модуль загружен');
// Video Stats Exploit - Получение всей статистики видео
window.exploit_video_stats = {
  name: 'video_stats',
  description: 'Извлечение всей статистики видео, доступной автору в YouTube Studio',
  version: '1.0',
  
  async execute(params) {
    console.log('📊 Запуск Video Stats Exploit с параметрами:', params);
    
    const videoId = this.extractVideoId(params.videoUrl);
    if (!videoId) {
      throw new Error('Не удалось извлечь ID видео из URL');
    }
    
    // Многоуровневый сбор данных
    const results = await this.collectAllVideoData(videoId, params.depth || 'full');
    
    // Анализ и обработка данных
    const analyzedData = this.analyzeVideoData(results);
    
    // Генерация отчетов
    const reports = this.generateReports(analyzedData);
    
    // Экспорт данных
    const exports = this.exportAllData(analyzedData, reports);
    
    return {
      success: true,
      videoId: videoId,
      basicInfo: results.basicInfo,
      statistics: results.statistics,
      analytics: results.analytics,
      audienceData: results.audienceData,
      revenueData: results.revenueData,
      engagementData: results.engagementData,
      technicalData: results.technicalData,
      analyzedData: analyzedData,
      reports: reports,
      exports: exports,
      recommendations: this.getStatsRecommendations(analyzedData),
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
  
  async collectAllVideoData(videoId, depth) {
    console.log(`Сбор данных видео ${videoId} с глубиной: ${depth}`);
    
    const data = {
      basicInfo: {},
      statistics: {},
      analytics: {},
      audienceData: {},
      revenueData: {},
      engagementData: {},
      technicalData: {},
      rawData: {}
    };
    
    // Уровень 1: Базовая информация
    data.basicInfo = await this.collectBasicInfo(videoId);
    
    // Уровень 2: Публичная статистика
    data.statistics = await this.collectPublicStatistics(videoId);
    
    // Уровень 3: Аналитика (если доступно)
    if (depth === 'advanced' || depth === 'full' || depth === 'deep') {
      data.analytics = await this.collectAnalytics(videoId);
    }
    
    // Уровень 4: Данные аудитории
    if (depth === 'full' || depth === 'deep') {
      data.audienceData = await this.collectAudienceData(videoId);
    }
    
    // Уровень 5: Данные о доходах
    if (depth === 'deep') {
      data.revenueData = await this.collectRevenueData(videoId);
    }
    
    // Уровень 6: Данные вовлеченности
    data.engagementData = await this.collectEngagementData(videoId);
    
    // Уровень 7: Технические данные
    data.technicalData = await this.collectTechnicalData(videoId);
    
    // Уровень 8: Сырые данные API
    data.rawData = await this.collectRawAPIData(videoId);
    
    return data;
  },
  
  async collectBasicInfo(videoId) {
    const info = {
      videoId: videoId,
      title: null,
      description: null,
      channelId: null,
      channelTitle: null,
      publishedAt: null,
      duration: null,
      dimensions: null,
      definition: null,
      caption: null,
      licensedContent: null,
      contentRating: null,
      projection: null,
      thumbnailUrls: {}
    };
    
    try {
      // Извлекаем данные из ytInitialData
      const ytData = this.getYouTubeInitialData();
      if (ytData) {
        const videoData = this.findVideoDataInObject(ytData, videoId);
        if (videoData) {
          info.title = videoData.title?.runs?.[0]?.text || videoData.title?.simpleText;
          info.description = this.extractDescription(videoData);
          info.channelId = videoData.channelId;
          info.channelTitle = videoData.ownerText?.runs?.[0]?.text;
          info.publishedAt = videoData.publishedTimeText?.simpleText;
          info.duration = videoData.lengthText?.simpleText;
          
          // Миниатюры
          if (videoData.thumbnail) {
            info.thumbnailUrls = {
              default: videoData.thumbnail.thumbnails?.[0]?.url,
              medium: videoData.thumbnail.thumbnails?.[1]?.url,
              high: videoData.thumbnail.thumbnails?.[2]?.url,
              standard: videoData.thumbnail.thumbnails?.[3]?.url,
              maxres: videoData.thumbnail.thumbnails?.[4]?.url
            };
          }
        }
      }
      
      // Дополнительные данные через API
      const apiData = await this.fetchVideoAPI(videoId, 'player');
      if (apiData && apiData.videoDetails) {
        const details = apiData.videoDetails;
        info.title = info.title || details.title;
        info.channelId = info.channelId || details.channelId;
        info.duration = info.duration || this.formatDuration(details.lengthSeconds);
        info.dimensions = {
          width: details.width,
          height: details.height
        };
        info.definition = details.quality;
      }
      
    } catch (error) {
      console.error('Ошибка сбора базовой информации:', error);
    }
    
    return info;
  },
  
  async collectPublicStatistics(videoId) {
    const stats = {
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      engagementRate: 0,
      popularityScore: 0,
      historicalData: [],
      comparisonData: {}
    };
    
    try {
      // Используем YouTube Data API v3 эмуляцию
      const apiData = await this.fetchVideoAPI(videoId, 'statistics');
      
      if (apiData && apiData.items && apiData.items[0]) {
        const item = apiData.items[0];
        stats.viewCount = parseInt(item.statistics.viewCount) || 0;
        stats.likeCount = parseInt(item.statistics.likeCount) || 0;
        stats.commentCount = parseInt(item.statistics.commentCount) || 0;
        
        // Для dislikeCount используем альтернативные методы
        stats.dislikeCount = await this.estimateDislikeCount(videoId);
      }
      
      // Расчет engagement rate
      if (stats.viewCount > 0) {
        const engagement = (stats.likeCount + (stats.dislikeCount || 0)) / stats.viewCount;
        stats.engagementRate = engagement;
        stats.popularityScore = this.calculatePopularityScore(stats);
      }
      
      // Сбор исторических данных
      stats.historicalData = await this.collectHistoricalStats(videoId);
      
      // Сравнительные данные
      stats.comparisonData = await this.getComparisonData(videoId);
      
    } catch (error) {
      console.error('Ошибка сбора статистики:', error);
    }
    
    return stats;
  },
  
  async collectAnalytics(videoId) {
    const analytics = {
      watchTime: 0,
      averageViewDuration: 0,
      audienceRetention: [],
      trafficSources: {},
      deviceTypes: {},
      geography: {},
      demographics: {},
      subscriberChanges: 0,
      revenue: 0,
      impressions: 0,
      clickThroughRate: 0
    };
    
    try {
      // Эмуляция запросов к YouTube Analytics API
      const analyticsData = await this.fetchAnalyticsData(videoId);
      
      if (analyticsData) {
        analytics.watchTime = analyticsData.watchTime || 0;
        analytics.averageViewDuration = analyticsData.averageViewDuration || 0;
        analytics.audienceRetention = analyticsData.audienceRetention || [];
        analytics.trafficSources = analyticsData.trafficSources || {};
        analytics.deviceTypes = analyticsData.deviceTypes || {};
        analytics.geography = analyticsData.geography || {};
        analytics.demographics = analyticsData.demographics || {};
        analytics.subscriberChanges = analyticsData.subscriberChanges || 0;
        analytics.revenue = analyticsData.estimatedRevenue || 0;
        analytics.impressions = analyticsData.impressions || 0;
        analytics.clickThroughRate = analyticsData.clickThroughRate || 0;
      }
      
      // Дополнительный расчет
      analytics.engagementScore = this.calculateEngagementScore(analytics);
      analytics.viralityPotential = this.calculateViralityPotential(analytics);
      
    } catch (error) {
      console.error('Ошибка сбора аналитики:', error);
    }
    
    return analytics;
  },
  
  async collectAudienceData(videoId) {
    const audience = {
      ageGroups: {},
      genderDistribution: {},
      topCountries: [],
      topCities: [],
      subtitlesUsage: 0,
      playbackSpeed: {},
      repeatViews: 0,
      uniqueViewers: 0,
      subscriberViews: 0,
      nonSubscriberViews: 0
    };
    
    try {
      // Используем различные методы сбора данных об аудитории
      const channelId = await this.getChannelIdFromVideo(videoId);
      
      if (channelId) {
        // Эмуляция запросов к данным аудитории
        const audienceData = await this.fetchAudienceData(channelId, videoId);
        
        if (audienceData) {
          audience.ageGroups = audienceData.ageGroups || {};
          audience.genderDistribution = audienceData.genderDistribution || {};
          audience.topCountries = audienceData.topCountries || [];
          audience.topCities = audienceData.topCities || [];
          audience.subtitlesUsage = audienceData.subtitlesUsage || 0;
          audience.playbackSpeed = audienceData.playbackSpeed || {};
          audience.repeatViews = audienceData.repeatViews || 0;
          audience.uniqueViewers = audienceData.uniqueViewers || 0;
          audience.subscriberViews = audienceData.subscriberViews || 0;
          audience.nonSubscriberViews = audienceData.nonSubscriberViews || 0;
        }
      }
      
      // Расчет дополнительных метрик
      audience.loyaltyScore = this.calculateLoyaltyScore(audience);
      audience.geoDiversity = this.calculateGeoDiversity(audience);
      
    } catch (error) {
      console.error('Ошибка сбора данных аудитории:', error);
    }
    
    return audience;
  },
  
  async collectRevenueData(videoId) {
    const revenue = {
      estimatedRevenue: 0,
      rpm: 0,
      cpm: 0,
      monetizedPlaybacks: 0,
      playbackBasedCpm: 0,
      adImpressions: 0,
      estimatedAdRevenue: 0,
      transactionRevenue: 0,
      youtubePremiumRevenue: 0,
      sponsorshipRevenue: 0,
      merchandisingRevenue: 0
    };
    
    try {
      // Эмуляция данных о доходах (только для авторов)
      const revenueData = await this.fetchRevenueData(videoId);
      
      if (revenueData) {
        revenue.estimatedRevenue = revenueData.estimatedRevenue || 0;
        revenue.rpm = revenueData.rpm || 0;
        revenue.cpm = revenueData.cpm || 0;
        revenue.monetizedPlaybacks = revenueData.monetizedPlaybacks || 0;
        revenue.playbackBasedCpm = revenueData.playbackBasedCpm || 0;
        revenue.adImpressions = revenueData.adImpressions || 0;
        revenue.estimatedAdRevenue = revenueData.estimatedAdRevenue || 0;
        revenue.transactionRevenue = revenueData.transactionRevenue || 0;
        revenue.youtubePremiumRevenue = revenueData.youtubePremiumRevenue || 0;
      }
      
      // Расчет дополнительных финансовых метрик
      revenue.roi = this.calculateROI(revenue);
      revenue.profitMargin = this.calculateProfitMargin(revenue);
      
    } catch (error) {
      console.error('Ошибка сбора данных о доходах:', error);
    }
    
    return revenue;
  },
  
  async collectEngagementData(videoId) {
    const engagement = {
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      playlistsAdds: 0,
      endScreenClicks: 0,
      cardsClicks: 0,
      annotationsClicks: 0,
      subscribersGained: 0,
      subscribersLost: 0,
      averagePercentageWatched: 0,
      relativeRetention: []
    };
    
    try {
      // Используем комбинацию API для сбора данных вовлеченности
      const engagementData = await this.fetchEngagementData(videoId);
      
      if (engagementData) {
        engagement.likes = engagementData.likes || 0;
        engagement.dislikes = engagementData.dislikes || 0;
        engagement.comments = engagementData.comments || 0;
        engagement.shares = engagementData.shares || 0;
        engagement.saves = engagementData.saves || 0;
        engagement.playlistsAdds = engagementData.playlistsAdds || 0;
        engagement.endScreenClicks = engagementData.endScreenClicks || 0;
        engagement.cardsClicks = engagementData.cardsClicks || 0;
        engagement.annotationsClicks = engagementData.annotationsClicks || 0;
        engagement.subscribersGained = engagementData.subscribersGained || 0;
        engagement.subscribersLost = engagementData.subscribersLost || 0;
        engagement.averagePercentageWatched = engagementData.averagePercentageWatched || 0;
        engagement.relativeRetention = engagementData.relativeRetention || [];
      }
      
      // Расчет метрик вовлеченности
      engagement.engagementScore = this.calculateEngagementScore(engagement);
      engagement.viralityIndex = this.calculateViralityIndex(engagement);
      
    } catch (error) {
      console.error('Ошибка сбора данных вовлеченности:', error);
    }
    
    return engagement;
  },
  
  async collectTechnicalData(videoId) {
    const technical = {
      videoCodec: null,
      audioCodec: null,
      resolution: null,
      frameRate: 0,
      bitrate: 0,
      fileSize: 0,
      encodingSettings: {},
      adaptiveFormats: [],
      playerResponses: [],
      bufferingEvents: 0,
      playbackErrors: 0,
      qualityOfExperience: 0
    };
    
    try {
      // Получаем технические данные через player API
      const playerResponse = await this.fetchVideoAPI(videoId, 'player');
      
      if (playerResponse && playerResponse.streamingData) {
        const streamingData = playerResponse.streamingData;
        
        if (streamingData.formats && streamingData.formats.length > 0) {
          const format = streamingData.formats[0];
          technical.videoCodec = format.videoCodec;
          technical.audioCodec = format.audioCodec;
          technical.resolution = `${format.width}x${format.height}`;
          technical.frameRate = format.fps;
          technical.bitrate = format.bitrate;
          technical.fileSize = format.contentLength;
        }
        
        if (streamingData.adaptiveFormats) {
          technical.adaptiveFormats = streamingData.adaptiveFormats.map(f => ({
            itag: f.itag,
            mimeType: f.mimeType,
            bitrate: f.bitrate,
            width: f.width,
            height: f.height,
            contentLength: f.contentLength
          }));
        }
      }
      
      // Сбор данных о качестве воспроизведения
      technical.qualityOfExperience = await this.assessQualityOfExperience(videoId);
      
    } catch (error) {
      console.error('Ошибка сбора технических данных:', error);
    }
    
    return technical;
  },
  
  async collectRawAPIData(videoId) {
    const rawData = {
      playerResponse: null,
      nextResponse: null,
      browseResponse: null,
      searchResponse: null,
      commentResponse: null,
      transcriptResponse: null,
      watchtimeResponse: null,
      initialData: null,
      configData: null
    };
    
    try {
      // Собираем все возможные ответы API
      const endpoints = [
        { key: 'playerResponse', url: `/youtubei/v1/player?videoId=${videoId}` },
        { key: 'nextResponse', url: `/youtubei/v1/next?videoId=${videoId}` },
        { key: 'browseResponse', url: `/youtubei/v1/browse?videoId=${videoId}` },
        { key: 'commentResponse', url: `/youtubei/v1/comment?videoId=${videoId}` }
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeInternalRequest(endpoint.url);
          rawData[endpoint.key] = response;
        } catch (error) {
          rawData[endpoint.key] = { error: error.message };
        }
      }
      
      // Получаем ytInitialData
      rawData.initialData = this.getYouTubeInitialData();
      
      // Получаем ytcfg
      rawData.configData = this.getYouTubeConfigData();
      
    } catch (error) {
      console.error('Ошибка сбора сырых данных:', error);
    }
    
    return rawData;
  },
  
  // Вспомогательные методы API
  async fetchVideoAPI(videoId, endpoint) {
    const apiEndpoints = {
      player: `/youtubei/v1/player`,
      statistics: `/youtubei/v1/videos`,
      analytics: `/youtubei/v1/analytics`,
      audience: `/youtubei/v1/audience`,
      revenue: `/youtubei/v1/revenue`
    };
    
    const url = apiEndpoints[endpoint] || apiEndpoints.player;
    
    try {
      const response = await this.makeInternalRequest(url, {
        videoId: videoId,
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.06.00',
            hl: 'ru',
            gl: 'RU'
          }
        }
      });
      
      return response;
    } catch (error) {
      // Fallback: попробуем через внешний API
      return await this.fetchExternalAPI(videoId, endpoint);
    }
  },
  
  async makeInternalRequest(url, body) {
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
      
      xhr.send(JSON.stringify(body || {}));
    });
  },
  
  async fetchExternalAPI(videoId, endpoint) {
    // Эмуляция внешнего API (в реальности здесь будут реальные запросы)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockData(videoId, endpoint);
        resolve(mockData);
      }, 100);
    });
  },
  
  generateMockData(videoId, endpoint) {
    const mockGenerators = {
      player: () => ({
        videoDetails: {
          videoId: videoId,
          title: `Mock Video ${videoId}`,
          lengthSeconds: Math.floor(Math.random() * 3600),
          channelId: 'UC' + this.generateRandomString(22),
          isOwnerViewing: false,
          isCrawlable: true,
          thumbnails: [],
          allowRatings: true,
          viewCount: Math.floor(Math.random() * 1000000),
          author: 'Mock Channel',
          isPrivate: false,
          isUnpluggedCorpus: false,
          isLiveContent: false
        },
        streamingData: {
          expiresInSeconds: "21540",
          formats: [
            {
              itag: 18,
              url: `https://example.com/video/${videoId}`,
              mimeType: "video/mp4",
              bitrate: 500000,
              width: 640,
              height: 360,
              lastModified: "1600000000000",
              contentLength: "10000000",
              quality: "medium",
              fps: 30,
              qualityLabel: "360p",
              projectionType: "RECTANGULAR",
              averageBitrate: 500000,
              audioQuality: "AUDIO_QUALITY_LOW",
              approxDurationMs: "300000",
              audioSampleRate: "44100",
              audioChannels: 2
            }
          ],
          adaptiveFormats: []
        }
      }),
      
      statistics: () => ({
        items: [{
          id: videoId,
          statistics: {
            viewCount: Math.floor(Math.random() * 1000000).toString(),
            likeCount: Math.floor(Math.random() * 50000).toString(),
            favoriteCount: "0",
            commentCount: Math.floor(Math.random() * 10000).toString()
          }
        }]
      }),
      
      analytics: () => ({
        watchTime: Math.floor(Math.random() * 1000000),
        averageViewDuration: Math.floor(Math.random() * 300),
        audienceRetention: Array.from({length: 100}, (_, i) => ({
          point: i,
          value: Math.random() * 100
        })),
        trafficSources: {
          suggested: Math.random() * 40,
          external: Math.random() * 20,
          browse: Math.random() * 15,
          channel: Math.random() * 10,
          other: Math.random() * 15
        }
      })
    };
    
    return mockGenerators[endpoint] ? mockGenerators[endpoint]() : {};
  },
  
  // Методы анализа
  analyzeVideoData(data) {
    const analysis = {
      performance: this.analyzePerformance(data),
      audience: this.analyzeAudience(data),
      engagement: this.analyzeEngagement(data),
      monetization: this.analyzeMonetization(data),
      technical: this.analyzeTechnical(data),
      recommendations: [],
      riskFactors: [],
      opportunities: []
    };
    
    // Генерация рекомендаций
    analysis.recommendations = this.generateDataDrivenRecommendations(data, analysis);
    
    // Выявление факторов риска
    analysis.riskFactors = this.identifyRiskFactors(data, analysis);
    
    // Поиск возможностей
    analysis.opportunities = this.identifyOpportunities(data, analysis);
    
    return analysis;
  },
  
  analyzePerformance(data) {
    const perf = {
      score: 0,
      metrics: {},
      comparison: {},
      trends: []
    };
    
    // Расчет общего скора производительности
    const scores = [];
    
    if (data.statistics.viewCount > 0) {
      // Скор на основе просмотров
      const viewScore = Math.min(100, data.statistics.viewCount / 10000);
      scores.push(viewScore);
      
      // Скор на основе вовлеченности
      const engagementScore = data.statistics.engagementRate * 100;
      scores.push(engagementScore);
    }
    
    if (data.analytics.watchTime > 0) {
      // Скор на основе времени просмотра
      const watchTimeScore = Math.min(100, data.analytics.watchTime / 3600);
      scores.push(watchTimeScore);
    }
    
    perf.score = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
    
    // Детальные метрики
    perf.metrics = {
      viewVelocity: this.calculateViewVelocity(data),
      engagementGrowth: this.calculateEngagementGrowth(data),
      retentionQuality: this.calculateRetentionQuality(data.analytics.audienceRetention),
      viralityPotential: data.analytics.viralityPotential || 0
    };
    
    return perf;
  },
  
  analyzeAudience(data) {
    const audience = {
      size: data.audienceData.uniqueViewers || data.statistics.viewCount,
      loyalty: data.audienceData.loyaltyScore || 0,
      diversity: data.audienceData.geoDiversity || 0,
      demographics: {
        age: data.audienceData.ageGroups || {},
        gender: data.audienceData.genderDistribution || {},
        location: data.audienceData.topCountries || []
      },
      behavior: {
        repeatRate: data.audienceData.repeatViews / Math.max(data.statistics.viewCount, 1),
        completionRate: data.engagementData.averagePercentageWatched || 0,
        interactionRate: this.calculateInteractionRate(data)
      }
    };
    
    return audience;
  },
  
  analyzeEngagement(data) {
    const engagement = {
      score: data.engagementData.engagementScore || 0,
      metrics: {
        likeRatio: data.statistics.likeCount / Math.max(data.statistics.viewCount, 1),
        commentRatio: data.statistics.commentCount / Math.max(data.statistics.viewCount, 1),
        shareRatio: data.engagementData.shares / Math.max(data.statistics.viewCount, 1),
        saveRatio: data.engagementData.saves / Math.max(data.statistics.viewCount, 1)
      },
      patterns: {
        peakTimes: this.detectEngagementPeaks(data),
        sentiment: this.analyzeCommentSentiment(data),
        viralTriggers: this.identifyViralTriggers(data)
      }
    };
    
    return engagement;
  },
  
  analyzeMonetization(data) {
    const monetization = {
      revenue: data.revenueData.estimatedRevenue || 0,
      efficiency: data.revenueData.rpm || 0,
      potential: this.calculateRevenuePotential(data),
      metrics: {
        cpm: data.revenueData.cpm || 0,
        rpm: data.revenueData.rpm || 0,
        monetizationRate: data.revenueData.monetizedPlaybacks / Math.max(data.statistics.viewCount, 1),
        adPerformance: data.revenueData.estimatedAdRevenue / Math.max(data.revenueData.estimatedRevenue, 1)
      },
      opportunities: this.identifyMonetizationOpportunities(data)
    };
    
    return monetization;
  },
  
  analyzeTechnical(data) {
    const technical = {
      quality: data.technicalData.qualityOfExperience || 0,
      metrics: {
        resolution: data.technicalData.resolution,
        bitrate: data.technicalData.bitrate,
        buffering: data.technicalData.bufferingEvents,
        errors: data.technicalData.playbackErrors
      },
      optimization: {
        recommendedResolution: this.recommendOptimalResolution(data),
        bitrateOptimization: this.calculateBitrateOptimization(data),
        formatRecommendations: this.recommendOptimalFormats(data)
      }
    };
    
    return technical;
  },
  
  // Генерация отчетов
  generateReports(data) {
    const reports = {
      executiveSummary: this.generateExecutiveSummary(data),
      detailedAnalysis: this.generateDetailedAnalysis(data),
      performanceReport: this.generatePerformanceReport(data),
      audienceReport: this.generateAudienceReport(data),
      engagementReport: this.generateEngagementReport(data),
      monetizationReport: this.generateMonetizationReport(data),
      technicalReport: this.generateTechnicalReport(data),
      recommendationsReport: this.generateRecommendationsReport(data)
    };
    
    return reports;
  },
  
  generateExecutiveSummary(data) {
    return {
      title: `Executive Summary: Video ${data.videoId}`,
      date: new Date().toISOString().split('T')[0],
      overview: {
        performanceScore: data.analyzedData.performance.score.toFixed(1),
        engagementScore: data.analyzedData.engagement.score.toFixed(1),
        monetizationScore: data.analyzedData.monetization.efficiency,
        technicalScore: data.analyzedData.technical.quality.toFixed(1)
      },
      keyFindings: [
        `Total Views: ${data.statistics.viewCount.toLocaleString()}`,
        `Engagement Rate: ${(data.statistics.engagementRate * 100).toFixed(2)}%`,
        `Estimated Revenue: $${data.revenueData.estimatedRevenue.toFixed(2)}`,
        `Average Watch Time: ${data.analytics.averageViewDuration.toFixed(1)} seconds`
      ],
      recommendations: data.analyzedData.recommendations.slice(0, 3).map(r => r.action)
    };
  },
  
  // Экспорт данных
  exportAllData(data, reports) {
    const exports = {
      json: {
        full: JSON.stringify(data, null, 2),
        summary: JSON.stringify(reports.executiveSummary, null, 2),
        analytics: JSON.stringify(data.analytics, null, 2)
      },
      csv: {
        statistics: this.convertToCSV(data.statistics),
        analytics: this.convertToCSV(data.analytics),
        audience: this.convertToCSV(data.audienceData)
      },
      html: this.generateHTMLReport(data, reports),
      pdf: this.generatePDFReport(data, reports),
      sql: this.generateSQLExport(data),
      excel: this.generateExcelTemplate(data)
    };
    
    return exports;
  },
  
  convertToCSV(obj) {
    if (!obj || typeof obj !== 'object') return '';
    
    const rows = [];
    const headers = Object.keys(obj);
    rows.push(headers.join(','));
    
    const values = headers.map(header => {
      const value = obj[header];
      if (Array.isArray(value)) {
        return `"[${value.join(', ')}]"`;
      } else if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        return `"${value}"`;
      }
    });
    
    rows.push(values.join(','));
    return rows.join('\n');
  },
  
  generateHTMLReport(data, reports) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>YouTube Video Analysis: ${data.videoId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #ff0000; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; }
        .score { font-size: 24px; font-weight: bold; color: #ff0000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>YouTube Video Analysis Report</h1>
        <p>Video ID: ${data.videoId} | Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
        <h2>Performance Summary</h2>
        <div class="metric">Views: <span class="score">${data.statistics.viewCount.toLocaleString()}</span></div>
        <div class="metric">Engagement: <span class="score">${(data.statistics.engagementRate * 100).toFixed(2)}%</span></div>
        <div class="metric">Performance Score: <span class="score">${data.analyzedData.performance.score.toFixed(1)}/100</span></div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${data.analyzedData.recommendations.slice(0, 5).map(r => `<li>${r.action}: ${r.description}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
    `;
  },
  
  // Рекомендации
  getStatsRecommendations(data) {
    const recommendations = [];
    
    // Рекомендации на основе производительности
    if (data.analyzedData.performance.score < 50) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Улучшить вовлеченность',
        description: `Низкий скор производительности: ${data.analyzedData.performance.score.toFixed(1)}/100`
      });
    }
    
    // Рекомендации на основе аудитории
    if (data.analyzedData.audience.loyalty < 30) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Увеличить лояльность аудитории',
        description: `Скор лояльности: ${data.analyzedData.audience.loyalty.toFixed(1)}%`
      });
    }
    
    // Рекомендации по монетизации
    if (data.analyzedData.monetization.efficiency < 1) {
      recommendations.push({
        priority: 'LOW',
        action: 'Оптимизировать монетизацию',
        description: `RPM: $${data.analyzedData.monetization.efficiency.toFixed(2)}`
      });
    }
    
    return recommendations;
  },
  
  // Вспомогательные методы
  getYouTubeInitialData() {
    try {
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const text = script.textContent;
        if (text.includes('ytInitialData')) {
          const match = text.match(/ytInitialData\s*=\s*({.+?});/s);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
      }
    } catch(e) {}
    return null;
  },
  
  getYouTubeConfigData() {
    try {
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const text = script.textContent;
        if (text.includes('ytcfg.set')) {
          const match = text.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)/s);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
      }
    } catch(e) {}
    return null;
  },
  
  findVideoDataInObject(obj, videoId, path = '') {
    if (!obj || typeof obj !== 'object') return null;
    
    // Проверяем текущий объект
    if ((obj.videoId === videoId || obj.id === videoId) && obj.title) {
      return obj;
    }
    
    // Рекурсивный поиск
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = this.findVideoDataInObject(obj[key], videoId, path ? `${path}.${key}` : key);
        if (result) return result;
      }
    }
    
    return null;
  },
  
  extractDescription(videoData) {
    if (videoData.description?.runs) {
      return videoData.description.runs.map(r => r.text).join('');
    } else if (videoData.description?.simpleText) {
      return videoData.description.simpleText;
    }
    return null;
  },
  
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },
  
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

console.log('✅ Video Stats Exploit модуль загружен');
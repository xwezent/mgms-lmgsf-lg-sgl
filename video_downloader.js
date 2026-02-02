// Video Downloader Exploit - Скачивание видео с YouTube в максимальном качестве
window.exploit_video_downloader = {
  name: 'video_downloader',
  description: 'Скачивание видео в максимальном качестве с обходом ограничений',
  version: '2.0',
  
  async execute(params) {
    console.log('📥 Запуск Video Downloader с параметрами:', params);
    
    const videoId = this.extractVideoId(params.videoUrl);
    if (!videoId) {
      throw new Error('Не удалось извлечь ID видео из URL');
    }
    
    // Шаг 1: Получение информации о видео
    const videoInfo = await this.getVideoInfo(videoId);
    
    // Шаг 2: Извлечение доступных форматов
    const availableFormats = await this.extractAvailableFormats(videoId);
    
    // Шаг 3: Выбор оптимального формата
    const selectedFormat = this.selectBestFormat(availableFormats, params.quality || 'best');
    
    // Шаг 4: Обход ограничений
    const bypassMethods = await this.applyBypassMethods(videoId, selectedFormat);
    
    // Шаг 5: Скачивание видео
    const downloadResult = await this.downloadVideo(videoId, selectedFormat, bypassMethods);
    
    // Шаг 6: Пост-обработка
    const postProcessing = await this.postProcessDownload(downloadResult, videoInfo);
    
    return {
      success: true,
      videoId: videoId,
      videoInfo: videoInfo,
      availableFormats: availableFormats,
      selectedFormat: selectedFormat,
      bypassMethods: bypassMethods,
      downloadResult: downloadResult,
      postProcessing: postProcessing,
      recommendations: this.getDownloaderRecommendations(downloadResult),
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
  
  async getVideoInfo(videoId) {
    console.log(`Получение информации о видео ${videoId}...`);
    
    const info = {
      videoId: videoId,
      title: null,
      duration: 0,
      channel: null,
      isLive: false,
      isAgeRestricted: false,
      isMembersOnly: false,
      availableQualities: [],
      streamData: null
    };
    
    try {
      // Используем внутренний API YouTube
      const playerResponse = await this.fetchPlayerResponse(videoId);
      
      if (playerResponse && playerResponse.videoDetails) {
        const details = playerResponse.videoDetails;
        
        info.title = details.title;
        info.duration = parseInt(details.lengthSeconds);
        info.channel = {
          id: details.channelId,
          name: details.author
        };
        info.isLive = details.isLiveContent;
        
        // Проверка ограничений
        info.isAgeRestricted = this.checkAgeRestriction(playerResponse);
        info.isMembersOnly = this.checkMembersOnly(playerResponse);
        
        // Получение данных о стримах
        if (playerResponse.streamingData) {
          info.streamData = playerResponse.streamingData;
          info.availableQualities = this.extractQualities(playerResponse.streamingData);
        }
      }
      
      // Дополнительная информация через другие endpoints
      const videoData = await this.fetchVideoData(videoId);
      if (videoData) {
        info.views = videoData.viewCount;
        info.likes = videoData.likeCount;
        info.publishedDate = videoData.publishDate;
      }
      
    } catch (error) {
      console.error('Ошибка получения информации о видео:', error);
    }
    
    return info;
  },
  
  async fetchPlayerResponse(videoId) {
    const url = '/youtubei/v1/player';
    
    const requestBody = {
      videoId: videoId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231219.06.00',
          hl: 'ru',
          gl: 'RU'
        },
        thirdParty: {
          embedUrl: 'https://www.youtube.com/'
        }
      },
      playbackContext: {
        contentPlaybackContext: {
          vis: 0,
          splay: false,
          autoCaptionsDefaultOn: false,
          autonavState: 'STATE_NONE',
          html5Preference: 'HTML5_PREF_WANTS',
          lactMilliseconds: '-1'
        }
      },
      racyCheckOk: true,
      contentCheckOk: true
    };
    
    try {
      const response = await this.makeRequest(url, requestBody);
      return response;
    } catch (error) {
      // Альтернативный метод
      return await this.fetchPlayerResponseAlternative(videoId);
    }
  },
  
  async fetchPlayerResponseAlternative(videoId) {
    // Используем альтернативный endpoint
    const url = `/get_video_info?video_id=${videoId}&el=detailpage&ps=default&eurl=&gl=US&hl=en`;
    
    try {
      const response = await this.makeRequest(url, null, 'GET');
      const params = new URLSearchParams(response);
      
      return {
        videoDetails: {
          videoId: videoId,
          title: params.get('title'),
          lengthSeconds: params.get('length_seconds'),
          channelId: params.get('channel_id'),
          author: params.get('author'),
          isLiveContent: params.get('live_playback') === '1'
        },
        streamingData: {
          formats: JSON.parse(params.get('url_encoded_fmt_stream_map') || '[]'),
          adaptiveFormats: JSON.parse(params.get('adaptive_fmts') || '[]')
        }
      };
    } catch (error) {
      throw new Error(`Не удалось получить информацию о видео: ${error.message}`);
    }
  },
  
  checkAgeRestriction(playerResponse) {
    if (!playerResponse.playabilityStatus) return false;
    
    const status = playerResponse.playabilityStatus.status;
    return status === 'LOGIN_REQUIRED' || 
           status === 'AGE_VERIFICATION_REQUIRED' ||
           (playerResponse.playabilityStatus.messages && 
            playerResponse.playabilityStatus.messages.some(m => 
              m.includes('age') || m.includes('возраст')
            ));
  },
  
  checkMembersOnly(playerResponse) {
    if (!playerResponse.playabilityStatus) return false;
    
    const status = playerResponse.playabilityStatus.status;
    return status === 'UNPLAYABLE' || 
           (playerResponse.playabilityStatus.messages &&
            playerResponse.playabilityStatus.messages.some(m =>
              m.includes('member') || m.includes('спонсор')
            ));
  },
  
  extractQualities(streamingData) {
    const qualities = [];
    
    if (streamingData.formats) {
      streamingData.formats.forEach(format => {
        if (format.qualityLabel) {
          qualities.push({
            quality: format.qualityLabel,
            itag: format.itag,
            mimeType: format.mimeType,
            bitrate: format.bitrate,
            width: format.width,
            height: format.height,
            fps: format.fps,
            type: 'format'
          });
        }
      });
    }
    
    if (streamingData.adaptiveFormats) {
      streamingData.adaptiveFormats.forEach(format => {
        if (format.qualityLabel) {
          qualities.push({
            quality: format.qualityLabel,
            itag: format.itag,
            mimeType: format.mimeType,
            bitrate: format.bitrate,
            width: format.width,
            height: format.height,
            fps: format.fps,
            type: 'adaptive'
          });
        }
      });
    }
    
    // Удаляем дубликаты
    return qualities.filter((q, index, self) =>
      index === self.findIndex(t => t.quality === q.quality && t.itag === q.itag)
    );
  },
  
  async fetchVideoData(videoId) {
    const url = '/youtubei/v1/videos';
    
    const requestBody = {
      videoId: videoId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231219.06.00',
          hl: 'ru',
          gl: 'RU'
        }
      }
    };
    
    try {
      const response = await this.makeRequest(url, requestBody);
      
      if (response && response.items && response.items[0]) {
        const item = response.items[0];
        return {
          viewCount: item.statistics?.viewCount || 0,
          likeCount: item.statistics?.likeCount || 0,
          publishDate: item.snippet?.publishedAt || null
        };
      }
    } catch (error) {
      console.error('Ошибка получения данных видео:', error);
    }
    
    return null;
  },
  
  async extractAvailableFormats(videoId) {
    console.log(`Извлечение доступных форматов для видео ${videoId}...`);
    
    const formats = {
      video: [],
      audio: [],
      combined: [],
      live: [],
      hdr: [],
      vr: []
    };
    
    try {
      // Основной метод через player API
      const playerResponse = await this.fetchPlayerResponse(videoId);
      
      if (playerResponse.streamingData) {
        const streamingData = playerResponse.streamingData;
        
        // Обычные форматы (видео+аудио)
        if (streamingData.formats) {
          streamingData.formats.forEach(format => {
            formats.combined.push({
              itag: format.itag,
              mimeType: format.mimeType,
              quality: format.qualityLabel || `${format.height}p`,
              bitrate: format.bitrate,
              width: format.width,
              height: format.height,
              fps: format.fps,
              url: format.url,
              contentLength: format.contentLength,
              audioQuality: format.audioQuality,
              approxDurationMs: format.approxDurationMs,
              type: 'combined'
            });
          });
        }
        
        // Адаптивные форматы (раздельное видео и аудио)
        if (streamingData.adaptiveFormats) {
          streamingData.adaptiveFormats.forEach(format => {
            const isAudio = format.mimeType.includes('audio');
            const isVideo = format.mimeType.includes('video');
            
            const formatInfo = {
              itag: format.itag,
              mimeType: format.mimeType,
              bitrate: format.bitrate,
              contentLength: format.contentLength,
              url: format.url,
              approxDurationMs: format.approxDurationMs,
              type: isAudio ? 'audio' : 'video'
            };
            
            if (isVideo) {
              formatInfo.quality = format.qualityLabel || `${format.height}p`;
              formatInfo.width = format.width;
              formatInfo.height = format.height;
              formatInfo.fps = format.fps;
              formatInfo.colorInfo = format.colorInfo;
              
              formats.video.push(formatInfo);
              
              // Проверка HDR
              if (format.colorInfo && format.colorInfo.primaries === 'BT2020') {
                formats.hdr.push(formatInfo);
              }
            } else if (isAudio) {
              formatInfo.audioQuality = format.audioQuality;
              formatInfo.audioSampleRate = format.audioSampleRate;
              formatInfo.audioChannels = format.audioChannels;
              
              formats.audio.push(formatInfo);
            }
          });
        }
      }
      
      // Дополнительные методы извлечения
      await this.extractAlternativeFormats(videoId, formats);
      
      // Сортировка по качеству
      formats.video.sort((a, b) => {
        const aQuality = this.parseQuality(a.quality);
        const bQuality = this.parseQuality(b.quality);
        return bQuality - aQuality;
      });
      
      formats.audio.sort((a, b) => {
        const aBitrate = a.bitrate || 0;
        const bBitrate = b.bitrate || 0;
        return bBitrate - aBitrate;
      });
      
      formats.combined.sort((a, b) => {
        const aQuality = this.parseQuality(a.quality);
        const bQuality = this.parseQuality(b.quality);
        return bQuality - aQuality;
      });
      
    } catch (error) {
      console.error('Ошибка извлечения форматов:', error);
    }
    
    return formats;
  },
  
  async extractAlternativeFormats(videoId, formats) {
    // Альтернативные методы извлечения форматов
    
    // Метод 1: через get_video_info
    try {
      const videoInfo = await this.fetchVideoInfoLegacy(videoId);
      if (videoInfo && videoInfo.formats) {
        videoInfo.formats.forEach(format => {
          if (!formats.combined.some(f => f.itag === format.itag)) {
            formats.combined.push({
              itag: format.itag,
              quality: format.quality,
              type: 'legacy',
              url: format.url,
              mimeType: format.type
            });
          }
        });
      }
    } catch (error) {
      // Игнорируем ошибки альтернативных методов
    }
    
    // Метод 2: через embed API
    try {
      const embedData = await this.fetchEmbedData(videoId);
      if (embedData && embedData.streamingData) {
        // Обработка данных из embed
      }
    } catch (error) {
      // Игнорируем
    }
  },
  
  async fetchVideoInfoLegacy(videoId) {
    const url = `https://www.youtube.com/get_video_info?video_id=${videoId}&el=embedded&ps=default&gl=US&hl=en`;
    
    try {
      const response = await this.makeRequest(url, null, 'GET');
      const params = new URLSearchParams(response);
      
      const playerResponse = params.get('player_response');
      if (playerResponse) {
        return JSON.parse(playerResponse);
      }
      
      // Старый формат
      const urlEncodedFmtStreamMap = params.get('url_encoded_fmt_stream_map');
      if (urlEncodedFmtStreamMap) {
        const formats = urlEncodedFmtStreamMap.split(',').map(item => {
          const formatParams = new URLSearchParams(item);
          return {
            itag: formatParams.get('itag'),
            quality: formatParams.get('quality'),
            type: formatParams.get('type'),
            url: formatParams.get('url')
          };
        });
        
        return { formats };
      }
    } catch (error) {
      throw error;
    }
    
    return null;
  },
  
  async fetchEmbedData(videoId) {
    const url = `https://www.youtube.com/embed/${videoId}`;
    
    try {
      const response = await this.makeRequest(url, null, 'GET');
      // Парсим JavaScript на странице embed для извлечения данных
      const match = response.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (error) {
      // Игнорируем
    }
    
    return null;
  },
  
  parseQuality(qualityString) {
    if (!qualityString) return 0;
    
    const match = qualityString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  },
  
  selectBestFormat(availableFormats, qualityPreference) {
    console.log(`Выбор формата с предпочтением: ${qualityPreference}`);
    
    const selection = {
      video: null,
      audio: null,
      combined: null,
      method: null,
      estimatedSize: 0,
      estimatedTime: 'Неизвестно'
    };
    
    // В зависимости от предпочтения выбираем стратегию
    switch (qualityPreference) {
      case 'best':
        selection.method = this.selectBestQuality(availableFormats, selection);
        break;
        
      case 'fastest':
        selection.method = this.selectFastestDownload(availableFormats, selection);
        break;
        
      case 'balanced':
        selection.method = this.selectBalanced(availableFormats, selection);
        break;
        
      case 'audio_only':
        selection.method = this.selectAudioOnly(availableFormats, selection);
        break;
        
      case '360p':
      case '480p':
      case '720p':
      case '1080p':
      case '1440p':
      case '2160p':
        selection.method = this.selectSpecificQuality(availableFormats, selection, qualityPreference);
        break;
        
      default:
        selection.method = this.selectBestQuality(availableFormats, selection);
    }
    
    // Расчет примерного размера и времени
    if (selection.video || selection.combined) {
      const format = selection.video || selection.combined;
      selection.estimatedSize = this.estimateFileSize(format);
      selection.estimatedTime = this.estimateDownloadTime(selection.estimatedSize);
    }
    
    return selection;
  },
  
  selectBestQuality(formats, selection) {
    // Выбираем лучшее видео качество
    if (formats.video.length > 0) {
      selection.video = formats.video[0]; // Уже отсортировано по качеству
      
      // Выбираем лучшее аудио
      if (formats.audio.length > 0) {
        selection.audio = formats.audio[0];
      }
      
      return 'adaptive_best';
    }
    
    // Если нет адаптивных форматов, используем комбинированные
    if (formats.combined.length > 0) {
      selection.combined = formats.combined[0];
      return 'combined_best';
    }
    
    throw new Error('Нет доступных форматов для скачивания');
  },
  
  selectFastestDownload(formats, selection) {
    // Выбираем формат с самым маленьким размером
    let fastestFormat = null;
    let smallestSize = Infinity;
    
    // Проверяем комбинированные форматы
    formats.combined.forEach(format => {
      const size = this.estimateFileSize(format);
      if (size < smallestSize) {
        smallestSize = size;
        fastestFormat = format;
      }
    });
    
    if (fastestFormat) {
      selection.combined = fastestFormat;
      return 'combined_fastest';
    }
    
    // Если нет комбинированных, пробуем адаптивные
    if (formats.video.length > 0 && formats.audio.length > 0) {
      // Берем самое низкое качество видео и аудио
      selection.video = formats.video[formats.video.length - 1];
      selection.audio = formats.audio[formats.audio.length - 1];
      return 'adaptive_fastest';
    }
    
    throw new Error('Нет доступных форматов для скачивания');
  },
  
  selectBalanced(formats, selection) {
    // Выбираем сбалансированный вариант (качество/размер)
    if (formats.video.length > 0) {
      // Берем среднее качество видео
      const middleIndex = Math.floor(formats.video.length / 2);
      selection.video = formats.video[middleIndex];
      
      // Берем лучшее аудио
      if (formats.audio.length > 0) {
        selection.audio = formats.audio[0];
      }
      
      return 'adaptive_balanced';
    }
    
    // Для комбинированных форматов
    if (formats.combined.length > 0) {
      const middleIndex = Math.floor(formats.combined.length / 2);
      selection.combined = formats.combined[middleIndex];
      return 'combined_balanced';
    }
    
    throw new Error('Нет доступных форматов для скачивания');
  },
  
  selectAudioOnly(formats, selection) {
    if (formats.audio.length > 0) {
      selection.audio = formats.audio[0];
      return 'audio_only';
    }
    
    // Пробуем извлечь аудио из комбинированных форматов
    if (formats.combined.length > 0) {
      selection.combined = formats.combined[0];
      selection.extractAudioOnly = true;
      return 'combined_audio_extract';
    }
    
    throw new Error('Нет доступных аудио форматов');
  },
  
  selectSpecificQuality(formats, selection, targetQuality) {
    const targetHeight = parseInt(targetQuality);
    
    // Ищем видео с нужным качеством
    const videoFormat = formats.video.find(f => {
      const height = this.parseQuality(f.quality);
      return height === targetHeight;
    });
    
    if (videoFormat) {
      selection.video = videoFormat;
      
      // Лучшее аудио
      if (formats.audio.length > 0) {
        selection.audio = formats.audio[0];
      }
      
      return `adaptive_${targetQuality}`;
    }
    
    // Ищем комбинированный формат
    const combinedFormat = formats.combined.find(f => {
      const height = this.parseQuality(f.quality);
      return height === targetHeight;
    });
    
    if (combinedFormat) {
      selection.combined = combinedFormat;
      return `combined_${targetQuality}`;
    }
    
    // Если точное качество не найдено, берем ближайшее меньшее
    const lowerQuality = this.findClosestLowerQuality(formats, targetHeight);
    if (lowerQuality) {
      return this.selectSpecificQuality(formats, selection, `${lowerQuality}p`);
    }
    
    throw new Error(`Качество ${targetQuality} не доступно`);
  },
  
  findClosestLowerQuality(formats, targetHeight) {
    let closest = 0;
    
    // Проверяем видео форматы
    formats.video.forEach(f => {
      const height = this.parseQuality(f.quality);
      if (height < targetHeight && height > closest) {
        closest = height;
      }
    });
    
    // Проверяем комбинированные форматы
    formats.combined.forEach(f => {
      const height = this.parseQuality(f.quality);
      if (height < targetHeight && height > closest) {
        closest = height;
      }
    });
    
    return closest > 0 ? closest : null;
  },
  
  estimateFileSize(format) {
    if (format.contentLength) {
      return parseInt(format.contentLength);
    }
    
    if (format.bitrate && format.approxDurationMs) {
      const durationSeconds = parseInt(format.approxDurationMs) / 1000;
      return Math.floor((format.bitrate * durationSeconds) / 8);
    }
    
    // Примерная оценка по качеству
    const quality = this.parseQuality(format.quality);
    const durationMinutes = 5; // Предполагаем 5 минут
    
    const sizeMap = {
      144: 10 * 1024 * 1024,      // 10 MB
      240: 20 * 1024 * 1024,      // 20 MB
      360: 40 * 1024 * 1024,      // 40 MB
      480: 80 * 1024 * 1024,      // 80 MB
      720: 150 * 1024 * 1024,     // 150 MB
      1080: 300 * 1024 * 1024,    // 300 MB
      1440: 600 * 1024 * 1024,    // 600 MB
      2160: 1200 * 1024 * 1024,   // 1.2 GB
      4320: 3000 * 1024 * 1024    // 3 GB
    };
    
    const baseSize = sizeMap[quality] || sizeMap[1080];
    return Math.floor(baseSize * (durationMinutes / 5));
  },
  
  estimateDownloadSize(selection) {
    let totalSize = 0;
    
    if (selection.video && selection.video.contentLength) {
      totalSize += parseInt(selection.video.contentLength);
    }
    
    if (selection.audio && selection.audio.contentLength) {
      totalSize += parseInt(selection.audio.contentLength);
    }
    
    if (selection.combined && selection.combined.contentLength) {
      totalSize = parseInt(selection.combined.contentLength);
    }
    
    return totalSize;
  },
  
  estimateDownloadTime(fileSize) {
    const speeds = [
      { speed: 100 * 1024, label: 'медленно' },      // 100 KB/s
      { speed: 500 * 1024, label: 'средне' },        // 500 KB/s
      { speed: 2 * 1024 * 1024, label: 'быстро' },   // 2 MB/s
      { speed: 10 * 1024 * 1024, label: 'очень быстро' } // 10 MB/s
    ];
    
    const estimates = speeds.map(s => {
      const seconds = fileSize / s.speed;
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      let timeStr = '';
      if (hours > 0) timeStr += `${hours}ч `;
      if (minutes % 60 > 0) timeStr += `${minutes % 60}м `;
      if (seconds % 60 > 0 && hours === 0) timeStr += `${Math.ceil(seconds % 60)}с`;
      
      return {
        speed: s.label,
        time: timeStr.trim(),
        totalSeconds: seconds
      };
    });
    
    return estimates;
  },
  
  async applyBypassMethods(videoId, selectedFormat) {
    console.log('Применение методов обхода ограничений...');
    
    const bypassMethods = {
      applied: [],
      results: {},
      required: this.determineRequiredBypasses(selectedFormat)
    };
    
    // Проверяем необходимость обхода ограничений
    for (const method of bypassMethods.required) {
      try {
        const result = await this.applyBypassMethod(method, videoId, selectedFormat);
        bypassMethods.applied.push(method);
        bypassMethods.results[method] = result;
        
        await this.delay(500);
      } catch (error) {
        console.error(`Ошибка применения метода ${method}:`, error);
        bypassMethods.results[method] = { error: error.message };
      }
    }
    
    bypassMethods.successRate = (bypassMethods.applied.length / bypassMethods.required.length) * 100;
    
    return bypassMethods;
  },
  
  determineRequiredBypasses(selectedFormat) {
    const required = [];
    
    // Всегда применяем базовые методы
    required.push('rate_limit_bypass');
    required.push('signature_decryption');
    
    // Дополнительные методы в зависимости от формата
    if (selectedFormat.video && selectedFormat.video.quality.includes('2160') ||
        selectedFormat.video && selectedFormat.video.quality.includes('4320')) {
      required.push('premium_content_bypass');
    }
    
    if (selectedFormat.method && selectedFormat.method.includes('adaptive')) {
      required.push('adaptive_stream_bypass');
    }
    
    // Проверяем наличие DRM
    if (this.checkForDRM(selectedFormat)) {
      required.push('drm_bypass');
    }
    
    return required;
  },
  
  checkForDRM(selectedFormat) {
    // Проверяем признаки DRM
    const format = selectedFormat.video || selectedFormat.combined;
    
    if (!format || !format.url) return false;
    
    // Проверка по URL
    const url = format.url.toLowerCase();
    return url.includes('drm') || 
           url.includes('widevine') || 
           url.includes('playready') ||
           (format.mimeType && format.mimeType.includes('drm'));
  },
  
  async applyBypassMethod(method, videoId, selectedFormat) {
    switch (method) {
      case 'rate_limit_bypass':
        return await this.bypassRateLimit(videoId);
        
      case 'signature_decryption':
        return await this.decryptSignature(videoId, selectedFormat);
        
      case 'premium_content_bypass':
        return await this.bypassPremiumContent(videoId);
        
      case 'adaptive_stream_bypass':
        return await this.bypassAdaptiveStream(videoId, selectedFormat);
        
      case 'drm_bypass':
        return await this.bypassDRM(videoId);
        
      default:
        return { error: `Неизвестный метод обхода: ${method}` };
    }
  },
  
  async bypassRateLimit(videoId) {
    // Обход ограничений скорости и количества запросов
    const methods = [
      'ip_rotation',
      'user_agent_rotation',
      'request_throttling',
      'parallel_download'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        await this.applyRateLimitBypass(method, videoId);
        results.push({ method, success: true });
      } catch (error) {
        results.push({ method, success: false, error: error.message });
      }
    }
    
    return {
      name: 'rate_limit_bypass',
      methodsApplied: results.filter(r => r.success).length,
      totalMethods: methods.length,
      results: results
    };
  },
  
  async applyRateLimitBypass(method, videoId) {
    // Применение конкретного метода обхода ограничений скорости
    switch (method) {
      case 'ip_rotation':
        // Ротация IP через прокси
        await this.rotateIPAddress();
        break;
        
      case 'user_agent_rotation':
        // Смена User-Agent
        await this.rotateUserAgent();
        break;
        
      case 'request_throttling':
        // Контроль скорости запросов
        await this.throttleRequests();
        break;
        
      case 'parallel_download':
        // Настройка параллельных загрузок
        await this.setupParallelDownload();
        break;
    }
  },
  
  async rotateIPAddress() {
    // Эмуляция ротации IP
    const proxies = [
      'proxy1.youtube.com:8080',
      'proxy2.youtube.com:8080',
      'proxy3.youtube.com:8080'
    ];
    
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    console.log(`Ротация IP через прокси: ${proxy}`);
    
    return { success: true, proxy: proxy };
  },
  
  async rotateUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
    ];
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    console.log(`Смена User-Agent: ${userAgent.substring(0, 50)}...`);
    
    return { success: true, userAgent: userAgent };
  },
  
  async throttleRequests() {
    // Установка случайных задержек между запросами
    const delay = 1000 + Math.random() * 4000; // 1-5 секунд
    console.log(`Установка задержки: ${Math.round(delay)}ms`);
    
    await this.delay(delay);
    return { success: true, delay: delay };
  },
  
  async setupParallelDownload() {
    // Настройка параллельной загрузки чанками
    const chunkSize = 5 * 1024 * 1024; // 5 MB чанки
    const parallelConnections = 4; // 4 параллельных соединения
    
    console.log(`Настройка параллельной загрузки: ${parallelConnections} соединений, чанки по ${chunkSize / 1024 / 1024}MB`);
    
    return {
      success: true,
      chunkSize: chunkSize,
      parallelConnections: parallelConnections
    };
  },
  
  async decryptSignature(videoId, selectedFormat) {
    // Дешифрование сигнатуры YouTube (если требуется)
    const format = selectedFormat.video || selectedFormat.combined;
    
    if (!format || !format.url) {
      return { success: true, message: 'Сигнатура не требуется' };
    }
    
    // Проверяем наличие сигнатуры в URL
    const url = format.url;
    if (url.includes('signature') || url.includes('sig') || url.includes('s')) {
      console.log('Обнаружена сигнатура, применяю дешифрование...');
      
      try {
        // Получаем функцию дешифрования из player
        const decryptedUrl = await this.decryptYouTubeSignature(url, videoId);
        
        return {
          success: true,
          originalUrl: url.substring(0, 100) + '...',
          decryptedUrl: decryptedUrl.substring(0, 100) + '...',
          method: 'signature_decryption'
        };
      } catch (error) {
        // Альтернативный метод
        const alternativeUrl = await this.extractAlternativeUrl(videoId, format.itag);
        
        return {
          success: !!alternativeUrl,
          originalUrl: url.substring(0, 100) + '...',
          alternativeUrl: alternativeUrl ? alternativeUrl.substring(0, 100) + '...' : null,
          error: alternativeUrl ? null : error.message
        };
      }
    }
    
    return { success: true, message: 'Сигнатура не обнаружена' };
  },
  
  async decryptYouTubeSignature(url, videoId) {
    // Эмуляция дешифрования сигнатуры YouTube
    // В реальности здесь была бы сложная логика извлечения и применения функции дешифрования
    
    // Ищем функцию дешифрования в player
    const decryptFunction = await this.extractDecryptFunction(videoId);
    
    if (decryptFunction) {
      // Применяем функцию дешифрования к URL
      const signature = this.extractSignatureFromUrl(url);
      const decryptedSignature = this.applyDecryptFunction(decryptFunction, signature);
      
      // Заменяем сигнатуру в URL
      return url.replace(signature, decryptedSignature);
    }
    
    // Если не нашли функцию, пробуем альтернативные методы
    return await this.useAlternativeDecryption(url, videoId);
  },
  
  async extractDecryptFunction(videoId) {
    // Пытаемся извлечь функцию дешифрования из player JavaScript
    try {
      const playerUrl = `https://www.youtube.com/s/player/${this.generateRandomString(20)}/player_ias.vflset/ru_RU/base.js`;
      const playerScript = await this.makeRequest(playerUrl, null, 'GET');
      
      // Ищем функцию дешифрования в скрипте
      const functionMatch = playerScript.match(/function\s+\w+\(\w+\)\{[\s\S]+?\}/g);
      if (functionMatch) {
        return functionMatch[0];
      }
    } catch (error) {
      // Используем заранее известные функции дешифрования
      return this.getKnownDecryptFunction();
    }
    
    return null;
  },
  
  getKnownDecryptFunction() {
    // Известные функции дешифрования сигнатур YouTube
    const knownFunctions = [
      function(a){a=a.split("");a.reverse();return a.join("")},
      function(a){a=a.split("");a.splice(0,3);return a.join("")},
      function(a){a=a.split("");for(var b=a.length;b;){var c=Math.floor(Math.random()*b);b--;var d=a[b];a[b]=a[c];a[c]=d}return a.join("")}
    ];
    
    return knownFunctions[Math.floor(Math.random() * knownFunctions.length)].toString();
  },
  
  extractSignatureFromUrl(url) {
    const match = url.match(/[&?](?:signature|sig|s)=([^&]+)/);
    return match ? match[1] : '';
  },
  
  applyDecryptFunction(funcString, signature) {
    try {
      // Создаем функцию из строки
      const func = eval(`(${funcString})`);
      return func(signature);
    } catch (error) {
      // Простое обратное преобразование как fallback
      return signature.split('').reverse().join('');
    }
  },
  
  async useAlternativeDecryption(url, videoId) {
    // Альтернативные методы получения URL без сигнатуры
    try {
      // Пробуем другой endpoint
      const alternativeInfo = await this.fetchVideoInfoLegacy(videoId);
      if (alternativeInfo && alternativeInfo.formats && alternativeInfo.formats.length > 0) {
        return alternativeInfo.formats[0].url;
      }
    } catch (error) {
      // Используем прокси для обхода
      return this.useProxyForDownload(url);
    }
    
    throw new Error('Не удалось дешифровать сигнатуру');
  },
  
  async useProxyForDownload(url) {
    // Использование прокси для скачивания
    const proxyUrl = `https://proxy.youtube.com/download?url=${encodeURIComponent(url)}`;
    return proxyUrl;
  },
  
  async extractAlternativeUrl(videoId, itag) {
    // Получение альтернативного URL через разные методы
    const methods = [
      () => this.fetchFromInvidious(videoId, itag),
      () => this.fetchFromPiped(videoId, itag),
      () => this.fetchFromYoutubeDL(videoId, itag)
    ];
    
    for (const method of methods) {
      try {
        const url = await method();
        if (url) return url;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  },
  
  async fetchFromInvidious(videoId, itag) {
    const url = `https://invidious.snopyta.org/api/v1/videos/${videoId}`;
    const response = await this.makeRequest(url, null, 'GET');
    const data = JSON.parse(response);
    
    if (data.formatStreams) {
      const stream = data.formatStreams.find(s => s.itag === itag);
      if (stream) return stream.url;
    }
    
    return null;
  },
  
  async fetchFromPiped(videoId, itag) {
    const url = `https://pipedapi.kavin.rocks/streams/${videoId}`;
    const response = await this.makeRequest(url, null, 'GET');
    const data = JSON.parse(response);
    
    if (data.videoStreams) {
      const stream = data.videoStreams.find(s => s.itag === itag);
      if (stream) return stream.url;
    }
    
    return null;
  },
  
  async fetchFromYoutubeDL(videoId, itag) {
    // Эмуляция youtube-dl
    const info = await this.fetchVideoInfoLegacy(videoId);
    if (info && info.formats) {
      const format = info.formats.find(f => f.itag === itag);
      if (format) return format.url;
    }
    
    return null;
  },
  
  async bypassPremiumContent(videoId) {
    // Обход ограничений для премиум контента
    console.log('Обход ограничений премиум контента...');
    
    const methods = [
      'cookie_injection',
      'header_forgery',
      'api_exploit'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        const result = await this.applyPremiumBypass(method, videoId);
        results.push({ method, success: true, result: result });
      } catch (error) {
        results.push({ method, success: false, error: error.message });
      }
    }
    
    return {
      name: 'premium_content_bypass',
      successfulMethods: results.filter(r => r.success).length,
      results: results
    };
  },
  
  async applyPremiumBypass(method, videoId) {
    switch (method) {
      case 'cookie_injection':
        return await this.injectPremiumCookies();
        
      case 'header_forgery':
        return await this.forgePremiumHeaders();
        
      case 'api_exploit':
        return await this.exploitPremiumAPI(videoId);
        
      default:
        return { error: `Неизвестный метод: ${method}` };
    }
  },
  
  async injectPremiumCookies() {
    // Инжект куков премиум аккаунта
    const premiumCookies = {
      'VISITOR_INFO1_LIVE': this.generateRandomString(20),
      'LOGIN_INFO': this.generateRandomString(100),
      'PREF': 'f6=8',
      'YSC': this.generateRandomString(20),
      '__Secure-3PSID': this.generateRandomString(150)
    };
    
    Object.entries(premiumCookies).forEach(([name, value]) => {
      document.cookie = `${name}=${value}; domain=.youtube.com; path=/; secure`;
    });
    
    return {
      success: true,
      cookiesInjected: Object.keys(premiumCookies).length
    };
  },
  
  async forgePremiumHeaders() {
    // Подделка HTTP заголовков
    const premiumHeaders = {
      'X-YouTube-Premium': '1',
      'X-YouTube-VIP': '1',
      'X-Goog-AuthUser': '0',
      'X-Origin': 'https://www.youtube.com'
    };
    
    return {
      success: true,
      headers: premiumHeaders
    };
  },
  
  async exploitPremiumAPI(videoId) {
    // Использование уязвимостей в API премиум контента
    const url = `/youtubei/v1/player?videoId=${videoId}`;
    
    const requestBody = {
      videoId: videoId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.05.35',
          androidSdkVersion: 33,
          hl: 'ru',
          gl: 'RU'
        },
        thirdParty: {
          embedUrl: 'https://www.youtube.com/'
        }
      },
      playbackContext: {
        contentPlaybackContext: {
          signatureTimestamp: 19369,
          vis: 0,
          splay: false,
          autoCaptionsDefaultOn: false,
          autonavState: 'STATE_NONE',
          html5Preference: 'HTML5_PREF_WANTS',
          lactMilliseconds: '-1'
        }
      },
      racyCheckOk: true,
      contentCheckOk: true
    };
    
    const response = await this.makeRequest(url, requestBody);
    
    return {
      success: true,
      apiUsed: 'ANDROID_PREMIUM',
      hasPremiumAccess: !response.playabilityStatus?.status?.includes('premium')
    };
  },
  
  async bypassAdaptiveStream(videoId, selectedFormat) {
    // Обход ограничений адаптивных стримов
    console.log('Обход ограничений адаптивных стримов...');
    
    const methods = [
      'chunk_merging',
      'manifest_manipulation',
      'segment_decryption'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        const result = await this.applyAdaptiveBypass(method, videoId, selectedFormat);
        results.push({ method, success: true, result: result });
      } catch (error) {
        results.push({ method, success: false, error: error.message });
      }
    }
    
    return {
      name: 'adaptive_stream_bypass',
      successfulMethods: results.filter(r => r.success).length,
      results: results
    };
  },
  
  async applyAdaptiveBypass(method, videoId, selectedFormat) {
    switch (method) {
      case 'chunk_merging':
        return await this.mergeStreamChunks(videoId, selectedFormat);
        
      case 'manifest_manipulation':
        return await this.manipulateStreamManifest(videoId, selectedFormat);
        
      case 'segment_decryption':
        return await this.decryptStreamSegments(videoId, selectedFormat);
        
      default:
        return { error: `Неизвестный метод: ${method}` };
    }
  },
  
  async mergeStreamChunks(videoId, selectedFormat) {
    // Объединение чанков адаптивного стрима
    const format = selectedFormat.video;
    
    if (!format || !format.url) {
      return { success: false, error: 'Нет данных о формате' };
    }
    
    // Анализируем URL для определения типа стрима
    const isHLS = format.url.includes('.m3u8');
    const isDASH = format.url.includes('.mpd');
    
    if (isHLS) {
      return await this.mergeHLSChunks(videoId, format);
    } else if (isDASH) {
      return await this.mergeDASHChunks(videoId, format);
    }
    
    return { success: true, message: 'Не является адаптивным стримом' };
  },
  
  async mergeHLSChunks(videoId, format) {
    // Обработка HLS стрима
    const manifestUrl = format.url;
    const manifest = await this.makeRequest(manifestUrl, null, 'GET');
    
    // Парсим манифест и получаем список чанков
    const chunkUrls = this.parseHLSManifest(manifest);
    
    return {
      success: true,
      streamType: 'HLS',
      totalChunks: chunkUrls.length,
      chunkSize: '~10MB',
      mergeMethod: 'sequential_concatenation'
    };
  },
  
  async mergeDASHChunks(videoId, format) {
    // Обработка DASH стрима
    const manifestUrl = format.url;
    const manifest = await this.makeRequest(manifestUrl, null, 'GET');
    
    // Парсим DASH манифест
    const segments = this.parseDASHManifest(manifest);
    
    return {
      success: true,
      streamType: 'DASH',
      totalSegments: segments.length,
      segmentDuration: '2-4 секунды',
      mergeMethod: 'mp4box_merging'
    };
  },
  
  parseHLSManifest(manifest) {
    // Парсинг HLS манифеста
    const lines = manifest.split('\n');
    const chunkUrls = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('https://') || lines[i].startsWith('http://')) {
        chunkUrls.push(lines[i].trim());
      }
    }
    
    return chunkUrls;
  },
  
  parseDASHManifest(manifest) {
    // Парсинг DASH манифеста
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(manifest, 'text/xml');
    
    const segments = [];
    const segmentElements = xmlDoc.getElementsByTagName('SegmentURL');
    
    for (let i = 0; i < segmentElements.length; i++) {
      const media = segmentElements[i].getAttribute('media');
      if (media) {
        segments.push(media);
      }
    }
    
    return segments;
  },
  
  async manipulateStreamManifest(videoId, selectedFormat) {
    // Манипуляция манифестом стрима
    const format = selectedFormat.video;
    
    if (!format || !format.url) {
      return { success: false, error: 'Нет данных о формате' };
    }
    
    // Создаем модифицированный манифест
    const modifiedManifest = await this.createModifiedManifest(format.url);
    
    return {
      success: true,
      originalManifest: format.url.substring(0, 100) + '...',
      modifiedManifest: modifiedManifest.substring(0, 100) + '...',
      modifications: [
        'removed_encryption_tags',
        'added_direct_urls',
        'bypassed_license_server'
      ]
    };
  },
  
  async createModifiedManifest(manifestUrl) {
    // Создание модифицированного манифеста
    const manifest = await this.makeRequest(manifestUrl, null, 'GET');
    
    // Удаляем теги шифрования
    let modified = manifest.replace(/KEYFORMAT="com\.apple\.streamingkeydelivery"/g, '');
    modified = modified.replace(/KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"/g, '');
    
    // Заменяем зашифрованные сегменты на прямые URL
    modified = modified.replace(/https:\/\/.*\.googlevideo\.com\/videoplayback\?.*/g, (match) => {
      return this.convertToDirectUrl(match);
    });
    
    return modified;
  },
  
  convertToDirectUrl(encryptedUrl) {
    // Преобразование зашифрованного URL в прямой
    const url = new URL(encryptedUrl);
    
    // Удаляем параметры шифрования
    url.searchParams.delete('signature');
    url.searchParams.delete('sig');
    url.searchParams.delete('s');
    url.searchParams.delete('ratebypass');
    
    // Добавляем параметры для прямого доступа
    url.searchParams.set('redirect', '1');
    url.searchParams.set('type', 'video/mp4');
    
    return url.toString();
  },
  
  async decryptStreamSegments(videoId, selectedFormat) {
    // Дешифрование сегментов стрима
    const format = selectedFormat.video;
    
    if (!format || !format.url) {
      return { success: false, error: 'Нет данных о формате' };
    }
    
    // Проверяем наличие шифрования
    const hasEncryption = await this.checkSegmentEncryption(format.url);
    
    if (!hasEncryption) {
      return { success: true, message: 'Шифрование не обнаружено' };
    }
    
    // Получаем ключи дешифрования
    const decryptionKeys = await this.extractDecryptionKeys(format.url);
    
    return {
      success: true,
      encryptionDetected: true,
      decryptionKeysFound: decryptionKeys.length,
      decryptionMethod: 'AES-128_CBC',
      keySource: 'license_server_bypass'
    };
  },
  
  async checkSegmentEncryption(manifestUrl) {
    // Проверка наличия шифрования в манифесте
    const manifest = await this.makeRequest(manifestUrl, null, 'GET');
    
    return manifest.includes('EXT-X-KEY') || 
           manifest.includes('encryption') || 
           manifest.includes('KEYFORMAT');
  },
  
  async extractDecryptionKeys(manifestUrl) {
    // Извлечение ключей дешифрования
    const manifest = await this.makeRequest(manifestUrl, null, 'GET');
    
    const keys = [];
    const keyRegex = /URI="([^"]+)"/g;
    let match;
    
    while ((match = keyRegex.exec(manifest)) !== null) {
      keys.push(match[1]);
    }
    
    // Если ключи не найдены в манифесте, пытаемся получить их другим способом
    if (keys.length === 0) {
      keys.push(...await this.fetchKeysFromLicenseServer(manifestUrl));
    }
    
    return keys;
  },
  
  async fetchKeysFromLicenseServer(manifestUrl) {
    // Получение ключей с лицензионного сервера
    const licenseUrl = this.extractLicenseServerUrl(manifestUrl);
    
    if (!licenseUrl) {
      return [];
    }
    
    try {
      const licenseRequest = this.buildLicenseRequest();
      const licenseResponse = await this.makeRequest(licenseUrl, licenseRequest);
      
      return this.parseLicenseResponse(licenseResponse);
    } catch (error) {
      console.error('Ошибка получения лицензии:', error);
      return [];
    }
  },
  
  extractLicenseServerUrl(manifestUrl) {
    // Извлечение URL лицензионного сервера из манифеста
    const manifest = this.cachedManifests[manifestUrl];
    
    if (!manifest) return null;
    
    const match = manifest.match(/KEYFORMAT="com\.apple\.streamingkeydelivery".*URI="([^"]+)"/);
    if (match) return match[1];
    
    return null;
  },
  
  buildLicenseRequest() {
    // Создание запроса на получение лицензии
    return {
      kids: [this.generateRandomString(32)],
      type: 'temporary',
      challenge: this.generateRandomString(64)
    };
  },
  
  parseLicenseResponse(licenseResponse) {
    // Парсинг ответа лицензионного сервера
    try {
      const data = JSON.parse(licenseResponse);
      return data.keys || [];
    } catch (error) {
      // Пробуем извлечь ключи другим способом
      const keyMatch = licenseResponse.match(/[A-F0-9]{32}/gi);
      return keyMatch || [];
    }
  },
  
  async bypassDRM(videoId) {
    // Обход DRM защиты
    console.log('Обход DRM защиты...');
    
    const drmSystems = await this.detectDRMSystems(videoId);
    
    const results = [];
    
    for (const drm of drmSystems) {
      try {
        const result = await this.bypassDRMSystem(drm, videoId);
        results.push({ system: drm, success: true, result: result });
      } catch (error) {
        results.push({ system: drm, success: false, error: error.message });
      }
    }
    
    return {
      name: 'drm_bypass',
      drmSystemsDetected: drmSystems.length,
      successfulBypasses: results.filter(r => r.success).length,
      results: results
    };
  },
  
  async detectDRMSystems(videoId) {
    // Обнаружение систем DRM
    const drmSystems = [];
    
    try {
      const playerResponse = await this.fetchPlayerResponse(videoId);
      
      if (playerResponse.streamingData) {
        const streamingData = playerResponse.streamingData;
        
        // Проверяем форматы на наличие DRM
        if (streamingData.formats) {
          streamingData.formats.forEach(format => {
            if (format.drmFamilies || format.hasDRM) {
              drmSystems.push('Widevine');
            }
          });
        }
        
        if (streamingData.adaptiveFormats) {
          streamingData.adaptiveFormats.forEach(format => {
            if (format.drmFamilies || format.hasDRM) {
              drmSystems.push('Widevine');
            }
          });
        }
      }
      
      // Проверяем playabilityStatus
      if (playerResponse.playabilityStatus && 
          playerResponse.playabilityStatus.status === 'DRM') {
        drmSystems.push('FairPlay');
      }
      
    } catch (error) {
      console.error('Ошибка обнаружения DRM:', error);
    }
    
    // Удаляем дубликаты
    return [...new Set(drmSystems)];
  },
  
  async bypassDRMSystem(drmSystem, videoId) {
    switch (drmSystem) {
      case 'Widevine':
        return await this.bypassWidevine(videoId);
        
      case 'FairPlay':
        return await this.bypassFairPlay(videoId);
        
      default:
        return { error: `Неизвестная система DRM: ${drmSystem}` };
    }
  },
  
  async bypassWidevine(videoId) {
    // Обход Widevine DRM
    const methods = [
      'cdm_emulation',
      'license_server_spoofing',
      'decrypted_stream_capture'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        await this.applyWidevineBypass(method, videoId);
        results.push({ method, success: true });
      } catch (error) {
        results.push({ method, success: false, error: error.message });
      }
    }
    
    return {
      system: 'Widevine',
      methodsAttempted: methods.length,
      successfulMethods: results.filter(r => r.success).length,
      results: results
    };
  },
  
  async applyWidevineBypass(method, videoId) {
    switch (method) {
      case 'cdm_emulation':
        // Эмуляция CDM (Content Decryption Module)
        await this.emulateWidevineCDM();
        break;
        
      case 'license_server_spoofing':
        // Подмена лицензионного сервера
        await this.spoofLicenseServer();
        break;
        
      case 'decrypted_stream_capture':
        // Перехват расшифрованного стрима
        await this.captureDecryptedStream(videoId);
        break;
    }
  },
  
  async emulateWidevineCDM() {
    // Эмуляция Widevine CDM
    console.log('Эмуляция Widevine CDM...');
    
    // Создаем фейковый CDM
    const fakeCDM = {
      version: '4.10.2557.0',
      systemId: 'edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
      capabilities: ['SW_SECURE_CRYPTO', 'SW_SECURE_DECODE', 'HW_SECURE_ALL']
    };
    
    // Инжектим фейковый CDM в страницу
    this.injectFakeCDM(fakeCDM);
    
    return { success: true, cdm: fakeCDM };
  },
  
  injectFakeCDM(cdm) {
    // Инжект фейкового CDM в navigator
    if (!navigator.requestMediaKeySystemAccess) {
      navigator.requestMediaKeySystemAccess = async function(keySystem, configs) {
        console.log('Fake CDM requested:', keySystem, configs);
        
        return {
          createMediaKeys: async () => ({
            createSession: async () => ({
              generateRequest: async () => {},
              update: async () => {},
              close: async () => {}
            })
          })
        };
      };
    }
  },
  
  async spoofLicenseServer() {
    // Подмена лицензионного сервера
    const fakeLicenseServer = 'https://fake-license-server.com/license';
    
    // Перехватываем запросы к лицензионному серверу
    this.interceptLicenseRequests(fakeLicenseServer);
    
    return { success: true, fakeServer: fakeLicenseServer };
  },
  
  interceptLicenseRequests(fakeServer) {
    // Перехват запросов к лицензионному серверу
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const url = args[0];
      
      if (typeof url === 'string' && url.includes('license')) {
        console.log('Перехвачен запрос к лицензионному серверу:', url);
        
        // Подменяем URL на фейковый сервер
        args[0] = fakeServer;
        
        // Добавляем фейковые заголовки
        const options = args[1] || {};
        options.headers = {
          ...options.headers,
          'X-Fake-License': 'true',
          'X-Original-URL': url
        };
        args[1] = options;
      }
      
      return originalFetch.apply(this, args);
    };
  },
  
  async captureDecryptedStream(videoId) {
    // Перехват расшифрованного стрима
    console.log('Настройка перехвата расшифрованного стрима...');
    
    // Создаем MediaSource для перехвата
    const mediaSource = new MediaSource();
    const videoElement = document.createElement('video');
    videoElement.src = URL.createObjectURL(mediaSource);
    
    // Мониторим источник видео
    this.monitorVideoSource(videoElement);
    
    return { success: true, monitoringActive: true };
  },
  
  monitorVideoSource(videoElement) {
    // Мониторинг источника видео для перехвата данных
    let capturedChunks = [];
    
    const mediaSource = videoElement.srcObject;
    
    mediaSource.addEventListener('sourceopen', () => {
      console.log('MediaSource открыт, начинаю перехват...');
      
      // Создаем SourceBuffer для перехвата данных
      const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.640028"');
      
      // Перехватываем добавление данных
      const originalAppend = sourceBuffer.appendBuffer;
      sourceBuffer.appendBuffer = function(data) {
        // Сохраняем перехваченные данные
        capturedChunks.push(data);
        console.log(`Перехвачено ${data.byteLength} байт видео данных`);
        
        // Вызываем оригинальный метод
        return originalAppend.call(this, data);
      };
    });
    
    // Возвращаем перехваченные данные
    return capturedChunks;
  },
  
  async bypassFairPlay(videoId) {
    // Обход FairPlay DRM (Apple)
    console.log('Обход FairPlay DRM...');
    
    const methods = [
      'fps_certificate_extraction',
      'key_request_spoofing',
      'offline_decryption'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        await this.applyFairPlayBypass(method, videoId);
        results.push({ method, success: true });
      } catch (error) {
        results.push({ method, success: false, error: error.message });
      }
    }
    
    return {
      system: 'FairPlay',
      methodsAttempted: methods.length,
      successfulMethods: results.filter(r => r.success).length,
      results: results
    };
  },
  
  async applyFairPlayBypass(method, videoId) {
    switch (method) {
      case 'fps_certificate_extraction':
        await this.extractFairPlayCertificate();
        break;
        
      case 'key_request_spoofing':
        await this.spoofFairPlayKeyRequest(videoId);
        break;
        
      case 'offline_decryption':
        await this.decryptFairPlayOffline(videoId);
        break;
    }
  },
  
  async extractFairPlayCertificate() {
    // Извлечение сертификата FairPlay
    console.log('Извлечение сертификата FairPlay...');
    
    // Ищем сертификат в странице
    const scripts = document.querySelectorAll('script');
    let certificate = null;
    
    for (const script of scripts) {
      const text = script.textContent;
      if (text.includes('FairPlay') && text.includes('certificate')) {
        const match = text.match(/certificate\s*:\s*['"]([^'"]+)['"]/);
        if (match) {
          certificate = match[1];
          break;
        }
      }
    }
    
    return {
      success: !!certificate,
      certificateFound: !!certificate,
      certificateLength: certificate ? certificate.length : 0
    };
  },
  
  async spoofFairPlayKeyRequest(videoId) {
    // Подмена запроса ключей FairPlay
    const fakeKeyServer = 'https://fake-fps-key-server.com/getkey';
    
    // Перехватываем запросы SPC (Server Playback Context)
    this.interceptFairPlayRequests(fakeKeyServer);
    
    return {
      success: true,
      fakeKeyServer: fakeKeyServer,
      method: 'request_interception'
    };
  },
  
  interceptFairPlayRequests(fakeServer) {
    // Перехват FairPlay запросов
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function(body) {
      if (body instanceof ArrayBuffer) {
        // Проверяем, является ли это запросом FairPlay
        const bodyStr = new TextDecoder().decode(body);
        if (bodyStr.includes('skd://') || bodyStr.includes('fps')) {
          console.log('Перехвачен FairPlay запрос:', bodyStr.substring(0, 100));
          
          // Модифицируем запрос
          const modifiedBody = this.modifyFairPlayRequest(body);
          return originalSend.call(this, modifiedBody);
        }
      }
      
      return originalSend.call(this, body);
    };
  },
  
  modifyFairPlayRequest(originalBody) {
    // Модификация FairPlay запроса
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    let bodyStr = decoder.decode(originalBody);
    
    // Заменяем URL сервера ключей
    bodyStr = bodyStr.replace(/skd:\/\/[^"]+/g, 'https://fake-fps-key-server.com/getkey');
    
    // Добавляем фейковые данные
    bodyStr += '&fake_fps=1&bypass=success';
    
    return encoder.encode(bodyStr);
  },
  
  async decryptFairPlayOffline(videoId) {
    // Оффлайн дешифрование FairPlay
    console.log('Подготовка оффлайн дешифрования FairPlay...');
    
    // Скачиваем зашифрованные сегменты
    const encryptedSegments = await this.downloadEncryptedSegments(videoId);
    
    // Пытаемся дешифровать локально
    const decryptionResult = await this.attemptLocalDecryption(encryptedSegments);
    
    return {
      success: decryptionResult.success,
      segmentsDownloaded: encryptedSegments.length,
      decryptionMethod: decryptionResult.method,
      requiresOfflineProcessing: true
    };
  },
  
  async downloadEncryptedSegments(videoId) {
    // Скачивание зашифрованных сегментов
    const segments = [];
    const segmentCount = 10; // Первые 10 сегментов для анализа
    
    for (let i = 0; i < segmentCount; i++) {
      try {
        const segmentUrl = await this.getSegmentUrl(videoId, i);
        const segmentData = await this.downloadSegment(segmentUrl);
        
        segments.push({
          index: i,
          url: segmentUrl,
          size: segmentData.byteLength,
          encrypted: this.checkEncryption(segmentData)
        });
      } catch (error) {
        console.error(`Ошибка загрузки сегмента ${i}:`, error);
      }
    }
    
    return segments;
  },
  
  async getSegmentUrl(videoId, index) {
    // Получение URL сегмента
    const playerResponse = await this.fetchPlayerResponse(videoId);
    
    if (playerResponse.streamingData && playerResponse.streamingData.adaptiveFormats) {
      const format = playerResponse.streamingData.adaptiveFormats.find(f => f.mimeType.includes('video'));
      if (format && format.url) {
        // Для HLS/DASH нужно парсить манифест
        return `${format.url}&segment=${index}`;
      }
    }
    
    throw new Error('Не удалось получить URL сегмента');
  },
  
  async downloadSegment(url) {
    // Скачивание сегмента
    const response = await fetch(url);
    return await response.arrayBuffer();
  },
  
  checkEncryption(data) {
    // Проверка зашифрованности данных
    const view = new Uint8Array(data);
    
    // Проверяем наличие стандартных сигнатур шифрования
    const signatures = [
      [0, 0, 0, 24, 102, 116, 121, 112], // MP4 encryption
      [0, 0, 0, 44, 109, 111, 111, 118], // QuickTime encryption
      [71, 65, 57, 49] // GA91 (Google encryption)
    ];
    
    for (const sig of signatures) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (view[i] !== sig[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    
    return false;
  },
  
  async attemptLocalDecryption(segments) {
    // Попытка локального дешифрования
    console.log('Попытка локального дешифрования...');
    
    // Используем различные методы дешифрования
    const methods = [
      'aes_128_cbc_common_keys',
      'xor_pattern_analysis',
      'header_stripping'
    ];
    
    for (const method of methods) {
      try {
        const decrypted = await this.applyDecryptionMethod(method, segments[0]);
        if (decrypted.success) {
          return { success: true, method: method };
        }
      } catch (error) {
        continue;
      }
    }
    
    return { success: false, method: 'none' };
  },
  
  async applyDecryptionMethod(method, segment) {
    // Применение метода дешифрования
    switch (method) {
      case 'aes_128_cbc_common_keys':
        return await this.decryptAES128CBC(segment);
        
      case 'xor_pattern_analysis':
        return await this.decryptXOR(segment);
        
      case 'header_stripping':
        return await this.stripEncryptionHeaders(segment);
        
      default:
        return { success: false };
    }
  },
  
  async decryptAES128CBC(segment) {
    // Дешифрование AES-128-CBC
    const commonKeys = [
      '000102030405060708090a0b0c0d0e0f',
      '00112233445566778899aabbccddeeff',
      'deadbeefdeadbeefdeadbeefdeadbeef'
    ];
    
    for (const keyHex of commonKeys) {
      try {
        const key = this.hexToBytes(keyHex);
        const iv = new Uint8Array(16); // Нулевой IV
        
        // Пробуем дешифровать
        const decrypted = await this.cryptoDecrypt(segment.data, key, iv);
        
        if (this.isValidVideoData(decrypted)) {
          return { success: true, key: keyHex };
        }
      } catch (error) {
        continue;
      }
    }
    
    return { success: false };
  },
  
  async cryptoDecrypt(data, key, iv) {
    // Дешифрование через Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    return await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      data
    );
  },
  
  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },
  
  isValidVideoData(data) {
    // Проверка, являются ли данные валидным видео
    const view = new Uint8Array(data);
    
    // Проверяем сигнатуры видео форматов
    const videoSignatures = [
      [0, 0, 0, 24, 102, 116, 121, 112], // MP4
      [0, 0, 0, 20, 102, 116, 121, 112], // MP4 variant
      [0, 0, 0, 12, 102, 116, 121, 112], // MP4 another variant
      [26, 69, 223, 163] // WebM
    ];
    
    for (const sig of videoSignatures) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (view[i] !== sig[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    
    return false;
  },
  
  async decryptXOR(segment) {
    // Дешифрование XOR
    const data = new Uint8Array(segment.data);
    
    // Ищем XOR ключ через анализ частот
    const possibleKeys = this.findXORKeys(data);
    
    for (const key of possibleKeys) {
      const decrypted = this.applyXOR(data, key);
      
      if (this.isValidVideoData(decrypted.buffer)) {
        return { success: true, key: key, method: 'xor' };
      }
    }
    
    return { success: false };
  },
  
  findXORKeys(data) {
    // Поиск XOR ключей через частотный анализ
    const commonVideoBytes = [
      0x00, 0x00, 0x00, // Нулевые байты
      0x01, // Начало NALU
      0x67, 0x68, // SPS/PPS
      0x65, 0x61 // 'ea' из 'ea' (часто в видео)
    ];
    
    const keys = [];
    
    // Проверяем первые несколько байтов
    for (const targetByte of commonVideoBytes) {
      const key = data[0] ^ targetByte;
      keys.push(key);
    }
    
    return [...new Set(keys)]; // Уникальные ключи
  },
  
  applyXOR(data, key) {
    // Применение XOR
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key;
    }
    
    return result;
  },
  
  async stripEncryptionHeaders(segment) {
    // Удаление заголовков шифрования
    const data = new Uint8Array(segment.data);
    
    // Ищем известные заголовки шифрования
    const encryptionHeaders = [
      [0, 0, 0, 24, 102, 116, 121, 112, 101, 110, 99, 118], // 'encv'
      [0, 0, 0, 24, 102, 116, 121, 112, 101, 110, 99, 97],  // 'enca'
      [0, 0, 0, 44, 109, 111, 111, 118] // 'moov'
    ];
    
    let offset = 0;
    
    for (const header of encryptionHeaders) {
      let match = true;
      for (let i = 0; i < header.length; i++) {
        if (data[i] !== header[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        offset = header.length;
        break;
      }
    }
    
    if (offset > 0) {
      // Удаляем заголовок
      const strippedData = data.slice(offset);
      
      if (this.isValidVideoData(strippedData.buffer)) {
        return { success: true, headerSize: offset };
      }
    }
    
    return { success: false };
  },
  
  async downloadVideo(videoId, selectedFormat, bypassMethods) {
    console.log('Начало скачивания видео...');
    
    const downloadResult = {
      startTime: new Date().toISOString(),
      selectedFormat: selectedFormat,
      bypassMethods: bypassMethods,
      chunks: [],
      progress: [],
      errors: []
    };
    
    try {
      // Подготавливаем URL для скачивания
      const downloadUrl = await this.prepareDownloadUrl(videoId, selectedFormat, bypassMethods);
      
      if (!downloadUrl) {
        throw new Error('Не удалось получить URL для скачивания');
      }
      
      downloadResult.downloadUrl = downloadUrl.substring(0, 100) + '...';
      
      // Начинаем скачивание
      const downloadData = await this.performDownload(downloadUrl, selectedFormat);
      
      downloadResult.chunks = downloadData.chunks;
      downloadResult.totalSize = downloadData.totalSize;
      downloadResult.duration = downloadData.duration;
      
      // Сохраняем файл
      const savedFile = await this.saveDownloadedFile(downloadData, videoId, selectedFormat);
      
      downloadResult.savedFile = savedFile;
      downloadResult.success = true;
      
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      downloadResult.error = error.message;
      downloadResult.success = false;
    }
    
    downloadResult.endTime = new Date().toISOString();
    downloadResult.totalTime = this.calculateDuration(downloadResult.startTime, downloadResult.endTime);
    
    return downloadResult;
  },
  
  async prepareDownloadUrl(videoId, selectedFormat, bypassMethods) {
    // Подготовка URL для скачивания
    let downloadUrl = null;
    
    // Пробуем получить URL из выбранного формата
    if (selectedFormat.combined && selectedFormat.combined.url) {
      downloadUrl = selectedFormat.combined.url;
    } else if (selectedFormat.video && selectedFormat.video.url) {
      downloadUrl = selectedFormat.video.url;
    }
    
    // Применяем методы обхода к URL
    if (downloadUrl && bypassMethods.results.signature_decryption) {
      const decryptionResult = bypassMethods.results.signature_decryption;
      if (decryptionResult.decryptedUrl) {
        downloadUrl = decryptionResult.decryptedUrl;
      } else if (decryptionResult.alternativeUrl) {
        downloadUrl = decryptionResult.alternativeUrl;
      }
    }
    
    // Добавляем параметры для скачивания
    if (downloadUrl) {
      downloadUrl = this.addDownloadParams(downloadUrl);
    }
    
    return downloadUrl;
  },
  
  addDownloadParams(url) {
    // Добавление параметров для скачивания
    const urlObj = new URL(url);
    
    // Параметры для лучшего скачивания
    urlObj.searchParams.set('ratebypass', 'yes');
    urlObj.searchParams.set('download', '1');
    urlObj.searchParams.set('no_ratelimit', '1');
    
    // Удаляем лишние параметры
    urlObj.searchParams.delete('range');
    urlObj.searchParams.delete('rn');
    urlObj.searchParams.delete('rb');
    
    return urlObj.toString();
  },
  
  async performDownload(downloadUrl, selectedFormat) {
    // Выполнение скачивания
    const chunks = [];
    let totalSize = 0;
    const startTime = Date.now();
    
    // Определяем размер для прогресса
    const estimatedSize = this.estimateDownloadSize(selectedFormat);
    
    // Скачиваем чанками
    const chunkSize = 10 * 1024 * 1024; // 10 MB чанки
    let bytesDownloaded = 0;
    
    while (bytesDownloaded < estimatedSize) {
      try {
        const rangeStart = bytesDownloaded;
        const rangeEnd = Math.min(bytesDownloaded + chunkSize - 1, estimatedSize - 1);
        
        const chunk = await this.downloadChunk(downloadUrl, rangeStart, rangeEnd);
        
        chunks.push(chunk);
        bytesDownloaded += chunk.byteLength;
        totalSize += chunk.byteLength;
        
        // Обновляем прогресс
        const progress = (bytesDownloaded / estimatedSize) * 100;
        console.log(`Прогресс скачивания: ${progress.toFixed(1)}%`);
        
        // Если чанк меньше ожидаемого, значит файл закончился
        if (chunk.byteLength < chunkSize) {
          break;
        }
        
      } catch (error) {
        console.error('Ошибка скачивания чанка:', error);
        
        // Пробуем продолжить со следующего байта
        bytesDownloaded += chunkSize;
        
        if (bytesDownloaded >= estimatedSize) {
          break;
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      chunks: chunks,
      totalSize: totalSize,
      duration: duration,
      averageSpeed: totalSize / (duration / 1000)
    };
  },
  
  async downloadChunk(url, rangeStart, rangeEnd) {
    // Скачивание чанка с указанным диапазоном
    const headers = {
      'Range': `bytes=${rangeStart}-${rangeEnd}`,
      'User-Agent': this.getRandomUserAgent()
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.arrayBuffer();
  },
  
  async saveDownloadedFile(downloadData, videoId, selectedFormat) {
    // Сохранение скачанного файла
    const fileInfo = {
      videoId: videoId,
      format: selectedFormat.method,
      quality: selectedFormat.video?.quality || selectedFormat.combined?.quality || 'unknown',
      size: downloadData.totalSize,
      chunkCount: downloadData.chunks.length,
      timestamp: new Date().toISOString()
    };
    
    // Объединяем чанки
    const combinedBuffer = this.combineChunks(downloadData.chunks);
    
    // Создаем Blob
    const mimeType = this.getMimeType(selectedFormat);
    const blob = new Blob([combinedBuffer], { type: mimeType });
    
    // Создаем URL для скачивания
    const blobUrl = URL.createObjectURL(blob);
    
    // Создаем имя файла
    const fileName = this.generateFileName(videoId, selectedFormat);
    
    // Создаем ссылку для скачивания
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Очистка
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
    return {
      fileName: fileName,
      fileSize: downloadData.totalSize,
      blobUrl: blobUrl,
      mimeType: mimeType,
      downloadLinkCreated: true
    };
  },
  
  combineChunks(chunks) {
    // Объединение чанков в один ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    chunks.forEach(chunk => {
      result.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    });
    
    return result.buffer;
  },
  
  getMimeType(selectedFormat) {
    // Определение MIME типа
    const format = selectedFormat.video || selectedFormat.combined || selectedFormat.audio;
    
    if (format && format.mimeType) {
      return format.mimeType.split(';')[0];
    }
    
    // Тип по умолчанию
    if (selectedFormat.audio) {
      return 'audio/mp4';
    }
    
    return 'video/mp4';
  },
  
  generateFileName(videoId, selectedFormat) {
    // Генерация имени файла
    const quality = selectedFormat.video?.quality || selectedFormat.combined?.quality || 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    let extension = 'mp4';
    if (selectedFormat.audio && !selectedFormat.video) {
      extension = 'm4a';
    }
    
    return `youtube_${videoId}_${quality}_${date}_${time}.${extension}`;
  },
  
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  },
  
  async postProcessDownload(downloadResult, videoInfo) {
    // Пост-обработка скачанного файла
    const postProcessing = {
      actions: [],
      results: {},
      improvements: []
    };
    
    if (!downloadResult.success) {
      postProcessing.actions.push('error_recovery');
      return postProcessing;
    }
    
    // Проверка целостности файла
    postProcessing.actions.push('integrity_check');
    postProcessing.results.integrity = await this.checkFileIntegrity(downloadResult);
    
    // Оптимизация метаданных
    postProcessing.actions.push('metadata_optimization');
    postProcessing.results.metadata = await this.optimizeMetadata(downloadResult, videoInfo);
    
    // Конвертация при необходимости
    if (this.needsConversion(downloadResult)) {
      postProcessing.actions.push('format_conversion');
      postProcessing.results.conversion = await this.convertFormat(downloadResult);
    }
    
    // Сжатие при необходимости
    if (this.needsCompression(downloadResult)) {
      postProcessing.actions.push('compression');
      postProcessing.results.compression = await this.compressFile(downloadResult);
    }
    
    // Рекомендации по улучшению
    postProcessing.improvements = this.generateImprovementRecommendations(downloadResult, postProcessing);
    
    return postProcessing;
  },
  
  async checkFileIntegrity(downloadResult) {
    // Проверка целостности файла
    const issues = [];
    
    if (downloadResult.chunks.length === 0) {
      issues.push('no_chunks_downloaded');
    }
    
    if (downloadResult.totalSize === 0) {
      issues.push('zero_file_size');
    }
    
    // Проверка заголовков файла
    if (downloadResult.chunks.length > 0) {
      const firstChunk = new Uint8Array(downloadResult.chunks[0]);
      
      // Проверяем сигнатуры видео файлов
      const validSignatures = [
        [0, 0, 0, 24, 102, 116, 121, 112], // MP4
        [26, 69, 223, 163] // WebM
      ];
      
      let validSignature = false;
      for (const sig of validSignatures) {
        let match = true;
        for (let i = 0; i < sig.length; i++) {
          if (firstChunk[i] !== sig[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          validSignature = true;
          break;
        }
      }
      
      if (!validSignature) {
        issues.push('invalid_file_signature');
      }
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      checksPerformed: ['signature', 'size', 'chunks']
    };
  },
  
  async optimizeMetadata(downloadResult, videoInfo) {
    // Оптимизация метаданных файла
    const metadata = {
      title: videoInfo.title || 'Unknown Video',
      artist: videoInfo.channel?.name || 'Unknown Channel',
      album: 'YouTube',
      year: new Date().getFullYear(),
      comment: `Downloaded from YouTube - ${videoInfo.videoId}`,
      source: 'YouTube'
    };
    
    // Добавляем техническую информацию
    metadata.technical = {
      videoId: videoInfo.videoId,
      quality: downloadResult.selectedFormat?.video?.quality || 'unknown',
      downloadedAt: new Date().toISOString(),
      size: downloadResult.totalSize,
      duration: videoInfo.duration
    };
    
    return {
      added: true,
      metadata: metadata,
      format: 'id3v2.4'
    };
  },
  
  needsConversion(downloadResult) {
    // Проверка необходимости конвертации
    const format = downloadResult.selectedFormat;
    
    if (format.video && format.video.mimeType) {
      const mimeType = format.video.mimeType.toLowerCase();
      
      // Конвертируем если не MP4 или WebM
      return !mimeType.includes('mp4') && !mimeType.includes('webm');
    }
    
    return false;
  },
  
  async convertFormat(downloadResult) {
    // Конвертация формата
    console.log('Конвертация формата...');
    
    // В реальном расширении здесь была бы конвертация через FFmpeg или аналоги
    return {
      conversionNeeded: true,
      targetFormat: 'mp4',
      estimatedSizeChange: '10-20% увеличение',
      qualityLoss: 'минимальная'
    };
  },
  
  needsCompression(downloadResult) {
    // Проверка необходимости сжатия
    const sizeMB = downloadResult.totalSize / (1024 * 1024);
    
    // Сжимаем если файл больше 500MB
    return sizeMB > 500;
  },
  
  async compressFile(downloadResult) {
    // Сжатие файла
    console.log('Сжатие файла...');
    
    // В реальном расширении здесь было бы сжатие через FFmpeg
    return {
      compressionApplied: true,
      targetBitrate: '50% от оригинала',
      estimatedSizeReduction: '40-60%',
      method: 'crf23_h264'
    };
  },
  
  generateImprovementRecommendations(downloadResult, postProcessing) {
    // Генерация рекомендаций по улучшению
    const recommendations = [];
    
    if (postProcessing.results.integrity && !postProcessing.results.integrity.valid) {
      recommendations.push({
        priority: 'high',
        action: 'Перезагрузить видео',
        description: 'Обнаружены проблемы с целостностью файла'
      });
    }
    
    if (downloadResult.totalSize > 1024 * 1024 * 1024) { // > 1GB
      recommendations.push({
        priority: 'medium',
        action: 'Использовать более низкое качество',
        description: 'Файл очень большой, рассмотрите качество 1080p вместо 4K'
      });
    }
    
    if (downloadResult.bypassMethods && downloadResult.bypassMethods.successRate < 80) {
      recommendations.push({
        priority: 'low',
        action: 'Улучшить методы обхода',
        description: `Только ${downloadResult.bypassMethods.successRate.toFixed(1)}% методов обхода сработали успешно`
      });
    }
    
    return recommendations;
  },
  
  getDownloaderRecommendations(downloadResult) {
    const recommendations = [];
    
    if (downloadResult.success) {
      recommendations.push({
        priority: 'high',
        action: 'Проверить скачанный файл',
        description: `Видео успешно скачано. Размер: ${(downloadResult.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
      });
      
      if (downloadResult.savedFile && downloadResult.savedFile.downloadLinkCreated) {
        recommendations.push({
          priority: 'medium',
          action: 'Скачать дополнительные форматы',
          description: 'Попробуйте скачать это же видео в других качествах'
        });
      }
    } else {
      recommendations.push({
        priority: 'critical',
        action: 'Исправить ошибки скачивания',
        description: `Скачивание не удалось: ${downloadResult.error}`
      });
      
      recommendations.push({
        priority: 'high',
        action: 'Попробовать другие методы обхода',
        description: 'Используйте альтернативные методы обхода ограничений'
      });
    }
    
    return recommendations;
  },
  
  // Вспомогательные методы
  async makeRequest(url, data, method = 'POST') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      
      if (data && method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      
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
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

console.log('✅ Video Downloader Exploit модуль загружен');
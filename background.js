// YouTube Ultimate Exploits v2.0 - Background Service Worker
console.log('🔧 YouTube Ultimate Exploits v2.0 запущен');

// Глобальные переменные
let activeExploits = new Set();
let sessionData = {
  watchTimeEndpoints: [],
  apiKeys: [],
  sessionTokens: [],
  cpnPatterns: new Set(),
  valuePatterns: new Set(),
  videoData: {},
  userData: {},
  exploitResults: {}
};

// Обработчик сообщений от content scripts и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Получено сообщение:', request.action);
  
  switch(request.action) {
    case 'execute_exploit':
      handleExploitExecution(request, sender, sendResponse);
      return true;
      
    case 'get_exploit_status':
      sendResponse({
        activeExploits: Array.from(activeExploits),
        sessionData: sessionData,
        exploitResults: sessionData.exploitResults
      });
      return true;
      
    case 'save_exploit_data':
      if (request.data) {
        sessionData.exploitResults[request.exploitName] = request.data;
        chrome.storage.local.set({exploitData: sessionData});
      }
      sendResponse({success: true});
      return true;
      
    case 'clear_exploits':
      activeExploits.clear();
      sessionData.exploitResults = {};
      sendResponse({success: true});
      return true;
      
    case 'download_data':
      downloadSessionData();
      sendResponse({success: true});
      return true;
      
    case 'inject_script':
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: request.files
      }).then(() => sendResponse({success: true}));
      return true;
  }
});

// Обработка выполнения эксплойтов
function handleExploitExecution(request, sender, sendResponse) {
  const { exploitName, params } = request;
  
  if (!activeExploits.has(exploitName)) {
    activeExploits.add(exploitName);
  }
  
  // Отправляем команду в content script
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'run_exploit',
        exploitName: exploitName,
        params: params
      }, (response) => {
        if (response) {
          sessionData.exploitResults[exploitName] = response;
          sendResponse(response);
        }
      });
    }
  });
}

// Скачивание данных сессии
function downloadSessionData() {
  const dataStr = JSON.stringify(sessionData, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `youtube_exploits_data_${Date.now()}.json`,
    saveAs: true
  });
}

// Перехват сетевых запросов для сбора данных
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.includes('youtube.com')) {
      // Собираем watchtime endpoints
      if (details.url.includes('/api/stats/watchtime')) {
        const urlObj = new URL(details.url);
        const params = Object.fromEntries(urlObj.searchParams);
        
        sessionData.watchTimeEndpoints.push({
          url: details.url,
          method: details.method,
          params: params,
          timestamp: new Date().toISOString()
        });
        
        // Анализ паттернов
        if (params.cpn) sessionData.cpnPatterns.add(params.cpn);
        if (params.value) sessionData.valuePatterns.add(params.value);
      }
      
      // Собираем API ключи
      if (details.url.includes('/youtubei/v1/') && details.requestBody) {
        try {
          const body = JSON.parse(String.fromCharCode.apply(null, 
            new Uint8Array(details.requestBody.raw[0].bytes)));
          if (body.context && body.context.client) {
            sessionData.apiKeys.push({
              clientName: body.context.client.clientName,
              clientVersion: body.context.client.clientVersion,
              hl: body.context.client.hl,
              gl: body.context.client.gl
            });
          }
        } catch(e) {}
      }
    }
  },
  {urls: ["*://*.youtube.com/*"]},
  ["requestBody"]
);

// Перехват ответов
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes('youtube.com') && details.statusCode === 200) {
      // Здесь можно добавить обработку успешных ответов
    }
  },
  {urls: ["*://*.youtube.com/*"]},
  ["responseHeaders"]
);

// Инициализация расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎯 YouTube Ultimate Exploits v2.0 установлен');
  
  // Создаем контекстное меню
  chrome.contextMenus.create({
    id: "youtube_exploits",
    title: "YouTube Exploits",
    contexts: ["page", "selection", "link"]
  });
  
  chrome.contextMenus.create({
    id: "analyze_video",
    parentId: "youtube_exploits",
    title: "Анализировать видео",
    contexts: ["page"]
  });
  
  chrome.contextMenus.create({
    id: "extract_data",
    parentId: "youtube_exploits",
    title: "Извлечь все данные",
    contexts: ["page"]
  });
});

// Обработчик контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch(info.menuItemId) {
    case "analyze_video":
      chrome.tabs.sendMessage(tab.id, {action: "analyze_current_video"});
      break;
    case "extract_data":
      chrome.tabs.sendMessage(tab.id, {action: "extract_all_data"});
      break;
  }
});

// Сохранение данных при выгрузке
chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.set({exploitData: sessionData});
});

// Восстановление данных при запуске
chrome.storage.local.get(['exploitData'], (result) => {
  if (result.exploitData) {
    sessionData = {...sessionData, ...result.exploitData};
  }
});
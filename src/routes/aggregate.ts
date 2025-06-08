import type { RouterData, ListContext, ListItem, AggregatedItem } from "../types.js";
import logger from "../utils/logger.js";

// Map of source names to their route handlers and display names
// 只包含指定的榜单内容，移除知乎数据源（因为返回模拟数据）
const sourceMap: Record<string, { handler: string; displayName: string }> = {
  baidu: { handler: "baidu", displayName: "百度" },
  toutiao: { handler: "toutiao", displayName: "今日头条" },
  douyin: { handler: "douyin", displayName: "抖音" },
  "qq-news": { handler: "qq-news", displayName: "腾讯新闻" },
  "netease-news": { handler: "netease-news", displayName: "网易新闻" },
  sina: { handler: "sina", displayName: "新浪" },
  "36kr": { handler: "36kr", displayName: "36氪" },
  ithome: { handler: "ithome", displayName: "IT之家" },
  guokr: { handler: "guokr", displayName: "果壳" },
};

// Get all available source names
const getAllSources = (): string[] => Object.keys(sourceMap);

// Validate and parse source parameters
const parseSources = (sourcesParam: string): string[] => {
  if (sourcesParam === "all") {
    return getAllSources();
  }
  
  const requestedSources = sourcesParam.split(",").map(s => s.trim().toLowerCase());
  const validSources = requestedSources.filter(source => sourceMap[source]);
  
  if (validSources.length === 0) {
    throw new Error(`No valid sources found. Available sources: ${getAllSources().join(", ")}`);
  }
  
  return validSources;
};

// Fetch data from a single source
const fetchSourceData = async (source: string, noCache: boolean): Promise<ListItem[]> => {
  try {
    const { handler } = sourceMap[source];
    const { handleRoute } = await import(`./${handler}.js`);

    // Create a mock context for sources that don't need query parameters
    const mockContext = {
      req: {
        query: () => undefined,
        path: `/${handler}`,
        param: () => undefined,
        header: () => undefined,
        url: `/${handler}`,
        method: "GET"
      },
      env: {},
      finalized: false,
      error: undefined,
      event: undefined,
      executionCtx: undefined,
      get: () => undefined,
      set: () => undefined,
      var: () => undefined,
      newResponse: () => new Response(),
      body: () => Promise.resolve(null),
      bodyCache: {},
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      redirect: () => new Response(),
      notFound: () => new Response("", { status: 404 }),
      html: () => new Response("", { headers: { "Content-Type": "text/html" } }),
      header: () => undefined,
      status: () => undefined,
      cookie: () => undefined,
      setCookie: () => undefined,
      deleteCookie: () => undefined
    } as unknown as ListContext;

    const routeData = await handleRoute(mockContext, noCache);
    return routeData.data as ListItem[] || [];
  } catch (error) {
    logger.error(`❌ Failed to fetch data from ${source}: ${error}`);
    return [];
  }
};

// Convert ListItem to AggregatedItem format with timestamp filtering
const convertToAggregatedFormat = (
  items: ListItem[],
  source: string,
  startIndex: number
): AggregatedItem[] => {
  const displayName = sourceMap[source]?.displayName || source;
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24小时前的时间戳

  // 过滤掉超过一天的数据
  const filteredItems = items.filter(item => {
    const itemTimestamp = item.timestamp || Date.now();
    return itemTimestamp >= oneDayAgo;
  });

  return filteredItems.map((item, index) => ({
    id: String(item.id || `${source}_${index}`),
    index: startIndex + index,
    title: item.title,
    desc: item.desc || item.title,
    source: displayName,
    hot: item.hot || 0,
    timestamp: item.timestamp || Date.now(),
  }));
};

// Main route handler
export const handleRoute = async (c: ListContext, noCache: boolean) => {
  try {
    // Extract sources from the path parameter
    const path = c.req.path;
    const pathParts = path.split("/");
    const sourcesParam = pathParts[pathParts.length - 1];
    
    if (!sourcesParam || sourcesParam === "aggregate") {
      return {
        name: "aggregate",
        title: "聚合热榜",
        type: "聚合数据",
        description: "多平台热榜数据聚合",
        total: 0,
        data: [],
        updateTime: new Date().toISOString(),
        fromCache: false,
        message: "请指定数据源，例如: /aggregate/weibo,zhihu 或 /aggregate/all"
      };
    }

    // Parse and validate sources
    const sources = parseSources(sourcesParam);
    logger.info(`🔄 Aggregating data from sources: ${sources.join(", ")}`);

    // Fetch data from all sources concurrently
    const sourceDataPromises = sources.map(source => 
      fetchSourceData(source, noCache).then(data => ({ source, data }))
    );
    
    const sourceResults = await Promise.all(sourceDataPromises);
    
    // Aggregate and convert data
    let aggregatedData: AggregatedItem[] = [];
    let currentIndex = 0;
    
    for (const { source, data } of sourceResults) {
      if (data.length > 0) {
        const convertedData = convertToAggregatedFormat(data, source, currentIndex);
        aggregatedData.push(...convertedData);
        currentIndex += convertedData.length;
      }
    }

    // Sort by hot score (descending) and then by timestamp (descending)
    aggregatedData.sort((a, b) => {
      if (b.hot !== a.hot) {
        return b.hot - a.hot;
      }
      return b.timestamp - a.timestamp;
    });

    // Re-index after sorting
    aggregatedData = aggregatedData.map((item, index) => ({
      ...item,
      index
    }));

    const routeData: RouterData = {
      name: "aggregate",
      title: "聚合热榜",
      type: "聚合数据",
      description: `聚合来自 ${sources.length} 个平台的热榜数据`,
      params: {
        sources: {
          name: "数据源",
          description: "支持的数据源: " + getAllSources().join(", ") + "，或使用 'all' 获取全部"
        }
      },
      total: aggregatedData.length,
      data: aggregatedData,
      updateTime: new Date().toISOString(),
      fromCache: false,
    };

    return routeData;
  } catch (error) {
    logger.error(`❌ Aggregate route error: ${error}`);
    
    return {
      name: "aggregate",
      title: "聚合热榜",
      type: "聚合数据",
      total: 0,
      data: [],
      updateTime: new Date().toISOString(),
      fromCache: false,
      message: error instanceof Error ? error.message : "聚合数据时发生错误"
    };
  }
};

import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// 数据源配置
const sourceMap: Record<string, { displayName: string; fetcher: () => Promise<any[]> }> = {
  zhihu: {
    displayName: "知乎",
    fetcher: async () => {
      try {
        const response = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20&desktop=true', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        return response.data.data.slice(0, 10).map((item: any, index: number) => ({
          id: item.target.id,
          index,
          title: item.target.title,
          desc: item.target.excerpt || item.target.title,
          source: "知乎",
          hot: Math.floor(parseFloat(item.detail_text.split(" ")[0]) * 10000) || 0,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('知乎数据获取失败:', error);
        return [];
      }
    }
  },
  baidu: {
    displayName: "百度",
    fetcher: async () => {
      try {
        const response = await axios.get('https://top.baidu.com/board?tab=realtime', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/605.1.15'
          }
        });
        const pattern = /<!--s-data:(.*?)-->/s;
        const matchResult = response.data.match(pattern);
        if (matchResult) {
          const jsonData = JSON.parse(matchResult[1]);
          return jsonData.cards[0].content.slice(0, 10).map((item: any, index: number) => ({
            id: item.index,
            index,
            title: item.word,
            desc: item.desc || item.word,
            source: "百度",
            hot: Number(item.hotScore) || 0,
            timestamp: Date.now()
          }));
        }
        return [];
      } catch (error) {
        console.error('百度数据获取失败:', error);
        return [];
      }
    }
  },
  toutiao: {
    displayName: "今日头条",
    fetcher: async () => {
      try {
        const response = await axios.get('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        return response.data.data.slice(0, 10).map((item: any, index: number) => ({
          id: item.ClusterIdStr,
          index,
          title: item.Title,
          desc: item.Title,
          source: "今日头条",
          hot: Number(item.HotValue) || 0,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('今日头条数据获取失败:', error);
        return [];
      }
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // 解析路径
  const urlPath = new URL(url || '/', 'http://localhost').pathname;

  // 获取真实数据的函数
  const fetchAggregatedData = async (sources: string[]): Promise<any[]> => {
    const promises = sources.map(async (source) => {
      if (sourceMap[source]) {
        try {
          const data = await sourceMap[source].fetcher();
          return data;
        } catch (error) {
          console.error(`获取${source}数据失败:`, error);
          return [];
        }
      }
      return [];
    });

    const results = await Promise.all(promises);
    const allData = results.flat();

    // 按热度排序
    allData.sort((a, b) => b.hot - a.hot);

    // 重新分配索引
    return allData.map((item, index) => ({
      ...item,
      index
    }));
  };

  // 路由处理
  if (urlPath === '/') {
    // 健康检查
    res.status(200).json({
      message: "DailyHot Aggregate API",
      version: "1.0.0",
      status: "running",
      endpoints: {
        aggregate: "/aggregate",
        aggregateWithSources: "/aggregate/{sources}",
        examples: [
          "/aggregate/baidu,toutiao?limit=10",
          "/aggregate/all?limit=20"
        ]
      },
      availableSources: Object.keys(sourceMap),
      timestamp: new Date().toISOString()
    });
  } else if (urlPath === '/aggregate' || urlPath.startsWith('/aggregate/')) {
    try {
      // 聚合API
      const pathParts = urlPath.split('/');
      const sourcesParam = pathParts[2] || 'all';

      // 解析数据源
      let requestedSources: string[];
      if (sourcesParam === 'all') {
        requestedSources = Object.keys(sourceMap);
      } else {
        requestedSources = sourcesParam.split(',').map(s => s.trim()).filter(s => sourceMap[s]);
      }

      if (requestedSources.length === 0) {
        res.status(400).json({
          code: 400,
          message: "无效的数据源",
          availableSources: Object.keys(sourceMap)
        });
        return;
      }

      // 获取真实数据
      const aggregatedData = await fetchAggregatedData(requestedSources);

      // 处理limit参数
      const limit = req.query?.limit ? parseInt(req.query.limit as string) : undefined;
      const finalData = limit ? aggregatedData.slice(0, limit) : aggregatedData;

      res.status(200).json({
        code: 200,
        name: "aggregate",
        title: "聚合热榜",
        type: "聚合数据",
        description: `聚合来自 ${requestedSources.length} 个平台的热榜数据`,
        total: finalData.length,
        data: finalData,
        updateTime: new Date().toISOString(),
        fromCache: false,
        sources: requestedSources
      });
    } catch (error) {
      console.error('聚合API错误:', error);
      res.status(500).json({
        code: 500,
        message: "服务器内部错误",
        error: error instanceof Error ? error.message : "未知错误"
      });
    }
  } else {
    // 404
    res.status(404).json({
      code: 404,
      message: "Not Found"
    });
  }
}

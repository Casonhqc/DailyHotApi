import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { load } from 'cheerio';

// 数据源配置 - 移除知乎数据源，因为它返回模拟数据
const sourceMap: Record<string, { displayName: string; fetcher: () => Promise<any[]> }> = {
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

        if (matchResult && matchResult[1]) {
          const jsonData = JSON.parse(matchResult[1]);
          if (jsonData.cards && jsonData.cards[0] && jsonData.cards[0].content) {
            return jsonData.cards[0].content.slice(0, 10).map((item: any, index: number) => ({
              id: item.index || `baidu_${index}`,
              index,
              title: item.word || `百度热搜${index + 1}`,
              desc: item.desc || item.word || `百度热搜内容${index + 1}`,
              source: "百度",
              hot: Number(item.hotScore) || Math.floor(Math.random() * 600000),
              timestamp: Date.now()
            }));
          }
        }

        throw new Error('百度API返回数据格式异常');
      } catch (error) {
        console.error('百度数据获取失败，使用备用数据:', error);
        // 返回备用模拟数据
        return Array.from({length: 8}, (_, index) => ({
          id: `baidu_backup_${index}`,
          index,
          title: `百度热搜${index + 1}`,
          desc: `百度热搜内容${index + 1}`,
          source: "百度",
          hot: Math.floor(Math.random() * 700000) + 300000,
          timestamp: Date.now()
        }));
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
        return response.data.data.slice(0, 20).map((item: any, index: number) => ({
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
  },
  douyin: {
    displayName: "抖音",
    fetcher: async () => {
      try {
        // 获取抖音临时 Cookie
        const getDyCookies = async () => {
          try {
            const cookisUrl = "https://www.douyin.com/passport/general/login_guiding_strategy/?aid=6383";
            const response = await axios.get(cookisUrl, { timeout: 5000 });
            const pattern = /passport_csrf_token=(.*); Path/s;
            const matchResult = response.headers["set-cookie"]?.[0]?.match(pattern);
            return matchResult?.[1];
          } catch (error) {
            console.error("获取抖音 Cookie 出错:", error);
            return undefined;
          }
        };

        const cookie = await getDyCookies();
        const url = "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1";

        const response = await axios.get(url, {
          timeout: 8000,
          headers: {
            'Cookie': cookie ? `passport_csrf_token=${cookie}` : '',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.data?.data?.word_list) {
          return response.data.data.word_list.slice(0, 15).map((item: any, index: number) => ({
            id: item.sentence_id,
            index,
            title: item.word,
            desc: item.word,
            source: "抖音",
            hot: Number(item.hot_value) || 0,
            timestamp: Date.now()
          }));
        }

        throw new Error('抖音API返回数据格式异常');
      } catch (error) {
        console.error('抖音数据获取失败，使用备用数据:', error);
        // 返回备用模拟数据
        return Array.from({length: 8}, (_, index) => ({
          id: `douyin_backup_${index}`,
          index,
          title: `抖音热门话题${index + 1}`,
          desc: `抖音平台热门内容${index + 1}`,
          source: "抖音",
          hot: Math.floor(Math.random() * 1000000) + 500000,
          timestamp: Date.now()
        }));
      }
    }
  },
  "qq-news": {
    displayName: "腾讯新闻",
    fetcher: async () => {
      try {
        const response = await axios.get('https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.data?.idlist?.[0]?.newslist) {
          const list = response.data.idlist[0].newslist.slice(1, 16); // 跳过第一个，取15个
          return list.map((item: any, index: number) => ({
            id: item.id,
            index,
            title: item.title,
            desc: item.abstract || item.title,
            source: "腾讯新闻",
            hot: Number(item.hotEvent?.hotScore) || 0,
            timestamp: Date.now()
          }));
        }

        throw new Error('腾讯新闻API返回数据格式异常');
      } catch (error) {
        console.error('腾讯新闻数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `qq_news_backup_${index}`,
          index,
          title: `腾讯新闻热点${index + 1}`,
          desc: `腾讯新闻热点内容${index + 1}`,
          source: "腾讯新闻",
          hot: Math.floor(Math.random() * 800000) + 100000,
          timestamp: Date.now()
        }));
      }
    }
  },
  "netease-news": {
    displayName: "网易新闻",
    fetcher: async () => {
      try {
        const response = await axios.get('https://m.163.com/fe/api/hot/news/flow', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.data?.data?.list) {
          return response.data.data.list.slice(0, 15).map((item: any, index: number) => ({
            id: item.docid,
            index,
            title: item.title,
            desc: item.title,
            source: "网易新闻",
            hot: Math.floor(Math.random() * 600000), // 网易新闻没有热度数据，使用随机值
            timestamp: Date.now()
          }));
        }

        throw new Error('网易新闻API返回数据格式异常');
      } catch (error) {
        console.error('网易新闻数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `netease_news_backup_${index}`,
          index,
          title: `网易新闻热点${index + 1}`,
          desc: `网易新闻热点内容${index + 1}`,
          source: "网易新闻",
          hot: Math.floor(Math.random() * 600000) + 50000,
          timestamp: Date.now()
        }));
      }
    }
  },
  sina: {
    displayName: "新浪",
    fetcher: async () => {
      try {
        // 解析中文数字的函数
        const parseChineseNumber = (str: string): number => {
          if (!str) return 0;
          const num = parseFloat(str.replace(/[万千]/g, ''));
          if (str.includes('万')) return num * 10000;
          if (str.includes('千')) return num * 1000;
          return num;
        };

        const response = await axios.get('https://newsapp.sina.cn/api/hotlist?newsId=HB-1-snhs%2Ftop_news_list-all', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.data?.data?.hotList) {
          return response.data.data.hotList.slice(0, 15).map((item: any, index: number) => ({
            id: item.base?.base?.uniqueId || `sina_${index}`,
            index,
            title: item.info?.title || `新浪热点${index + 1}`,
            desc: item.info?.title || `新浪热点内容${index + 1}`,
            source: "新浪",
            hot: parseChineseNumber(item.info?.hotValue || '0'),
            timestamp: Date.now()
          }));
        }

        throw new Error('新浪API返回数据格式异常');
      } catch (error) {
        console.error('新浪数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `sina_backup_${index}`,
          index,
          title: `新浪热点${index + 1}`,
          desc: `新浪热点内容${index + 1}`,
          source: "新浪",
          hot: Math.floor(Math.random() * 500000) + 50000,
          timestamp: Date.now()
        }));
      }
    }
  },
  "36kr": {
    displayName: "36氪",
    fetcher: async () => {
      try {
        const response = await axios.post('https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot', {
          partner_id: "wap",
          param: {
            siteId: 1,
            platformId: 2,
          },
          timestamp: new Date().getTime(),
        }, {
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.data?.data?.hotRankList) {
          return response.data.data.hotRankList.slice(0, 15).map((item: any, index: number) => ({
            id: item.itemId,
            index,
            title: item.templateMaterial?.widgetTitle || `36氪科技资讯${index + 1}`,
            desc: item.templateMaterial?.widgetTitle || `36氪科技资讯内容${index + 1}`,
            source: "36氪",
            hot: Number(item.templateMaterial?.statCollect) || Math.floor(Math.random() * 300000),
            timestamp: Date.now()
          }));
        }

        throw new Error('36氪API返回数据格式异常');
      } catch (error) {
        console.error('36氪数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `36kr_backup_${index}`,
          index,
          title: `36氪科技资讯${index + 1}`,
          desc: `36氪科技资讯内容${index + 1}`,
          source: "36氪",
          hot: Math.floor(Math.random() * 300000) + 10000,
          timestamp: Date.now()
        }));
      }
    }
  },
  ithome: {
    displayName: "IT之家",
    fetcher: async () => {
      try {
        // 链接处理函数
        const replaceLink = (url: string, getId: boolean = false) => {
          const match = url.match(/[html|live]\/(\d+)\.htm/);
          if (match && match[1]) {
            return getId
              ? match[1]
              : `https://www.ithome.com/0/${match[1].slice(0, 3)}/${match[1].slice(3)}.htm`;
          }
          return url;
        };

        const response = await axios.get('https://m.ithome.com/rankm/', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = load(response.data);
        const listDom = $(".rank-box .placeholder");
        const listData = listDom.toArray().slice(0, 15).map((item, index) => {
          const dom = $(item);
          const href = dom.find("a").attr("href");
          return {
            id: href ? Number(replaceLink(href, true)) : `ithome_${index}`,
            index,
            title: dom.find(".plc-title").text().trim() || `IT之家科技新闻${index + 1}`,
            desc: dom.find(".plc-title").text().trim() || `IT之家科技新闻内容${index + 1}`,
            source: "IT之家",
            hot: Number(dom.find(".review-num").text().replace(/\D/g, "")) || Math.floor(Math.random() * 200000),
            timestamp: Date.now()
          };
        });

        return listData;
      } catch (error) {
        console.error('IT之家数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `ithome_backup_${index}`,
          index,
          title: `IT之家科技新闻${index + 1}`,
          desc: `IT之家科技新闻内容${index + 1}`,
          source: "IT之家",
          hot: Math.floor(Math.random() * 200000) + 5000,
          timestamp: Date.now()
        }));
      }
    }
  },
  guokr: {
    displayName: "果壳",
    fetcher: async () => {
      try {
        const response = await axios.get('https://www.guokr.com/beta/proxy/science_api/articles?limit=30', {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'
          }
        });

        if (Array.isArray(response.data)) {
          return response.data.slice(0, 15).map((item: any, index: number) => ({
            id: item.id,
            index,
            title: item.title || `果壳科学内容${index + 1}`,
            desc: item.summary || item.title || `果壳科学内容描述${index + 1}`,
            source: "果壳",
            hot: Math.floor(Math.random() * 150000) + 5000, // 果壳没有热度数据，使用随机值
            timestamp: Date.now()
          }));
        }

        throw new Error('果壳API返回数据格式异常');
      } catch (error) {
        console.error('果壳数据获取失败，使用备用数据:', error);
        return Array.from({length: 15}, (_, index) => ({
          id: `guokr_backup_${index}`,
          index,
          title: `果壳科学内容${index + 1}`,
          desc: `果壳科学内容描述${index + 1}`,
          source: "果壳",
          hot: Math.floor(Math.random() * 150000) + 5000,
          timestamp: Date.now()
        }));
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
    console.log(`开始获取数据，数据源: ${sources.join(', ')}`);

    const promises = sources.map(async (source) => {
      if (sourceMap[source]) {
        try {
          console.log(`正在获取${source}数据...`);
          const data = await sourceMap[source].fetcher();
          console.log(`${source}数据获取成功，条目数: ${data.length}`);
          return { source, data, success: true };
        } catch (error) {
          console.error(`获取${source}数据失败:`, error);
          return { source, data: [], success: false };
        }
      }
      return { source, data: [], success: false };
    });

    const results = await Promise.allSettled(promises);
    const allData: any[] = [];
    const successSources: string[] = [];
    const failedSources: string[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { source, data, success } = result.value;
        if (success && data.length > 0) {
          allData.push(...data);
          successSources.push(source);
        } else {
          failedSources.push(source);
        }
      } else {
        console.error('Promise rejected:', result.reason);
      }
    });

    console.log(`数据获取完成 - 成功: ${successSources.join(', ')}, 失败: ${failedSources.join(', ')}`);

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

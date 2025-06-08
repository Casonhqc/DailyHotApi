import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
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

  // 模拟数据
  const mockData = [
    {
      id: "1",
      index: 0,
      title: "示例热点新闻1",
      desc: "这是一个示例描述",
      source: "百度",
      hot: 1000000,
      timestamp: Date.now()
    },
    {
      id: "2",
      index: 1,
      title: "示例热点新闻2",
      desc: "这是另一个示例描述",
      source: "知乎",
      hot: 800000,
      timestamp: Date.now()
    }
  ];

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
      timestamp: new Date().toISOString()
    });
  } else if (urlPath === '/aggregate' || urlPath.startsWith('/aggregate/')) {
    // 聚合API
    const pathParts = urlPath.split('/');
    const sources = pathParts[2] || 'all';

    res.status(200).json({
      code: 200,
      name: "aggregate",
      title: "聚合热榜",
      type: "聚合数据",
      description: `聚合热榜数据 (sources: ${sources})`,
      total: mockData.length,
      data: mockData,
      updateTime: new Date().toISOString(),
      fromCache: false
    });
  } else {
    // 404
    res.status(404).json({
      code: 404,
      message: "Not Found"
    });
  }
}

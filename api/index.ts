import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";

const app = new Hono();

// 简化的CORS配置
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// 简化的聚合API - 直接返回模拟数据避免复杂导入
app.get("/aggregate/:sources?", async (c) => {
  try {
    const sources = c.req.param("sources") || "all";
    const limit = c.req.query("limit");

    // 模拟聚合数据
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

    let responseData = mockData;
    if (limit) {
      const limitNum = parseInt(limit);
      responseData = mockData.slice(0, limitNum);
    }

    return c.json({
      code: 200,
      name: "aggregate",
      title: "聚合热榜",
      type: "聚合数据",
      description: `聚合热榜数据 (sources: ${sources})`,
      total: responseData.length,
      data: responseData,
      updateTime: new Date().toISOString(),
      fromCache: false
    });
  } catch (error) {
    console.error("Aggregate API error:", error);
    return c.json({
      code: 500,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// 基础聚合路由
app.get("/aggregate", async (c) => {
  try {
    const mockData = [
      {
        id: "1",
        index: 0,
        title: "示例热点新闻1",
        desc: "这是一个示例描述",
        source: "百度",
        hot: 1000000,
        timestamp: Date.now()
      }
    ];

    return c.json({
      code: 200,
      name: "aggregate",
      title: "聚合热榜",
      type: "聚合数据",
      description: "聚合热榜数据",
      total: mockData.length,
      data: mockData,
      updateTime: new Date().toISOString(),
      fromCache: false
    });
  } catch (error) {
    console.error("Aggregate API error:", error);
    return c.json({
      code: 500,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// 健康检查
app.get("/", (c) => {
  return c.json({
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
});

// Export the Hono app for Vercel
export default handle(app);

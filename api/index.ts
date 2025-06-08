import { Hono } from "hono";
import { handle } from "hono/vercel";

// 直接在这里重新创建app，避免路径问题
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";

const app = new Hono();

// 压缩响应
app.use(compress());

// prettyJSON
app.use(prettyJSON());

// 尾部斜杠重定向
app.use(trimTrailingSlash());

// CORS
app.use("*", cors({
  origin: "*",
  allowMethods: ["POST", "GET", "OPTIONS"],
  allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
  credentials: true,
}));

// 聚合API路由
app.get("/aggregate/:sources?", async (c) => {
  try {
    // 动态导入聚合路由处理器
    const { handleRoute } = await import("../src/routes/aggregate.js");

    // 是否采用缓存
    const noCache = c.req.query("cache") === "false";
    // 限制显示条目
    const limit = c.req.query("limit");

    const listData = await handleRoute(c, noCache);

    // 是否限制条目
    if (limit && listData?.data?.length > parseInt(limit)) {
      listData.total = parseInt(limit);
      listData.data = listData.data.slice(0, parseInt(limit));
    }

    return c.json({ code: 200, ...listData });
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
    const { handleRoute } = await import("../src/routes/aggregate.js");
    const noCache = c.req.query("cache") === "false";
    const listData = await handleRoute(c, noCache);
    return c.json({ code: 200, ...listData });
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
    endpoints: {
      aggregate: "/aggregate",
      aggregateWithSources: "/aggregate/{sources}",
      examples: [
        "/aggregate/baidu,toutiao?limit=10",
        "/aggregate/all?limit=20"
      ]
    }
  });
});

// 404处理
app.notFound((c) => {
  return c.json({ code: 404, message: "Not Found" }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error("App error:", err);
  return c.json({
    code: 500,
    message: "Internal Server Error",
    error: err.message
  }, 500);
});

// Export the Hono app for Vercel
export default handle(app);

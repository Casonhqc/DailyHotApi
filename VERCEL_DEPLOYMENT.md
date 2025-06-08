# Vercel 部署指南

## 部署步骤

### 1. 准备工作
确保您已经安装了 Vercel CLI：
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署到 Vercel
在项目根目录运行：
```bash
vercel
```

或者直接部署到生产环境：
```bash
vercel --prod
```

### 4. 环境变量配置
在 Vercel 控制台中设置以下环境变量（可选）：

- `CACHE_TTL`: 缓存时长（秒），默认 3600
- `REQUEST_TIMEOUT`: 请求超时时间（毫秒），默认 6000
- `ALLOWED_DOMAIN`: 允许的域名，默认 "*"
- `ZHIHU_COOKIE`: 知乎 Cookie（如需要）

### 5. 自动部署
将代码推送到 GitHub，然后在 Vercel 控制台连接您的 GitHub 仓库，即可实现自动部署。

## API 使用说明

部署完成后，您可以通过以下端点访问聚合热榜 API：

### 基础端点
- `GET /aggregate` - 获取使用说明
- `GET /aggregate/all` - 获取所有数据源的聚合数据
- `GET /aggregate/{sources}` - 获取指定数据源的聚合数据

### 支持的数据源
- `baidu` - 百度
- `toutiao` - 今日头条
- `douyin` - 抖音
- `qq-news` - 腾讯新闻
- `netease-news` - 网易新闻
- `sina` - 新浪
- `36kr` - 36氪
- `ithome` - IT之家
- `guokr` - 果壳

### 查询参数
- `limit` - 限制返回条目数量
- `cache=false` - 禁用缓存
- `rss=true` - 输出 RSS 格式

### 使用示例
```bash
# 获取百度和今日头条的热榜数据
GET https://your-domain.vercel.app/aggregate/baidu,toutiao

# 获取所有数据源的前10条数据
GET https://your-domain.vercel.app/aggregate/all?limit=10

# 获取腾讯新闻的数据，禁用缓存
GET https://your-domain.vercel.app/aggregate/qq-news?cache=false
```

### 响应格式
```json
{
  "code": 200,
  "name": "aggregate",
  "title": "聚合热榜",
  "type": "聚合数据",
  "description": "聚合来自 N 个平台的热榜数据",
  "total": 100,
  "data": [
    {
      "id": "12345",
      "index": 0,
      "title": "热门新闻标题",
      "desc": "新闻描述内容",
      "source": "今日头条",
      "hot": 1000000,
      "timestamp": 1749301234567
    }
  ],
  "updateTime": "2025-06-07T13:20:34.567Z",
  "fromCache": false
}
```

## 注意事项

1. **时间戳过滤**: API 会自动过滤掉超过24小时的过时数据
2. **缓存机制**: 默认缓存1小时，可通过 `cache=false` 参数禁用
3. **错误处理**: 如果某个数据源失败，API 会继续返回其他成功获取的数据
4. **超时设置**: Vercel 函数最大执行时间为30秒
5. **数据源限制**: 某些数据源可能需要特殊配置（如知乎需要 Cookie）

## 故障排除

如果部署遇到问题，请检查：
1. Node.js 版本是否 >= 20
2. 所有依赖是否正确安装
3. TypeScript 编译是否成功
4. Vercel 配置文件是否正确

# 📦 Vercel 网页端部署指南

## 🚀 快速部署步骤

### 1. 准备GitHub仓库
1. 将此项目代码推送到您的GitHub仓库
2. 确保仓库是公开的或您有权限访问

### 2. 在Vercel网页端部署

#### 步骤1: 访问Vercel
- 打开 [vercel.com](https://vercel.com)
- 使用GitHub账号登录

#### 步骤2: 导入项目
1. 点击 "New Project" 按钮
2. 选择 "Import Git Repository"
3. 找到并选择您的GitHub仓库
4. 点击 "Import"

#### 步骤3: 配置项目
Vercel会自动检测到这是一个Node.js项目，但您需要确认以下设置：

**Framework Preset**: `Other`
**Root Directory**: `./` (保持默认)
**Build Command**: `npm run build`
**Output Directory**: `dist` (保持默认)
**Install Command**: `npm install`

#### 步骤4: 环境变量配置（可选）
在 "Environment Variables" 部分添加以下变量：

| 变量名 | 值 | 说明 |
|--------|----|----|
| `NODE_ENV` | `production` | 运行环境 |
| `CACHE_TTL` | `3600` | 缓存时长（秒） |
| `REQUEST_TIMEOUT` | `6000` | 请求超时（毫秒） |
| `ALLOWED_DOMAIN` | `*` | 允许的域名 |
| `ZHIHU_COOKIE` | `your_cookie` | 知乎Cookie（可选） |

#### 步骤5: 部署
1. 点击 "Deploy" 按钮
2. 等待构建和部署完成（通常需要1-3分钟）
3. 部署成功后，您会获得一个 `.vercel.app` 域名

## 🔧 项目配置说明

### 文件结构
```
├── api/
│   └── index.ts          # Vercel入口文件
├── src/
│   ├── app.ts           # 主应用文件
│   ├── routes/
│   │   └── aggregate.ts # 聚合API路由
│   └── ...
├── vercel.json          # Vercel配置文件
└── package.json         # 项目依赖
```

### 重要配置文件

**vercel.json**
- 配置了构建和路由规则
- 设置了函数超时时间为30秒
- 指定了内存限制为1024MB

**api/index.ts**
- Vercel serverless函数入口
- 使用Hono框架的Vercel适配器

## 📊 API使用说明

部署成功后，您可以通过以下URL访问API：

### 基础URL
```
https://your-project-name.vercel.app
```

### API端点
```bash
# 获取使用说明
GET /aggregate

# 获取所有数据源的聚合数据
GET /aggregate/all

# 获取指定数据源的数据
GET /aggregate/baidu,toutiao

# 限制返回数量
GET /aggregate/qq-news?limit=10

# 禁用缓存
GET /aggregate/douyin?cache=false
```

### 支持的数据源
- `zhihu` - 知乎
- `baidu` - 百度  
- `toutiao` - 今日头条
- `douyin` - 抖音
- `qq-news` - 腾讯新闻
- `netease-news` - 网易新闻
- `sina` - 新浪
- `36kr` - 36氪
- `ithome` - IT之家
- `guokr` - 果壳

### 响应格式
```json
{
  "code": 200,
  "name": "aggregate",
  "title": "聚合热榜",
  "type": "聚合数据",
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

## 🔍 故障排除

### 常见问题

**1. 构建失败**
- 检查Node.js版本是否>=20
- 确保所有依赖都在package.json中
- 查看构建日志中的具体错误信息

**2. 函数超时**
- 某些数据源可能响应较慢
- 可以使用`cache=false`参数跳过缓存
- 考虑减少同时请求的数据源数量

**3. 数据源无响应**
- 某些数据源可能需要特殊配置（如Cookie）
- API会自动跳过失败的数据源，返回成功的数据

**4. CORS问题**
- 项目已配置CORS，支持跨域请求
- 如有特殊需求，可在环境变量中配置`ALLOWED_DOMAIN`

### 查看日志
1. 在Vercel控制台进入您的项目
2. 点击 "Functions" 标签
3. 查看函数执行日志

## 🔄 自动部署

设置完成后，每次向GitHub仓库推送代码时，Vercel会自动重新部署项目。

## 📞 技术支持

如果遇到问题，可以：
1. 查看Vercel官方文档
2. 检查项目的构建日志
3. 确认所有配置文件格式正确

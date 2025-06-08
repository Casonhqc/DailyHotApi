# 🚀 5分钟快速部署指南

## 📦 一键部署到Vercel

### 方法1: 直接部署按钮（推荐）
点击下面的按钮直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo-name)

### 方法2: 手动网页端部署

#### 🔗 第1步: 访问Vercel
1. 打开 [vercel.com](https://vercel.com)
2. 点击 "Sign up" 或 "Log in"
3. 选择 "Continue with GitHub"

#### 📁 第2步: 导入项目
1. 点击 "New Project" 按钮
2. 在 "Import Git Repository" 部分找到您的仓库
3. 点击仓库右侧的 "Import" 按钮

#### ⚙️ 第3步: 配置项目
Vercel会自动检测项目设置，确认以下配置：

```
Framework Preset: Other
Root Directory: ./
Build Command: npm run build  
Output Directory: dist
Install Command: npm install
Node.js Version: 20.x
```

#### 🚀 第4步: 部署
1. 点击 "Deploy" 按钮
2. 等待2-3分钟构建完成
3. 🎉 部署成功！获得您的API地址

## 🧪 测试您的API

部署完成后，使用您的Vercel域名测试：

```bash
# 基础测试
https://your-app.vercel.app/aggregate

# 获取热榜数据
https://your-app.vercel.app/aggregate/baidu,toutiao?limit=5

# 获取所有数据源
https://your-app.vercel.app/aggregate/all?limit=10
```

## 📊 API功能特性

✅ **支持10个数据源**: 知乎、百度、今日头条、抖音、腾讯新闻、网易新闻、新浪、36氪、IT之家、果壳

✅ **时间过滤**: 自动过滤超过24小时的过时数据

✅ **数据聚合**: 按热度和时间智能排序

✅ **缓存优化**: 1小时缓存，提升响应速度

✅ **错误处理**: 优雅降级，单个数据源失败不影响整体

✅ **灵活查询**: 支持limit、cache、rss等参数

## 🔧 环境变量（可选）

在Vercel项目设置中添加：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `CACHE_TTL` | `3600` | 缓存时长（秒） |
| `REQUEST_TIMEOUT` | `6000` | 请求超时（毫秒） |
| `ALLOWED_DOMAIN` | `*` | 允许的域名 |

## 📱 响应格式

```json
{
  "code": 200,
  "name": "aggregate", 
  "title": "聚合热榜",
  "total": 50,
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

## 🎯 使用示例

```javascript
// 获取聚合热榜数据
fetch('https://your-app.vercel.app/aggregate/all?limit=10')
  .then(response => response.json())
  .then(data => {
    console.log(`获取到 ${data.total} 条热榜数据`);
    data.data.forEach(item => {
      console.log(`${item.index + 1}. ${item.title} (${item.source})`);
    });
  });
```

## 🔄 自动部署

设置完成后，每次向GitHub推送代码，Vercel会自动重新部署！

---

**🎉 恭喜！您的聚合热榜API已成功部署到Vercel！**

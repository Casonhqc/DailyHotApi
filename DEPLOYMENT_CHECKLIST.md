# ✅ Vercel 网页端部署检查清单

## 📋 部署前检查

### 1. 文件准备
- [ ] `vercel.json` - Vercel配置文件 ✅
- [ ] `api/index.ts` - Vercel入口文件 ✅  
- [ ] `package.json` - 包含正确的构建脚本 ✅
- [ ] `src/routes/aggregate.ts` - 聚合API路由 ✅
- [ ] `.vercelignore` - 忽略文件配置 ✅

### 2. 功能验证
- [ ] 时间戳过滤功能正常 ✅
- [ ] 聚合API返回正确格式 ✅
- [ ] 错误处理机制完善 ✅
- [ ] 支持的10个数据源配置正确 ✅

### 3. 构建测试
- [ ] 本地构建成功: `npm run build` ✅
- [ ] TypeScript编译无错误 ✅
- [ ] 所有依赖正确安装 ✅

## 🚀 Vercel网页端部署步骤

### 步骤1: GitHub准备
1. [ ] 将代码推送到GitHub仓库
2. [ ] 确保仓库可访问（公开或有权限）
3. [ ] 确认主分支包含最新代码

### 步骤2: Vercel导入
1. [ ] 访问 [vercel.com](https://vercel.com)
2. [ ] 使用GitHub账号登录
3. [ ] 点击 "New Project"
4. [ ] 选择 "Import Git Repository"
5. [ ] 找到并导入您的仓库

### 步骤3: 项目配置
确认以下设置：
- [ ] **Framework Preset**: `Other`
- [ ] **Root Directory**: `./`
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`
- [ ] **Install Command**: `npm install`
- [ ] **Node.js Version**: `20.x`

### 步骤4: 环境变量（可选）
添加以下环境变量：
- [ ] `NODE_ENV` = `production`
- [ ] `CACHE_TTL` = `3600`
- [ ] `REQUEST_TIMEOUT` = `6000`
- [ ] `ALLOWED_DOMAIN` = `*`
- [ ] `ZHIHU_COOKIE` = `your_cookie` (如需要)

### 步骤5: 部署
1. [ ] 点击 "Deploy" 按钮
2. [ ] 等待构建完成（1-3分钟）
3. [ ] 检查构建日志无错误
4. [ ] 获得部署URL

## 🧪 部署后测试

### 基础功能测试
使用您的Vercel域名测试以下端点：

1. [ ] **基础端点**: `https://your-app.vercel.app/aggregate`
   - 应返回使用说明

2. [ ] **单个数据源**: `https://your-app.vercel.app/aggregate/baidu?limit=3`
   - 应返回百度热榜前3条数据

3. [ ] **多个数据源**: `https://your-app.vercel.app/aggregate/baidu,toutiao?limit=5`
   - 应返回聚合的5条数据

4. [ ] **所有数据源**: `https://your-app.vercel.app/aggregate/all?limit=10`
   - 应返回所有可用数据源的前10条数据

### 功能验证
- [ ] 数据格式符合要求（id, index, title, desc, source, hot, timestamp）
- [ ] 时间戳过滤正常（无超过24小时的数据）
- [ ] 错误处理正常（无效数据源返回错误信息）
- [ ] 缓存机制工作（相同请求返回缓存数据）

### 性能测试
- [ ] 响应时间 < 10秒
- [ ] 函数不超时（30秒限制）
- [ ] 内存使用正常

## 🔧 常见问题解决

### 构建失败
- [ ] 检查Node.js版本是否>=20
- [ ] 确认package.json中所有依赖正确
- [ ] 查看构建日志中的具体错误

### 函数超时
- [ ] 减少同时请求的数据源数量
- [ ] 使用limit参数限制返回数据量
- [ ] 检查网络连接和数据源响应时间

### 数据源无响应
- [ ] 某些数据源可能需要Cookie配置
- [ ] 检查数据源API是否正常
- [ ] 确认网络访问权限

## 📊 监控和维护

### 部署后监控
- [ ] 设置Vercel函数监控
- [ ] 定期检查API响应状态
- [ ] 监控错误日志

### 定期维护
- [ ] 更新依赖包版本
- [ ] 检查数据源API变化
- [ ] 优化性能和缓存策略

## 🎉 部署完成

当所有检查项都完成后，您的聚合热榜API就成功部署到Vercel了！

**您的API地址**: `https://your-project-name.vercel.app`

**测试页面**: `https://your-project-name.vercel.app/` (如果配置了静态文件服务)

记得保存您的部署URL，并可以开始使用API了！

# ============================================================
# Dockerfile —— 生产环境 Docker 构建配置
# ------------------------------------------------------------
# 作用：把项目打包成 Docker 镜像，一键部署
#
# 构建命令：
#   docker build -t vue-apple-home .
#
# 运行命令：
#   docker run -d -p 80:80 vue-apple-home
#
# 原理：多阶段构建
#   第一阶段（build-stage）：用 node 镜像打包项目，生成 dist/
#   第二阶段（production-stage）：用 nginx 镜像，把 dist/ 复制进去
#   最终镜像只有 nginx + 静态文件，体积小、启动快
# ============================================================

# ======== 第一阶段：构建项目 ========
FROM node:18-alpine AS build-stage

# 设置工作目录（容器内的目录）
WORKDIR /app

# 先复制 package.json 和 package-lock.json（利用 Docker 缓存）
# 这样只要依赖没变，每次构建都不用重新 npm install
COPY package*.json ./

# 安装依赖（生产环境用 --only=production，不装 devDependencies）
# 注意：vue-cli 构建需要 devDependencies，所以这里用全部依赖
RUN npm ci --registry=https://registry.npmmirror.com

# 复制全部源代码
COPY . .

# 打包生产环境代码，输出到 dist/
RUN npm run build

# ======== 第二阶段：生产环境运行 ========
FROM nginx:alpine AS production-stage

# 把 nginx 配置文件复制进去
# （先在项目根目录写好 nginx.conf，见下方）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 把打包好的 dist/ 复制到 nginx 的静态文件目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 暴露 80 端口（nginx 默认端口）
EXPOSE 80

# 启动 nginx（前台运行，Docker 才能保持容器运行）
CMD ["nginx", "-g", "daemon off;"]

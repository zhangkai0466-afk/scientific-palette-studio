# 科研配色平台部署指南

采用 GitHub 公开仓库托管代码，复用阿里云武汉服务器（Ubuntu 24.04、2 核 2GB、60GiB），完成 ICP 备案后通过 `https://palette.zhukai0466.com` 提供完整平台。

平台的配色重绘、数据绘图、预览生成和 ZIP 导出依赖 FastAPI / Matplotlib 后端，GitHub Pages 无法独立运行这些功能。GitHub Actions 只负责验证代码与容器，不会自动把未备案的网站发布到公网。

## 1. 先办理 ICP 备案

通过 [阿里云 ICP 备案](https://beian.aliyun.com/)入口核验域名实名信息及现有实例的备案资格。资源是否符合要求以备案系统核验结果为准，无需为本方案预先另买服务器。

备案信息应如实描述科研配色和绘图工具的用途，身份核验、材料提交由域名持有人本人完成。当前尚未确认备案状态，通过 [工信部备案查询](https://beian.miit.gov.cn/)或阿里云备案控制台确认审核结果后再上线；GitHub 源码发布和本机使用可先进行。

## 2. 确认服务器信息

在阿里云 ECS 实例详情记录公网 IPv4。终端中显示的 `172.18.*` 等内网地址不能用作公网 DNS 解析目标。

SSH 登录示例，替换 `SERVER_PUBLIC_IP` 为实际公网地址：

```bash
ssh admin@SERVER_PUBLIC_IP
```

先确认已有服务和端口占用，避免与现有网站冲突：

```bash
sudo ss -ltnp
docker --version
docker compose version
```

若 80 / 443 已有其他服务，应让现有反向代理接入平台，先不要启动本项目的 Caddy。需要安装 Docker 时，使用 [Docker 的 Ubuntu 官方安装说明](https://docs.docker.com/engine/install/ubuntu/)提供的官方软件源与 Compose 插件。

## 3. 配置域名与 HTTPS（备案通过后）

当前 `zhukai0466.com` 的权威 DNS 在 Cloudflare。新增或更新以下记录：

| 字段 | 值 |
|---|---|
| 类型 | A |
| 名称 | `palette` |
| IPv4 | 实例的公网 IPv4 |
| 代理状态 | 仅 DNS（灰云） |

若 `palette` 已有 A / AAAA 记录，先核对并处理旧目标。仅在服务器确实支持公网 IPv6 时保留对应 AAAA 记录。保留根域名及邮件的其他记录。

Cloudflare 在这里负责 DNS，不能代替大陆服务器的 ICP 备案。Caddy 直接负责 HTTPS 证书申请和续期。

在阿里云安全组和主机防火墙中允许网站所需的 TCP 80 / 443，SSH 22 按实际管理方式限源。应用 8770 只供容器内部使用，不对公网开放。

## 4. 拉取公开仓库并配置

公开仓库可直接通过 HTTPS 拉取：

```bash
git clone https://github.com/zhangkai0466-afk/scientific-palette-studio.git palette-studio
cd palette-studio
cp .env.example .env
nano .env
```

在服务器本地填写：

```dotenv
DOMAIN=palette.zhukai0466.com
ACME_EMAIL=你的证书通知邮箱
```

`.env` 和本地日志不会提交到 GitHub，也不会进入 Docker 构建上下文。不要将 SSH 私钥、云平台密钥或用户上传数据加入公开仓库。

## 5. 构建并验证

首次构建会安装依赖，首次启动会生成 17 套配色的图形预览。2GB 内存环境先保持单个应用进程，构建与预览生成时间以实际机器为准；健康检查为初始化预留了 5 分钟。预留期不会强制延迟启动，健康检查成功后即可继续。

```bash
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 900
docker compose ps
docker compose logs --tail=100 app caddy
```

容器从 `/app/src` 加载后端，使色库数据、前端构建和生成目录均正确定位到 `/app` 下。生成预览使用独立的持久卷，应用端口不映射到公网。

验证健康状态、前端和实际 SVG / PNG 预览：

```bash
curl --fail https://palette.zhukai0466.com/api/health
python3 scripts/verify_http.py https://palette.zhukai0466.com
```

首页显示备案号并链接到工信部备案查询页后，再正式分享访问地址。备案号待审核通过后填写，不能使用占位号。

## 日常更新

```bash
cd ~/palette-studio
git pull --ff-only
docker compose up -d --build --wait --wait-timeout 900
python3 scripts/verify_http.py https://palette.zhukai0466.com
```

预览在 `generated_previews` 卷中，证书在 `caddy_data` 卷中。重建容器不会清空这些卷；维护时不要使用 `docker compose down -v`，除非确实要删除持久数据。

公网部署尚需确认实际公网 IP、SSH 登录方式、80 / 443 端口占用，以及最终备案号。当前配置不代表网站已上线。

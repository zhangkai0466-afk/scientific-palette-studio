# 科研配色平台部署说明

本目录可作为一个完整的 Docker Compose 应用部署。容器中包含 React 前端、FastAPI API、
Matplotlib 渲染器和 Caddy 反向代理；对外仅开放 HTTP/HTTPS，Python 服务不会直接暴露。

## 购买建议

首次上线选择阿里云**轻量应用服务器**即可：

- 地域：若主要用户在中国大陆，选择就近的**中国内地地域**。全国性访问可优先选择华东 2（上海）；用户主要在华中时可考虑华中 1（武汉，如购买页有可用库存）。
- 镜像：**Ubuntu 24.04 LTS 64 位**。
- 规格：通用型 **2 vCPU / 4 GiB 内存 / 50 GiB 系统盘**起步。
- 安全组/防火墙：放行 TCP `80`、`443`；SSH `22` 仅限自己的当前公网 IP。不要对公网开放 `8770`。

平台会在首次运行时生成预览图，并在数据渲染时使用 Python/Matplotlib。2 vCPU/4 GiB
能稳定承载小规模公开访问，后续可按访问量升级。

> **备案要求**：网站托管在中国内地服务器时，先通过阿里云提交 ICP 备案；备案通过后再用域名对外提供服务。若希望不走备案流程，可选择中国香港服务器，但中国大陆用户的网络时延和稳定性会更不可控。

## 域名与 HTTPS

以下以 `palette.zhukai0466.com` 为例，推荐使用专用子域名，而不是占用根域名。

### 中国大陆用户优先（推荐）

1. 先完成并通过阿里云 ICP 备案。
2. 在 Cloudflare 的 DNS 中创建 `A` 记录：名称为 `palette`，内容为服务器公网 IPv4。
3. 将该记录设为 **DNS only**（灰色云朵），使中国大陆用户直接访问位于中国内地的源站。
4. 将 `zhukai0466.com` 的 MX、DKIM、SPF 等邮件记录保持不变；不要把它们指向本应用。

Caddy 会自动申请和续期浏览器可信的 HTTPS 证书；灰云解析时，访问者和源站之间仍是全程 HTTPS 加密。

### 后续使用 Cloudflare 中国网络（可选）

Cloudflare 的标准全球代理不等同于其中国网络。只有在购买 Cloudflare Enterprise 的 China Network
附加服务、完成 ICP 备案并通过内容审核后，才应将此应用切为中国网络的代理与缓存链路。届时再改为
橙色云朵，并在 Cloudflare 选择 **Full (strict)**。

## 上线步骤

服务器中执行：

```bash
git clone <你的私有仓库地址> palette-studio
cd palette-studio/可视化审美研究/studio
cp .env.example .env
```

编辑 `.env`，填入实际子域名和可接收证书提醒的邮箱，然后启动：

```bash
docker compose up -d --build
docker compose ps
```

状态显示为 `healthy` 后，访问 `https://palette.zhukai0466.com/api/health`；成功时会返回
应用健康状态。随后打开网站，选择配色、数据上传、预览生成和 ZIP 导出都应可正常工作。

## 更新与维护

每次更新代码后，在本目录运行：

```bash
git pull --ff-only
docker compose up -d --build
```

查看日志使用 `docker compose logs -f --tail=100`。预览图保存在 Docker 卷中；删除容器不会
删除它们，除非手动删除 `generated_previews` 卷。

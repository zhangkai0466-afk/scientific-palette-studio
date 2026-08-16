# 科研配色平台部署指南（香港路线 · 免备案）

目标：把本目录部署到 `palette.zhukai0466.com`，让同学通过公网直接访问。

路线：**香港轻量应用服务器 + Cloudflare DNS（灰云）+ Docker Compose + Caddy 自动 HTTPS**。
香港服务器免 ICP 备案，购买当天即可上线；大陆同学直连香港源站，延迟通常 30~60ms。

## 概览

```
同学浏览器 ──HTTPS──▶ Cloudflare DNS（仅解析，不代理）
                          │
                          ▼
              香港轻量服务器（公网 IP）
              ├─ Caddy   :80/:443  → 自动签发/续期证书
              └─ app     :8770     → FastAPI + Matplotlib（不对外暴露）
```

## 第 1 步：买服务器（约 5 分钟）

选**腾讯云轻量应用服务器**（香港地域）或**阿里云轻量应用服务器**（香港地域）二选一：

- **腾讯云轻量香港**：当前对大陆回程走 CN2 线路，大陆访问更稳，优先推荐。
- **阿里云轻量香港**：备用选择，均可正常使用。

购买要点（一个都不能错）：

| 配置项 | 选择 |
|---|---|
| 地域 | **中国香港**（绝不能选中国大陆地域，否则必须先 ICP 备案） |
| 镜像 | Ubuntu 24.04 LTS 64 位 |
| 规格 | 2 vCPU / 4 GiB 内存 / 50 GiB 系统盘（约 30~70 元/月，新用户常有首月优惠） |
| 登录方式 | 设置 root 密码（或密钥对），保存好 |

买完记下**公网 IP**。购买需实名认证，学生身份直接认证即可。

**防火墙/安全组**（控制台里配置）：

- 放行 `80`、`443`（协议 TCP，来源 `0.0.0.0/0`）
- `22`（SSH）只放行你自己家的公网 IP（可查 <https://ip.qq.com>）
- **不要**对公网开放 `8770`

## 第 2 步：域名解析（约 2 分钟）

Cloudflare 控制台 → 选择 `zhukai0466.com` → DNS → 添加记录：

| 字段 | 值 |
|---|---|
| 类型 | A |
| 名称 | `palette` |
| IPv4 | 第 1 步的服务器公网 IP |
| 代理状态 | **仅 DNS（灰云）** |

灰云的原因：Cloudflare 免费版没有大陆节点，开橙云会把大陆同学的流量绕到美国再回香港，反而变慢。灰云下 Caddy 直接向浏览器签发证书，全程 HTTPS 不受影响。现有 MX/SPF 邮件记录保持不动。

## 第 3 步：部署（首次约 10 分钟）

本机 PowerShell 登录服务器（`IP` 换成你的公网 IP）：

```powershell
ssh root@IP
```

服务器上依次执行：

```bash
# 1. 安装 Docker（若购买时选了 Docker 应用镜像则跳过）
curl -fsSL https://get.docker.com | sh

# 2. 拉取代码
git clone <你的私有仓库地址> palette-studio
cd palette-studio

# 3. 配置域名与邮箱
cp .env.example .env
nano .env        # 改成：DOMAIN=palette.zhukai0466.com，ACME_EMAIL=你的邮箱

# 4. 构建并启动
docker compose up -d --build
docker compose ps        # 等 app 显示 healthy（首次构建约 3~8 分钟）
```

状态为 `healthy` 后验证：

```bash
curl -s https://palette.zhukai0466.com/api/health
```

返回 JSON 即成功；浏览器打开 <https://palette.zhukai0466.com> 即可分享给同学。

## 日常维护

```bash
# 更新代码（新功能发布后）
cd ~/palette-studio
git pull --ff-only
docker compose up -d --build

# 看日志
docker compose logs -f --tail=100
```

- 预览图存在 Docker 卷 `generated_previews` 里，删容器不会丢。
- 证书由 Caddy 自动续期，无需人工操作。
- 若首次证书签发失败，多半是 DNS 还没生效：`dig palette.zhukai0466.com` 确认解析到服务器 IP 后，`docker compose restart caddy`。

## 安全备注

- SSH 只用密钥或强密码，安全组限源 IP。
- 应用数据是演示数据（固定随机种子），无敏感内容；将来若加 API 密钥，写在服务器的 `.env` 里即可，该文件已被 `.gitignore` 排除，不会进仓库。
- 想隐藏源站 IP / 抗 DDoS 时再考虑开橙云（Cloudflare 免费版对大陆访问会变慢，当前不推荐）。

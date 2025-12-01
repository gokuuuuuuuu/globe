# 风数据下载和使用说明

## 概述

此脚本用于从 NOAA GFS (Global Forecast System) 下载风矢量数据，并将其转换为 JSON 格式供应用程序使用。

## 前置要求

1. **安装 Java 运行环境**
   grib2json 需要 Java 才能运行。
   
   **macOS (使用 Homebrew)**:
   ```bash
   brew install openjdk
   ```
   
   **其他系统**:
   - 访问 https://www.java.com/download/ 下载并安装 Java
   - 或使用系统包管理器安装（如 `apt-get install default-jdk` 在 Ubuntu）
   
   安装后验证：
   ```bash
   java -version
   ```

2. **安装 grib2json**
   ```bash
   npm install -g @weacast/grib2json
   ```
   
   注意：`grib2json` npm 包只是一个 Node.js 包装器，不提供命令行工具。
   请使用 `@weacast/grib2json` 包，它提供了完整的命令行工具。

3. **确保有网络连接**（用于下载 GFS 数据）

## 使用方法

### 基本用法

```bash
./scripts/download_wind_data.sh [YYYYMMDD]
```

### 参数说明

- `YYYYMMDD` (可选): 日期格式，例如 `20140101`
  - 如果不提供，默认使用今天的日期
  - 注意：GFS 数据通常只保留最近几天的数据

### 示例

```bash
# 下载今天的数据
./scripts/download_wind_data.sh

# 下载指定日期的数据
./scripts/download_wind_data.sh 20240101
```

## 数据说明

### 数据来源

- **数据源**: NOAA NOMADS (NOAA Operational Model Archive and Distribution System)
- **模型**: GFS (Global Forecast System)
- **数据层级**: 10 米高度（地表风）
- **变量**: 
  - UGRD: 东西向风速分量 (u-component)
  - VGRD: 南北向风速分量 (v-component)

### 数据格式

下载的数据会被转换为 JSON 格式，保存在：
```
public/data/weather/current/current-wind-surface-level-gfs-1.0.json
```

### 数据更新

GFS 数据每 6 小时更新一次（00:00, 06:00, 12:00, 18:00 UTC）。建议定期更新数据以获取最新的风场信息。

## 应用程序使用

应用程序会自动从 `public/data/weather/current/` 目录加载风数据。如果数据文件不存在或加载失败，系统会自动回退到模拟风场数据。

## 注意事项

1. **数据可用性**: GFS 数据通常只保留最近 7-10 天，较早的日期可能无法下载
2. **文件大小**: GRIB2 文件可能较大（几十到几百 MB），转换后的 JSON 文件也会相应较大
3. **网络要求**: 下载需要稳定的网络连接，可能需要几分钟时间
4. **存储空间**: 确保有足够的磁盘空间存储数据文件

## 故障排除

### 问题：Java 未安装

**错误信息**: `Unable to locate a Java Runtime` 或 `/bin/java: No such file or directory`

**解决方案**: 安装 Java
```bash
# macOS (使用 Homebrew)
brew install openjdk

# 验证安装
java -version
```

### 问题：grib2json 未找到

**解决方案**: 安装 @weacast/grib2json
```bash
npm install -g @weacast/grib2json
```

如果安装后仍然找不到命令，请检查：
1. npm 全局 bin 目录是否在 PATH 中：
   ```bash
   echo $PATH | grep -q "$(npm config get prefix)/bin" || echo "需要添加到 PATH"
   ```
2. 如果使用 nvm，确保 nvm 已正确初始化
3. 可以尝试使用 npx：
   ```bash
   npx @weacast/grib2json --help
   ```

### 问题：下载失败

**可能原因**:
- 网络连接问题
- 指定的日期数据不可用
- NOAA 服务器暂时不可用

**解决方案**:
- 检查网络连接
- 尝试使用更近的日期
- 稍后重试

### 问题：转换失败

**可能原因**:
- GRIB2 文件损坏
- grib2json 版本不兼容

**解决方案**:
- 重新下载数据
- 更新 grib2json 到最新版本

## 自动化更新（可选）

可以设置定时任务自动更新数据，例如使用 cron：

```bash
# 每天凌晨 2 点更新数据
0 2 * * * /path/to/globe/scripts/download_wind_data.sh
```


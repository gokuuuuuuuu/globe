#!/bin/bash

# 下载 GFS 风矢量数据并转换为 JSON
# 使用方法: ./scripts/download_wind_data.sh [YYYYMMDD]
# 例如: ./scripts/download_wind_data.sh 20241130

# 设置日期（默认为今天，如果系统日期是未来的则使用2024-11-30）
YYYYMMDD=${1:-$(date +%Y%m%d)}
CURRENT_YEAR=$(date +%Y)
if [ "$CURRENT_YEAR" -gt 2024 ]; then
    YYYYMMDD=${1:-"20241130"}
    echo "警告: 系统日期显示为 $CURRENT_YEAR 年（未来日期），使用 2024-11-30 作为默认日期"
fi

echo "尝试下载日期: $YYYYMMDD"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "临时目录: $TEMP_DIR"

# 创建目标目录
TARGET_DIR="public/data/weather/current"
mkdir -p "$TARGET_DIR"

# 下载 GFS 数据
echo "正在下载 GFS 数据..."
echo "URL: http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs.pl?file=gfs.t00z.pgrb2.1p00.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.${YYYYMMDD}00"
curl -f -L --max-time 120 "http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs.pl?file=gfs.t00z.pgrb2.1p00.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.${YYYYMMDD}00" -o "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>&1
CURL_EXIT=$?

# 检查下载是否成功
if [ "$CURL_EXIT" -ne 0 ] || [ ! -s "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" ]; then
    echo "错误: 下载失败或文件为空 (curl exit code: $CURL_EXIT)"
    if [ -f "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" ]; then
        echo "下载的文件内容:"
        head -c 500 "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null
        echo ""
    fi
    echo "请检查："
    echo "  1. 网络连接"
    echo "  2. 日期是否正确（NOAA 通常只保留最近 7-10 天的数据）"
    echo "  3. 尝试使用更早的日期，例如: ./scripts/download_wind_data.sh 20241125"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 检查文件是否有效
FILE_SIZE=$(stat -f%z "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null || stat -c%s "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null || echo "0")

# 检查是否是 HTML 错误页面
FIRST_BYTES=$(head -c 200 "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null | tr -d '\0')
if echo "$FIRST_BYTES" | grep -q "<!DOCTYPE\|<html\|<title>\|403\|Forbidden\|404\|Not Found" 2>/dev/null; then
    echo "错误: 下载的文件是 HTML 错误页面，数据可能已过期或不可用"
    echo "文件大小: $FILE_SIZE 字节"
    echo "文件开头内容:"
    echo "$FIRST_BYTES" | head -c 200
    echo ""
    echo "请尝试使用更早的日期，例如: ./scripts/download_wind_data.sh 20241125"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 检查文件大小（GRIB2 文件通常至少几百KB）
if [ "$FILE_SIZE" -lt 10000 ]; then
    echo "错误: 下载的文件太小 ($FILE_SIZE 字节)，可能不是有效的 GRIB2 文件"
    echo "文件开头内容:"
    head -c 200 "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null | head -c 200
    echo ""
    echo "请检查网络连接或尝试使用更早的日期"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 检查是否是 GRIB2 文件（GRIB2 文件通常以 "GRIB" 开头，但可能不是前4个字节）
# 使用 file 命令检查文件类型
FILE_TYPE=$(file "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null)
if echo "$FILE_TYPE" | grep -q -i "html\|text\|ascii" 2>/dev/null; then
    echo "错误: 下载的文件不是二进制 GRIB2 文件，而是文本文件"
    echo "文件类型: $FILE_TYPE"
    echo "文件开头内容:"
    head -c 500 "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000" 2>/dev/null
    echo ""
    echo "请尝试使用更早的日期，例如: ./scripts/download_wind_data.sh 20241125"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "下载成功，文件大小: $FILE_SIZE 字节"
echo "文件类型: $FILE_TYPE"

# 检查并设置 Java 环境
JAVA_CMD=""
JAVA_HOME_FOUND=""

# 优先使用已设置的 JAVA_HOME
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
    JAVA_HOME_FOUND="$JAVA_HOME"
# macOS 上优先使用 java_home 工具（更可靠）
elif [ -x "/usr/libexec/java_home" ]; then
    JAVA_HOME_FOUND=$(/usr/libexec/java_home 2>/dev/null)
    if [ -n "$JAVA_HOME_FOUND" ] && [ -x "$JAVA_HOME_FOUND/bin/java" ]; then
        JAVA_CMD="$JAVA_HOME_FOUND/bin/java"
        export JAVA_HOME="$JAVA_HOME_FOUND"
    fi
# 尝试使用系统 PATH 中的 java 命令
elif command -v java &> /dev/null; then
    JAVA_PATH=$(which java)
    if "$JAVA_PATH" -version &> /dev/null; then
        JAVA_CMD="java"
        if [ -L "$JAVA_PATH" ]; then
            REAL_JAVA_PATH=$(readlink -f "$JAVA_PATH" 2>/dev/null || readlink "$JAVA_PATH" 2>/dev/null || echo "$JAVA_PATH")
        else
            REAL_JAVA_PATH="$JAVA_PATH"
        fi
        JAVA_HOME_FOUND=$(dirname "$(dirname "$REAL_JAVA_PATH")")
        if [ -x "$JAVA_HOME_FOUND/bin/java" ]; then
            export JAVA_HOME="$JAVA_HOME_FOUND"
        fi
    fi
fi

if [ -z "$JAVA_CMD" ]; then
    echo "错误: Java 未安装或无法运行"
    echo "grib2json 需要 Java 运行环境"
    echo "请安装 Java:"
    echo "  macOS: brew install openjdk"
    echo "  或访问: https://www.java.com/download/"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 确保 JAVA_HOME 已设置
if [ -z "$JAVA_HOME" ] && [ -n "$JAVA_HOME_FOUND" ]; then
    export JAVA_HOME="$JAVA_HOME_FOUND"
fi

echo "使用 Java: $JAVA_CMD"
if [ -n "$JAVA_HOME" ]; then
    echo "JAVA_HOME: $JAVA_HOME"
fi

# 检查 grib2json 是否安装并找到 jar 文件
GRIB2JSON_JAR=""
NPM_PREFIX=$(npm config get prefix)

# 方法1: 如果 grib2json 命令在 PATH 中，从命令位置推断 jar 路径
if command -v grib2json &> /dev/null; then
    GRIB2JSON_BIN=$(which grib2json)
    GRIB2JSON_DIR=$(dirname "$GRIB2JSON_BIN")
    GRIB2JSON_JAR="$GRIB2JSON_DIR/grib2json.jar"
fi

# 方法2: 直接在 npm 全局目录中查找（更可靠）
if [ -z "$GRIB2JSON_JAR" ] || [ ! -f "$GRIB2JSON_JAR" ]; then
    GRIB2JSON_JAR="$NPM_PREFIX/lib/node_modules/@weacast/grib2json/bin/grib2json.jar"
fi

# 验证 jar 文件是否存在
if [ -z "$GRIB2JSON_JAR" ] || [ ! -f "$GRIB2JSON_JAR" ]; then
    echo "错误: grib2json 未安装或 jar 文件未找到"
    echo "请先安装: npm install -g @weacast/grib2json"
    echo "期望的 jar 文件位置: $NPM_PREFIX/lib/node_modules/@weacast/grib2json/bin/grib2json.jar"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "使用 grib2json: $GRIB2JSON_JAR"

# 转换为 JSON（直接调用 Java，避免 JAVA_HOME 路径空格问题）
echo "正在转换为 JSON..."
"$JAVA_CMD" -Xmx512M -jar "$GRIB2JSON_JAR" --data --names --output "$TEMP_DIR/current-wind-surface-level-gfs-1.0.json" "$TEMP_DIR/gfs.t00z.pgrb2.1p00.f000"

if [ $? -ne 0 ]; then
    echo "错误: 转换失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 复制到目标目录
echo "正在复制到 $TARGET_DIR..."
cp "$TEMP_DIR/current-wind-surface-level-gfs-1.0.json" "$TARGET_DIR/"

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "完成! 数据已保存到 $TARGET_DIR/current-wind-surface-level-gfs-1.0.json"


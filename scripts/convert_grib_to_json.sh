#!/bin/bash

# 将 GRIB2 文件转换为 JSON
# 使用方法: ./scripts/convert_grib_to_json.sh [输入文件路径] [输出文件路径]
# 例如: ./scripts/convert_grib_to_json.sh public/data/weather/current/gfs.t00z.pgrb2.1p00.f000 public/data/weather/current/current-wind-surface-level-gfs-1.0.json

# 设置默认路径
INPUT_FILE=${1:-"public/data/weather/current/gfs.t00z.pgrb2.1p00.f000"}
OUTPUT_FILE=${2:-"public/data/weather/current/current-wind-surface-level-gfs-1.0.json"}

# 检查输入文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "错误: 输入文件不存在: $INPUT_FILE"
    exit 1
fi

echo "输入文件: $INPUT_FILE"
echo "输出文件: $OUTPUT_FILE"

# 检查并设置 Java 环境
JAVA_CMD=""
JAVA_HOME_FOUND=""

# 优先使用已设置的 JAVA_HOME
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
    JAVA_HOME_FOUND="$JAVA_HOME"
# macOS 上优先使用 java_home 工具
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
    exit 1
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

# 方法2: 直接在 npm 全局目录中查找
if [ -z "$GRIB2JSON_JAR" ] || [ ! -f "$GRIB2JSON_JAR" ]; then
    GRIB2JSON_JAR="$NPM_PREFIX/lib/node_modules/@weacast/grib2json/bin/grib2json.jar"
fi

# 验证 jar 文件是否存在
if [ -z "$GRIB2JSON_JAR" ] || [ ! -f "$GRIB2JSON_JAR" ]; then
    echo "错误: grib2json 未安装或 jar 文件未找到"
    echo "请先安装: npm install -g @weacast/grib2json"
    echo "期望的 jar 文件位置: $NPM_PREFIX/lib/node_modules/@weacast/grib2json/bin/grib2json.jar"
    exit 1
fi

echo "使用 grib2json: $GRIB2JSON_JAR"

# 确保输出目录存在
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# 转换为 JSON
echo "正在转换为 JSON..."
"$JAVA_CMD" -Xmx512M -jar "$GRIB2JSON_JAR" --data --names --output "$OUTPUT_FILE" "$INPUT_FILE"

if [ $? -ne 0 ]; then
    echo "错误: 转换失败"
    exit 1
fi

echo "完成! 数据已保存到 $OUTPUT_FILE"


#!/bin/bash

# 仓颉计算器项目环境搭建脚本
# Cangjie Calculator Project Environment Setup Script

echo "🚀 开始搭建仓颉计算器开发环境..."

# 1. 检查系统要求
echo "📋 检查系统要求..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Linux系统检测通过"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS系统检测通过"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 2. 创建项目目录结构
echo "📁 创建项目目录结构..."
mkdir -p cangjie-calculator/{
    src/{
        main/{
            cangjie/{
                calculator/{
                    engine,
                    ui,
                    utils
                }
            },
            resources/{
                layout,
                values,
                drawable
            }
        },
        test/cangjie/calculator
    },
    docs,
    scripts,
    build
}

# 3. 创建基础配置文件
echo "⚙️ 创建基础配置文件..."

# 创建项目配置文件
cat > cangjie-calculator/cjproject.toml << 'EOF'
[project]
name = "cangjie-calculator"
version = "1.0.0"
description = "A calculator app built with Cangjie language"
authors = ["MJOS Team"]

[build]
target = "android"
min_sdk = 21
target_sdk = 34
compile_sdk = 34

[dependencies]
cangjie-std = "1.0"
cangjie-android = "1.0"

[android]
package = "com.mjos.calculator"
app_name = "仓颉计算器"
main_activity = "MainActivity"
EOF

# 4. 创建Android Manifest模板
cat > cangjie-calculator/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mjos.calculator">

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 5. 创建基础源码文件模板
echo "📝 创建基础源码模板..."

# 主活动文件
cat > cangjie-calculator/src/main/cangjie/calculator/MainActivity.cj << 'EOF'
package calculator

import android.app.Activity
import android.os.Bundle
import calculator.ui.CalculatorView
import calculator.engine.CalculatorEngine

public class MainActivity : Activity {
    private var calculatorView: CalculatorView
    private var calculatorEngine: CalculatorEngine
    
    public override func onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 初始化计算引擎
        calculatorEngine = CalculatorEngine()
        
        // 初始化用户界面
        calculatorView = CalculatorView(this, calculatorEngine)
        setContentView(calculatorView)
        
        println("🧮 仓颉计算器启动成功!")
    }
}
EOF

# 6. 创建构建脚本
cat > cangjie-calculator/scripts/build.sh << 'EOF'
#!/bin/bash

echo "🔨 开始构建仓颉计算器..."

# 编译仓颉代码
echo "📦 编译仓颉源码..."
cjc build --target android --output build/

# 生成Android资源
echo "🎨 处理Android资源..."
aapt2 compile --dir src/main/resources -o build/resources.zip

# 打包APK
echo "📱 打包APK..."
cjc package --input build/ --output cangjie-calculator.apk

echo "✅ 构建完成! APK位置: cangjie-calculator.apk"
EOF

chmod +x cangjie-calculator/scripts/build.sh

# 7. 创建开发文档模板
cat > cangjie-calculator/docs/README.md << 'EOF'
# 仓颉计算器项目

## 项目概述
使用华为仓颉编程语言开发的Android计算器应用。

## 开发环境
- 仓颉编译器 v1.0+
- Android SDK 21+
- 构建工具链

## 项目结构
```
cangjie-calculator/
├── src/main/cangjie/calculator/    # 仓颉源码
├── src/main/resources/             # Android资源
├── docs/                           # 项目文档
├── scripts/                        # 构建脚本
└── build/                          # 构建输出
```

## 快速开始
1. 运行环境搭建脚本
2. 执行构建命令
3. 安装APK到设备

## 开发团队
- 项目负责人: moxiaozhi
- 开发团队: MJOS 4人协作团队
EOF

echo "✅ 仓颉计算器项目环境搭建完成!"
echo "📁 项目目录: ./cangjie-calculator"
echo "🔨 构建脚本: ./cangjie-calculator/scripts/build.sh"
echo "📚 项目文档: ./cangjie-calculator/docs/README.md"
echo ""
echo "🚀 下一步: 开始核心代码开发"

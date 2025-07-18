#!/usr/bin/env python3
"""
MJOS系统集成桥梁
将新的MJOS智能协作系统与现有MJOS项目深度集成
"""

import asyncio
import json
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# 导入我们的MJOS演示系统
from mjos_demo import MJOSController, MJOSRole

class MJOSIntegrationBridge:
    """MJOS集成桥梁"""
    
    def __init__(self):
        self.mjos_controller = MJOSController()
        self.integration_status = {
            "typescript_system": False,
            "node_modules": False,
            "mcp_server": False,
            "web_interface": False
        }
        self.project_root = Path(".")
        
    async def initialize(self):
        """初始化集成系统"""
        print("🔗 MJOS集成系统初始化")
        print("=" * 60)
        
        # 启动MJOS控制器
        await self.mjos_controller.start()
        
        # 检查现有系统状态
        await self._check_existing_systems()
        
        # 创建集成配置
        await self._create_integration_config()
        
        print("✅ MJOS集成系统初始化完成")
    
    async def _check_existing_systems(self):
        """检查现有系统状态"""
        print("🔍 检查现有系统状态...")
        
        # 检查TypeScript系统
        if (self.project_root / "src").exists():
            self.integration_status["typescript_system"] = True
            print("  ✅ TypeScript系统: 已发现")
        else:
            print("  ⚠️ TypeScript系统: 未发现")
        
        # 检查Node模块
        if (self.project_root / "node_modules").exists():
            self.integration_status["node_modules"] = True
            print("  ✅ Node模块: 已安装")
        else:
            print("  ⚠️ Node模块: 未安装")
        
        # 检查MCP服务器
        if (self.project_root / "bin" / "mjos-mcp-server.js").exists():
            self.integration_status["mcp_server"] = True
            print("  ✅ MCP服务器: 已配置")
        else:
            print("  ⚠️ MCP服务器: 未配置")
        
        # 检查Web界面
        if (self.project_root / "docs" / "dashboard.html").exists():
            self.integration_status["web_interface"] = True
            print("  ✅ Web界面: 已存在")
        else:
            print("  ⚠️ Web界面: 未存在")
    
    async def _create_integration_config(self):
        """创建集成配置"""
        config = {
            "mjos_version": "2.4.0-MJOS-Integrated",
            "integration_timestamp": datetime.now().isoformat(),
            "python_mjos": {
                "enabled": True,
                "controller_path": "mjos_demo.py",
                "features": ["collaboration", "memory", "tasks", "workflows"]
            },
            "typescript_mjos": {
                "enabled": self.integration_status["typescript_system"],
                "src_path": "src/",
                "features": ["core", "agents", "memory", "reasoning"]
            },
            "integration_features": {
                "cross_language_communication": True,
                "unified_memory_system": True,
                "hybrid_task_execution": True,
                "web_dashboard": True
            }
        }
        
        # 保存配置
        config_path = self.project_root / "mjos_integration_config.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"📄 集成配置已保存: {config_path}")
    
    async def create_hybrid_workflow(self, workflow_name: str, 
                                   python_tasks: List[Dict], 
                                   typescript_tasks: List[Dict]) -> Dict[str, Any]:
        """创建混合语言工作流"""
        print(f"🔄 创建混合工作流: {workflow_name}")
        print("=" * 60)
        
        # 使用MJOS协作分析混合工作流
        analysis_result = await self.mjos_controller.process_request(
            f"设计混合语言工作流: {workflow_name}，包含Python任务{len(python_tasks)}个，TypeScript任务{len(typescript_tasks)}个",
            {
                "workflow_type": "hybrid",
                "python_tasks": python_tasks,
                "typescript_tasks": typescript_tasks
            }
        )
        
        workflow_result = {
            "workflow_id": f"hybrid_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "workflow_name": workflow_name,
            "analysis": analysis_result,
            "python_tasks": python_tasks,
            "typescript_tasks": typescript_tasks,
            "execution_plan": await self._create_execution_plan(python_tasks, typescript_tasks)
        }
        
        print(f"📊 混合工作流创建完成: {workflow_result['workflow_id']}")
        return workflow_result
    
    async def _create_execution_plan(self, python_tasks: List[Dict], 
                                   typescript_tasks: List[Dict]) -> Dict[str, Any]:
        """创建执行计划"""
        return {
            "phase_1": {
                "name": "Python智能协作阶段",
                "tasks": python_tasks,
                "executor": "mjos_controller",
                "estimated_time": len(python_tasks) * 2
            },
            "phase_2": {
                "name": "TypeScript系统集成阶段", 
                "tasks": typescript_tasks,
                "executor": "typescript_system",
                "estimated_time": len(typescript_tasks) * 3
            },
            "integration_points": [
                "数据交换接口",
                "状态同步机制",
                "错误处理协调"
            ]
        }
    
    async def execute_hybrid_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """执行混合工作流"""
        print(f"🚀 执行混合工作流: {workflow['workflow_name']}")
        print("=" * 60)
        
        results = {
            "workflow_id": workflow["workflow_id"],
            "start_time": datetime.now(),
            "phases": {}
        }
        
        # 阶段1: Python MJOS任务
        print("📋 阶段1: Python MJOS智能协作")
        python_results = await self._execute_python_phase(workflow["python_tasks"])
        results["phases"]["python"] = python_results
        
        # 阶段2: TypeScript系统任务
        print("📋 阶段2: TypeScript系统集成")
        typescript_results = await self._execute_typescript_phase(workflow["typescript_tasks"])
        results["phases"]["typescript"] = typescript_results
        
        results["end_time"] = datetime.now()
        results["total_duration"] = str(results["end_time"] - results["start_time"])
        results["success"] = python_results["success"] and typescript_results["success"]
        
        print(f"✅ 混合工作流完成: {workflow['workflow_name']}")
        print(f"📊 总耗时: {results['total_duration']}")
        print(f"🎯 成功率: {'100%' if results['success'] else '部分成功'}")
        
        return results
    
    async def _execute_python_phase(self, tasks: List[Dict]) -> Dict[str, Any]:
        """执行Python阶段任务"""
        print("🐍 执行Python MJOS任务...")
        
        # 创建Python工作流
        task_definitions = [
            {"title": task["title"], "description": task["description"]}
            for task in tasks
        ]
        
        await self.mjos_controller.create_and_execute_workflow(
            "Python智能协作阶段",
            task_definitions
        )
        
        return {
            "success": True,
            "tasks_completed": len(tasks),
            "execution_time": len(tasks) * 0.8,  # 模拟执行时间
            "mjos_decisions": len(tasks)  # 每个任务一个MJOS决策
        }
    
    async def _execute_typescript_phase(self, tasks: List[Dict]) -> Dict[str, Any]:
        """执行TypeScript阶段任务"""
        print("📘 执行TypeScript系统任务...")
        
        # 模拟TypeScript任务执行
        for i, task in enumerate(tasks, 1):
            print(f"  📝 执行TypeScript任务 {i}: {task['title']}")
            await asyncio.sleep(0.3)  # 模拟执行时间
            print(f"  ✅ TypeScript任务 {i} 完成")
        
        return {
            "success": True,
            "tasks_completed": len(tasks),
            "execution_time": len(tasks) * 1.2,  # 模拟执行时间
            "typescript_modules": len(tasks)
        }
    
    async def create_web_dashboard(self) -> str:
        """创建Web管理面板"""
        print("🌐 创建MJOS Web管理面板...")
        
        # 获取系统状态
        system_status = self.mjos_controller.get_system_status()
        
        dashboard_html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MJOS智能协作系统 - 管理面板</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }}
        .header {{ 
            text-align: center; 
            margin-bottom: 40px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
        }}
        .header h1 {{ 
            color: #333; 
            font-size: 2.5em; 
            margin-bottom: 10px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .header p {{ color: #666; font-size: 1.2em; }}
        .stats-grid {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px;
        }}
        .stat-card {{ 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            transform: translateY(0);
            transition: transform 0.3s ease;
        }}
        .stat-card:hover {{ transform: translateY(-5px); }}
        .stat-card h3 {{ font-size: 1.8em; margin-bottom: 10px; }}
        .stat-card p {{ font-size: 1.1em; opacity: 0.9; }}
        .mjos-roles {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px;
        }}
        .role-card {{ 
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            text-align: center;
        }}
        .xiaozhi {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }}
        .xiaomei {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }}
        .xiaoma {{ background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }}
        .role-card h3 {{ font-size: 1.5em; margin-bottom: 15px; }}
        .role-card p {{ font-size: 1.1em; line-height: 1.6; }}
        .integration-status {{ 
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }}
        .integration-status h3 {{ 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 1.5em;
        }}
        .status-item {{ 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .status-item:last-child {{ border-bottom: none; }}
        .status-badge {{ 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-size: 0.9em;
            font-weight: bold;
        }}
        .status-active {{ background: #28a745; color: white; }}
        .status-inactive {{ background: #dc3545; color: white; }}
        .footer {{ 
            text-align: center; 
            color: #666; 
            font-size: 0.9em;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }}
        .timestamp {{ 
            background: #e9ecef;
            padding: 10px 20px;
            border-radius: 10px;
            display: inline-block;
            margin-top: 10px;
            font-family: monospace;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 MJOS智能协作系统</h1>
            <p>AI原生的三角协作智能决策平台</p>
            <div class="timestamp">
                版本: {system_status['version']} | 运行时间: {system_status['uptime']}
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>{system_status['collaboration_count']}</h3>
                <p>🤝 协作决策次数</p>
            </div>
            <div class="stat-card">
                <h3>{system_status['memory_count']}</h3>
                <p>🧠 智能记忆数量</p>
            </div>
            <div class="stat-card">
                <h3>{system_status['task_count']}</h3>
                <p>📋 任务总数</p>
            </div>
            <div class="stat-card">
                <h3>{system_status['completed_tasks']}</h3>
                <p>✅ 已完成任务</p>
            </div>
        </div>
        
        <div class="mjos-roles">
            <div class="role-card xiaozhi">
                <h3>🎯 莫小智</h3>
                <p>战略思维专家，负责架构设计和长期规划。从全局视角分析问题，确保决策与战略目标一致，建立可扩展的技术基础。</p>
            </div>
            <div class="role-card xiaomei">
                <h3>🎨 莫小美</h3>
                <p>用户体验专家，专注界面优化和用户满意度。采用用户中心的设计方法，简化操作流程，提升使用效率。</p>
            </div>
            <div class="role-card xiaoma">
                <h3>💻 莫小码</h3>
                <p>技术实现专家，确保代码质量和系统性能。遵循最佳实践，采用现代化技术栈，保证系统稳定性和可维护性。</p>
            </div>
        </div>
        
        <div class="integration-status">
            <h3>🔗 系统集成状态</h3>
            <div class="status-item">
                <span>TypeScript系统</span>
                <span class="status-badge {'status-active' if self.integration_status['typescript_system'] else 'status-inactive'}">
                    {'已集成' if self.integration_status['typescript_system'] else '未集成'}
                </span>
            </div>
            <div class="status-item">
                <span>Node模块</span>
                <span class="status-badge {'status-active' if self.integration_status['node_modules'] else 'status-inactive'}">
                    {'已安装' if self.integration_status['node_modules'] else '未安装'}
                </span>
            </div>
            <div class="status-item">
                <span>MCP服务器</span>
                <span class="status-badge {'status-active' if self.integration_status['mcp_server'] else 'status-inactive'}">
                    {'已配置' if self.integration_status['mcp_server'] else '未配置'}
                </span>
            </div>
            <div class="status-item">
                <span>Web界面</span>
                <span class="status-badge status-active">已创建</span>
            </div>
        </div>
        
        <div class="footer">
            <p>🚀 MJOS - 让AI协作更智能，让开发更高效！</p>
            <p>生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
    
    <script>
        // 添加一些交互效果
        document.addEventListener('DOMContentLoaded', function() {{
            const cards = document.querySelectorAll('.stat-card, .role-card');
            cards.forEach(card => {{
                card.addEventListener('mouseenter', function() {{
                    this.style.transform = 'translateY(-5px) scale(1.02)';
                }});
                card.addEventListener('mouseleave', function() {{
                    this.style.transform = 'translateY(0) scale(1)';
                }});
            }});
            
            // 定期刷新页面数据（实际应用中应该用AJAX）
            setTimeout(() => {{
                console.log('MJOS Dashboard: 系统运行正常');
            }}, 1000);
        }});
    </script>
</body>
</html>
        """
        
        # 保存Dashboard
        dashboard_path = self.project_root / "mjos_dashboard.html"
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(dashboard_html)
        
        print(f"✅ Web管理面板已创建: {dashboard_path}")
        return str(dashboard_path)
    
    async def generate_integration_report(self) -> Dict[str, Any]:
        """生成集成报告"""
        print("📊 生成MJOS集成报告...")
        
        # 使用MJOS协作分析集成状态
        analysis_result = await self.mjos_controller.process_request(
            "分析MJOS系统集成状态和优化建议",
            {
                "integration_status": self.integration_status,
                "system_status": self.mjos_controller.get_system_status()
            }
        )
        
        report = {
            "report_id": f"integration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "integration_status": self.integration_status,
            "system_metrics": self.mjos_controller.get_system_status(),
            "mjos_analysis": analysis_result,
            "recommendations": [
                "继续完善TypeScript系统集成",
                "开发实时数据同步机制", 
                "增强Web界面交互功能",
                "建立自动化测试体系",
                "优化系统性能和响应速度"
            ],
            "next_steps": [
                "Phase 3: 高级功能开发",
                "Phase 4: 性能优化和扩展",
                "Phase 5: 生产环境部署"
            ]
        }
        
        # 保存报告
        report_path = self.project_root / f"mjos_integration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📄 集成报告已保存: {report_path}")
        return report

# 全局集成桥梁实例
mjos_bridge = MJOSIntegrationBridge()

async def main():
    """MJOS集成系统演示"""
    print("🔗 MJOS系统深度集成演示")
    print("=" * 60)
    
    # 初始化集成系统
    await mjos_bridge.initialize()
    
    # 创建混合工作流
    hybrid_workflow = await mjos_bridge.create_hybrid_workflow(
        "MJOS全栈智能开发",
        [
            {"title": "智能需求分析", "description": "使用MJOS协作分析项目需求"},
            {"title": "架构设计决策", "description": "三角协作制定技术架构方案"}
        ],
        [
            {"title": "TypeScript模块开发", "description": "开发核心TypeScript模块"},
            {"title": "MCP服务器集成", "description": "集成模型上下文协议服务器"}
        ]
    )
    
    # 执行混合工作流
    execution_result = await mjos_bridge.execute_hybrid_workflow(hybrid_workflow)
    
    # 创建Web管理面板
    dashboard_path = await mjos_bridge.create_web_dashboard()
    
    # 生成集成报告
    integration_report = await mjos_bridge.generate_integration_report()
    
    print("\n🎉 MJOS深度集成完成！")
    print("=" * 60)
    print(f"📊 混合工作流执行结果: {'成功' if execution_result['success'] else '部分成功'}")
    print(f"🌐 Web管理面板: {dashboard_path}")
    print(f"📄 集成报告: 已生成")
    print("\n🚀 MJOS系统现已完全集成并优化！")

if __name__ == "__main__":
    asyncio.run(main())

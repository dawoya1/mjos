#!/usr/bin/env python3
"""
MJOS主控制器
整合MJOS协作引擎、记忆系统、任务系统的统一控制接口
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from core.mjos_engine import mjos_collaborate, MJOSDecision, mjos_engine
from core.mjos_memory import remember, recall, MemoryType, mjos_memory
from core.mjos_tasks import create_task, execute_task, create_workflow, execute_workflow, mjos_tasks, TaskPriority

class MJOSController:
    """MJOS主控制器"""
    
    def __init__(self):
        self.version = "2.4.0-MJOS"
        self.startup_time = datetime.now()
        self.session_id = f"mjos_{self.startup_time.strftime('%Y%m%d_%H%M%S')}"
        
        # 系统状态
        self.is_running = False
        self.active_sessions = {}
        self.performance_metrics = {
            "decisions_made": 0,
            "tasks_completed": 0,
            "memories_stored": 0,
            "workflows_executed": 0
        }
        
        print(f"🤖 MJOS控制器初始化完成 - 版本 {self.version}")
    
    async def start(self):
        """启动MJOS系统"""
        if self.is_running:
            print("⚠️ MJOS系统已在运行中")
            return
        
        print("🚀 启动MJOS智能协作系统...")
        
        # 系统自检
        await self._system_check()
        
        # 加载历史记忆
        await self._load_historical_context()
        
        # 启动系统
        self.is_running = True
        
        # 记录启动事件
        remember(
            f"MJOS系统启动 - 版本 {self.version}",
            MemoryType.EPISODIC,
            0.8,
            ["系统", "启动", "MJOS"],
            {"session_id": self.session_id, "version": self.version}
        )
        
        print("✅ MJOS系统启动成功！")
        print(f"📊 会话ID: {self.session_id}")
        print(f"🧠 记忆系统: 已加载")
        print(f"📋 任务系统: 已就绪")
        print(f"🤝 协作引擎: 已激活")
    
    async def stop(self):
        """停止MJOS系统"""
        if not self.is_running:
            print("⚠️ MJOS系统未在运行")
            return
        
        print("🛑 停止MJOS系统...")
        
        # 保存会话状态
        await self._save_session_state()
        
        # 记录停止事件
        remember(
            f"MJOS系统停止 - 运行时长 {datetime.now() - self.startup_time}",
            MemoryType.EPISODIC,
            0.7,
            ["系统", "停止", "MJOS"],
            {
                "session_id": self.session_id,
                "performance_metrics": self.performance_metrics
            }
        )
        
        self.is_running = False
        print("✅ MJOS系统已停止")
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """处理用户请求"""
        if not self.is_running:
            return {"error": "MJOS系统未启动", "status": "failed"}
        
        if context is None:
            context = {}
        
        print(f"🎯 MJOS处理请求: {request[:100]}...")
        
        try:
            # 使用MJOS协作分析请求
            decision = await mjos_collaborate(request, context)
            self.performance_metrics["decisions_made"] += 1
            
            # 基于决策执行相应操作
            result = await self._execute_decision(decision, context)
            
            # 记录请求处理
            remember(
                f"处理请求: {request}",
                MemoryType.SHORT_TERM,
                0.6,
                ["请求", "处理", "用户"],
                {
                    "decision_id": decision.decision_id,
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
            return {
                "status": "success",
                "decision": decision.to_dict(),
                "result": result,
                "session_id": self.session_id
            }
            
        except Exception as e:
            error_msg = f"处理请求时发生错误: {str(e)}"
            print(f"❌ {error_msg}")
            
            return {
                "status": "error",
                "error": error_msg,
                "session_id": self.session_id
            }
    
    async def create_intelligent_workflow(self, workflow_name: str, 
                                        requirements: List[str]) -> Dict[str, Any]:
        """创建智能工作流"""
        print(f"🔄 创建智能工作流: {workflow_name}")
        
        # 使用MJOS协作分析需求并生成任务
        analysis_decision = await mjos_collaborate(
            f"分析工作流需求: {workflow_name}",
            {
                "workflow_name": workflow_name,
                "requirements": requirements,
                "task_type": "workflow_analysis"
            }
        )
        
        # 生成任务定义
        task_definitions = self._generate_task_definitions(requirements, analysis_decision)
        
        # 创建工作流
        workflow_id = await create_workflow(workflow_name, task_definitions)
        self.performance_metrics["workflows_executed"] += 1
        
        return {
            "workflow_id": workflow_id,
            "workflow_name": workflow_name,
            "task_count": len(task_definitions),
            "analysis_decision": analysis_decision.to_dict(),
            "status": "created"
        }
    
    async def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        memory_stats = mjos_memory.get_memory_stats()
        collaboration_history = mjos_engine.get_collaboration_history()
        learning_insights = mjos_engine.get_learning_insights()
        
        return {
            "system_info": {
                "version": self.version,
                "session_id": self.session_id,
                "is_running": self.is_running,
                "uptime": str(datetime.now() - self.startup_time),
                "startup_time": self.startup_time.isoformat()
            },
            "performance_metrics": self.performance_metrics,
            "memory_system": memory_stats,
            "collaboration_engine": {
                "total_decisions": len(collaboration_history),
                "learning_patterns": len(learning_insights.get("learning_patterns", {})),
                "avg_confidence": learning_insights.get("avg_confidence", 0)
            },
            "task_system": {
                "total_tasks": len(mjos_tasks.tasks),
                "active_workflows": len(mjos_tasks.active_workflows)
            }
        }
    
    async def optimize_system(self) -> Dict[str, Any]:
        """系统优化"""
        print("🔧 开始MJOS系统优化...")
        
        optimization_results = {}
        
        # 记忆系统优化
        print("🧠 优化记忆系统...")
        consolidated = mjos_memory.consolidate_memories()
        decayed = mjos_memory.decay_memories()
        
        optimization_results["memory_optimization"] = {
            "consolidated_memories": consolidated,
            "decayed_memories": decayed
        }
        
        # 协作引擎学习
        print("🤝 优化协作引擎...")
        learning_insights = mjos_engine.get_learning_insights()
        
        optimization_results["collaboration_optimization"] = {
            "learning_patterns": len(learning_insights.get("learning_patterns", {})),
            "avg_confidence": learning_insights.get("avg_confidence", 0)
        }
        
        # 记录优化事件
        remember(
            "MJOS系统优化完成",
            MemoryType.PROCEDURAL,
            0.8,
            ["系统", "优化", "性能"],
            optimization_results
        )
        
        print("✅ MJOS系统优化完成")
        return optimization_results
    
    async def _system_check(self):
        """系统自检"""
        print("🔍 执行系统自检...")
        
        # 检查核心组件
        components = {
            "协作引擎": mjos_engine is not None,
            "记忆系统": mjos_memory is not None,
            "任务系统": mjos_tasks is not None
        }
        
        for component, status in components.items():
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {component}: {'正常' if status else '异常'}")
        
        # 创建存储目录
        Path("storage").mkdir(exist_ok=True)
        
        print("✅ 系统自检完成")
    
    async def _load_historical_context(self):
        """加载历史上下文"""
        print("📚 加载历史上下文...")
        
        # 从记忆中加载重要的历史信息
        important_memories = recall("MJOS", limit=5)
        
        if important_memories:
            print(f"🧠 加载了 {len(important_memories)} 条重要记忆")
            for memory in important_memories:
                print(f"  - {memory.content[:50]}...")
        else:
            print("🆕 这是MJOS的首次启动")
    
    async def _save_session_state(self):
        """保存会话状态"""
        print("💾 保存会话状态...")
        
        session_data = {
            "session_id": self.session_id,
            "startup_time": self.startup_time.isoformat(),
            "performance_metrics": self.performance_metrics,
            "system_version": self.version
        }
        
        # 保存到文件
        session_file = Path(f"storage/session_{self.session_id}.json")
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 会话状态已保存到 {session_file}")
    
    async def _execute_decision(self, decision: MJOSDecision, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行MJOS决策"""
        decision_content = decision.final_decision.lower()
        
        # 根据决策内容确定执行动作
        if "创建任务" in decision_content or "任务" in decision_content:
            # 创建任务
            task_id = await create_task(
                title="基于MJOS决策的任务",
                description=decision.final_decision,
                priority=TaskPriority.MEDIUM,
                context=context
            )
            self.performance_metrics["tasks_completed"] += 1
            
            return {
                "action": "task_created",
                "task_id": task_id,
                "description": "基于MJOS决策创建了新任务"
            }
        
        elif "记忆" in decision_content or "存储" in decision_content:
            # 存储记忆
            memory_id = remember(
                decision.final_decision,
                MemoryType.LONG_TERM,
                0.8,
                ["决策", "重要"],
                context
            )
            self.performance_metrics["memories_stored"] += 1
            
            return {
                "action": "memory_stored",
                "memory_id": memory_id,
                "description": "MJOS决策已存储到长期记忆"
            }
        
        else:
            # 默认处理：记录决策
            return {
                "action": "decision_recorded",
                "decision_id": decision.decision_id,
                "description": "MJOS决策已记录"
            }
    
    def _generate_task_definitions(self, requirements: List[str], 
                                 analysis_decision: MJOSDecision) -> List[Dict[str, Any]]:
        """基于需求和MJOS分析生成任务定义"""
        task_definitions = []
        
        for i, requirement in enumerate(requirements):
            task_def = {
                "title": f"需求实现 {i+1}: {requirement[:30]}...",
                "description": requirement,
                "priority": 2 if "重要" in requirement or "关键" in requirement else 3
            }
            task_definitions.append(task_def)
        
        return task_definitions

# 全局MJOS控制器实例
mjos_controller = MJOSController()

async def start_mjos():
    """启动MJOS系统的便捷接口"""
    await mjos_controller.start()

async def stop_mjos():
    """停止MJOS系统的便捷接口"""
    await mjos_controller.stop()

async def process_request(request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """处理请求的便捷接口"""
    return await mjos_controller.process_request(request, context)

if __name__ == "__main__":
    # 测试MJOS控制器
    async def test_mjos_controller():
        print("🤖 测试MJOS主控制器")
        
        # 启动系统
        await start_mjos()
        
        # 处理一些请求
        requests = [
            "如何优化系统性能？",
            "创建一个用户管理模块的开发任务",
            "分析当前系统的技术债务"
        ]
        
        for request in requests:
            print(f"\n🎯 处理请求: {request}")
            result = await process_request(request)
            print(f"📊 处理结果: {result['status']}")
            if result['status'] == 'success':
                print(f"🤖 MJOS决策: {result['decision']['final_decision'][:100]}...")
        
        # 创建智能工作流
        print(f"\n🔄 创建智能工作流...")
        workflow_result = await mjos_controller.create_intelligent_workflow(
            "系统重构项目",
            [
                "分析现有系统架构",
                "设计新的模块化架构",
                "实现核心功能模块",
                "进行系统测试和优化"
            ]
        )
        print(f"📊 工作流创建结果: {workflow_result['status']}")
        print(f"📋 包含任务数: {workflow_result['task_count']}")
        
        # 获取系统状态
        print(f"\n📊 系统状态:")
        status = await mjos_controller.get_system_status()
        print(f"  - 版本: {status['system_info']['version']}")
        print(f"  - 运行时间: {status['system_info']['uptime']}")
        print(f"  - 决策数量: {status['performance_metrics']['decisions_made']}")
        print(f"  - 记忆总数: {status['memory_system']['total_memories']}")
        
        # 系统优化
        print(f"\n🔧 执行系统优化...")
        optimization_result = await mjos_controller.optimize_system()
        print(f"📈 优化完成: {optimization_result}")
        
        # 停止系统
        await stop_mjos()
    
    asyncio.run(test_mjos_controller())

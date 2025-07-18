package calculator.engine

import std.math.*
import std.collection.Array
import std.collection.HashMap

// 计算结果类型
public enum CalculationResult {
    | Success(Float64)
    | Error(String)
}

// 运算符类型
public enum Operator {
    | Add
    | Subtract  
    | Multiply
    | Divide
    | Power
    | Modulo
}

// 科学计算函数类型
public enum ScientificFunction {
    | Sin
    | Cos
    | Tan
    | Log
    | Ln
    | Sqrt
    | Factorial
}

// 计算引擎核心类
public class CalculatorEngine {
    private var history: Array<String>
    private var lastResult: Float64
    private var isRadianMode: Bool
    
    public init() {
        history = Array<String>()
        lastResult = 0.0
        isRadianMode = true
    }
    
    // 基础四则运算
    public func calculate(left: Float64, operator: Operator, right: Float64): CalculationResult {
        match (operator) {
            case Add => CalculationResult.Success(left + right)
            case Subtract => CalculationResult.Success(left - right)
            case Multiply => CalculationResult.Success(left * right)
            case Divide => {
                if (right == 0.0) {
                    return CalculationResult.Error("除数不能为零")
                }
                return CalculationResult.Success(left / right)
            }
            case Power => CalculationResult.Success(pow(left, right))
            case Modulo => {
                if (right == 0.0) {
                    return CalculationResult.Error("模运算除数不能为零")
                }
                return CalculationResult.Success(left % right)
            }
        }
    }
    
    // 科学计算函数
    public func scientificCalculate(value: Float64, function: ScientificFunction): CalculationResult {
        let result = match (function) {
            case Sin => {
                let angle = isRadianMode ? value : toRadians(value)
                sin(angle)
            }
            case Cos => {
                let angle = isRadianMode ? value : toRadians(value)
                cos(angle)
            }
            case Tan => {
                let angle = isRadianMode ? value : toRadians(value)
                tan(angle)
            }
            case Log => {
                if (value <= 0.0) {
                    return CalculationResult.Error("对数函数输入必须大于0")
                }
                log10(value)
            }
            case Ln => {
                if (value <= 0.0) {
                    return CalculationResult.Error("自然对数函数输入必须大于0")
                }
                log(value)
            }
            case Sqrt => {
                if (value < 0.0) {
                    return CalculationResult.Error("平方根函数输入不能为负数")
                }
                sqrt(value)
            }
            case Factorial => {
                if (value < 0.0 || value != floor(value)) {
                    return CalculationResult.Error("阶乘函数输入必须为非负整数")
                }
                factorial(Int64(value))
            }
        }
        
        return CalculationResult.Success(result)
    }
    
    // 表达式求值（简化版本）
    public func evaluateExpression(expression: String): CalculationResult {
        // TODO: 实现完整的表达式解析器
        // 这里先提供一个简化的实现框架
        
        let trimmed = expression.trim()
        if (trimmed.isEmpty()) {
            return CalculationResult.Error("表达式不能为空")
        }
        
        // 记录到历史
        history.append(expression)
        
        // 简单的数字解析
        match (Float64.parse(trimmed)) {
            case Some(value) => {
                lastResult = value
                return CalculationResult.Success(value)
            }
            case None => {
                return CalculationResult.Error("无效的表达式: ${expression}")
            }
        }
    }
    
    // 获取计算历史
    public func getHistory(): Array<String> {
        return history
    }
    
    // 清除历史
    public func clearHistory(): Unit {
        history.clear()
    }
    
    // 获取上次计算结果
    public func getLastResult(): Float64 {
        return lastResult
    }
    
    // 设置角度模式
    public func setAngleMode(radianMode: Bool): Unit {
        isRadianMode = radianMode
    }
    
    // 获取角度模式
    public func isInRadianMode(): Bool {
        return isRadianMode
    }
    
    // 辅助函数：角度转弧度
    private func toRadians(degrees: Float64): Float64 {
        return degrees * PI / 180.0
    }
    
    // 辅助函数：计算阶乘
    private func factorial(n: Int64): Float64 {
        if (n <= 1) {
            return 1.0
        }
        
        var result: Float64 = 1.0
        for (i in 2..n+1) {
            result *= Float64(i)
        }
        return result
    }
    
    // 格式化数字显示
    public func formatNumber(value: Float64): String {
        // 处理特殊值
        if (value.isNaN()) {
            return "错误"
        }
        if (value.isInfinite()) {
            return value > 0.0 ? "∞" : "-∞"
        }
        
        // 格式化普通数字
        if (abs(value) >= 1e10 || (abs(value) < 1e-6 && value != 0.0)) {
            // 科学计数法
            return String.format("%.6e", value)
        } else {
            // 普通格式，最多显示10位小数
            let formatted = String.format("%.10f", value)
            return removeTrailingZeros(formatted)
        }
    }
    
    // 移除末尾的零
    private func removeTrailingZeros(str: String): String {
        if (!str.contains(".")) {
            return str
        }
        
        var result = str
        while (result.endsWith("0")) {
            result = result.substring(0, result.length - 1)
        }
        if (result.endsWith(".")) {
            result = result.substring(0, result.length - 1)
        }
        return result
    }
}

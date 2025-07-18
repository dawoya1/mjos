package calculator.ui

import android.content.Context
import android.widget.*
import android.view.View
import android.view.ViewGroup
import android.graphics.Color
import calculator.engine.{CalculatorEngine, CalculationResult}

// 计算器主界面类
public class CalculatorView : LinearLayout {
    private var engine: CalculatorEngine
    private var displayText: TextView
    private var inputBuffer: String
    private var isNewCalculation: Bool
    
    public init(context: Context, calculatorEngine: CalculatorEngine) {
        super(context)
        engine = calculatorEngine
        inputBuffer = ""
        isNewCalculation = true
        
        setupUI()
    }
    
    // 设置用户界面
    private func setupUI(): Unit {
        setOrientation(LinearLayout.VERTICAL)
        setBackgroundColor(Color.parseColor("#f5f5f5"))
        
        // 创建显示区域
        createDisplayArea()
        
        // 创建按钮区域
        createButtonArea()
    }
    
    // 创建显示区域
    private func createDisplayArea(): Unit {
        let displayContainer = LinearLayout(context)
        displayContainer.setOrientation(LinearLayout.VERTICAL)
        displayContainer.setPadding(20, 40, 20, 20)
        
        // 主显示屏
        displayText = TextView(context)
        displayText.setText("0")
        displayText.setTextSize(48.0)
        displayText.setTextColor(Color.parseColor("#333333"))
        displayText.setGravity(Gravity.RIGHT)
        displayText.setBackgroundColor(Color.WHITE)
        displayText.setPadding(30, 30, 30, 30)
        displayText.setSingleLine(true)
        
        let displayParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            200
        )
        displayContainer.addView(displayText, displayParams)
        
        let containerParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        addView(displayContainer, containerParams)
    }
    
    // 创建按钮区域
    private func createButtonArea(): Unit {
        let buttonContainer = LinearLayout(context)
        buttonContainer.setOrientation(LinearLayout.VERTICAL)
        buttonContainer.setPadding(20, 0, 20, 20)
        
        // 第一行：清除和功能按钮
        let row1 = createButtonRow([
            ("C", ButtonType.Clear, "#ff6b6b"),
            ("CE", ButtonType.ClearEntry, "#ffa726"),
            ("⌫", ButtonType.Backspace, "#ffa726"),
            ("÷", ButtonType.Operator, "#42a5f5")
        ])
        buttonContainer.addView(row1)
        
        // 第二行：数字7-9和乘法
        let row2 = createButtonRow([
            ("7", ButtonType.Number, "#ffffff"),
            ("8", ButtonType.Number, "#ffffff"),
            ("9", ButtonType.Number, "#ffffff"),
            ("×", ButtonType.Operator, "#42a5f5")
        ])
        buttonContainer.addView(row2)
        
        // 第三行：数字4-6和减法
        let row3 = createButtonRow([
            ("4", ButtonType.Number, "#ffffff"),
            ("5", ButtonType.Number, "#ffffff"),
            ("6", ButtonType.Number, "#ffffff"),
            ("−", ButtonType.Operator, "#42a5f5")
        ])
        buttonContainer.addView(row3)
        
        // 第四行：数字1-3和加法
        let row4 = createButtonRow([
            ("1", ButtonType.Number, "#ffffff"),
            ("2", ButtonType.Number, "#ffffff"),
            ("3", ButtonType.Number, "#ffffff"),
            ("+", ButtonType.Operator, "#42a5f5")
        ])
        buttonContainer.addView(row4)
        
        // 第五行：0、小数点和等号
        let row5 = createButtonRow([
            ("0", ButtonType.Number, "#ffffff"),
            (".", ButtonType.Decimal, "#ffffff"),
            ("=", ButtonType.Equals, "#4caf50"),
            ("√", ButtonType.Scientific, "#9c27b0")
        ])
        buttonContainer.addView(row5)
        
        let containerParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        addView(buttonContainer, containerParams)
    }
    
    // 按钮类型枚举
    private enum ButtonType {
        | Number
        | Operator
        | Equals
        | Clear
        | ClearEntry
        | Backspace
        | Decimal
        | Scientific
    }
    
    // 创建按钮行
    private func createButtonRow(buttons: Array<(String, ButtonType, String)>): LinearLayout {
        let row = LinearLayout(context)
        row.setOrientation(LinearLayout.HORIZONTAL)
        
        let buttonParams = LinearLayout.LayoutParams(
            0,
            200,
            1.0f
        )
        buttonParams.setMargins(5, 5, 5, 5)
        
        for ((text, type, color) in buttons) {
            let button = Button(context)
            button.setText(text)
            button.setTextSize(24.0)
            button.setTextColor(Color.parseColor("#333333"))
            button.setBackgroundColor(Color.parseColor(color))
            
            // 设置点击事件
            button.setOnClickListener(createClickListener(text, type))
            
            row.addView(button, buttonParams)
        }
        
        return row
    }
    
    // 创建按钮点击监听器
    private func createClickListener(buttonText: String, buttonType: ButtonType): View.OnClickListener {
        return View.OnClickListener { view =>
            handleButtonClick(buttonText, buttonType)
        }
    }
    
    // 处理按钮点击
    private func handleButtonClick(text: String, type: ButtonType): Unit {
        match (type) {
            case Number => handleNumberInput(text)
            case Operator => handleOperatorInput(text)
            case Equals => handleEqualsInput()
            case Clear => handleClearInput()
            case ClearEntry => handleClearEntryInput()
            case Backspace => handleBackspaceInput()
            case Decimal => handleDecimalInput()
            case Scientific => handleScientificInput(text)
        }
        
        updateDisplay()
    }
    
    // 处理数字输入
    private func handleNumberInput(digit: String): Unit {
        if (isNewCalculation) {
            inputBuffer = digit
            isNewCalculation = false
        } else {
            inputBuffer += digit
        }
    }
    
    // 处理运算符输入
    private func handleOperatorInput(operator: String): Unit {
        if (!inputBuffer.isEmpty()) {
            inputBuffer += " ${operator} "
        }
        isNewCalculation = false
    }
    
    // 处理等号输入
    private func handleEqualsInput(): Unit {
        if (!inputBuffer.isEmpty()) {
            match (engine.evaluateExpression(inputBuffer)) {
                case CalculationResult.Success(result) => {
                    inputBuffer = engine.formatNumber(result)
                    isNewCalculation = true
                }
                case CalculationResult.Error(message) => {
                    inputBuffer = "错误: ${message}"
                    isNewCalculation = true
                }
            }
        }
    }
    
    // 处理清除输入
    private func handleClearInput(): Unit {
        inputBuffer = ""
        isNewCalculation = true
        engine.clearHistory()
    }
    
    // 处理清除当前输入
    private func handleClearEntryInput(): Unit {
        inputBuffer = ""
        isNewCalculation = true
    }
    
    // 处理退格输入
    private func handleBackspaceInput(): Unit {
        if (!inputBuffer.isEmpty()) {
            inputBuffer = inputBuffer.substring(0, inputBuffer.length - 1)
        }
    }
    
    // 处理小数点输入
    private func handleDecimalInput(): Unit {
        if (isNewCalculation || inputBuffer.isEmpty()) {
            inputBuffer = "0."
            isNewCalculation = false
        } else if (!inputBuffer.contains(".")) {
            inputBuffer += "."
        }
    }
    
    // 处理科学计算输入
    private func handleScientificInput(function: String): Unit {
        // TODO: 实现科学计算功能
        // 这里先实现平方根作为示例
        if (function == "√" && !inputBuffer.isEmpty()) {
            match (Float64.parse(inputBuffer)) {
                case Some(value) => {
                    match (engine.scientificCalculate(value, ScientificFunction.Sqrt)) {
                        case CalculationResult.Success(result) => {
                            inputBuffer = engine.formatNumber(result)
                            isNewCalculation = true
                        }
                        case CalculationResult.Error(message) => {
                            inputBuffer = "错误: ${message}"
                            isNewCalculation = true
                        }
                    }
                }
                case None => {
                    inputBuffer = "错误: 无效输入"
                    isNewCalculation = true
                }
            }
        }
    }
    
    // 更新显示
    private func updateDisplay(): Unit {
        let displayValue = inputBuffer.isEmpty() ? "0" : inputBuffer
        displayText.setText(displayValue)
    }
}

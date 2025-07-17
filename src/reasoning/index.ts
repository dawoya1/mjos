/**
 * MJOS Reasoning Engine
 * 魔剑工作室操作系统推理引擎
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/index';
import { 
  ReasoningRequest, 
  ReasoningResult, 
  ReasoningType, 
  ReasoningStep, 
  ReasoningAlternative,
  ReasoningConstraint 
} from '../types/index';

export interface Rule {
  id: string;
  name: string;
  condition: (context: any) => boolean;
  action: (context: any) => any;
  confidence: number;
  priority: number;
  metadata?: Record<string, any>;
}

export interface ReasoningEngineOptions {
  maxSteps?: number;
  timeout?: number;
  enableProbabilistic?: boolean;
  enableLearning?: boolean;
  confidenceThreshold?: number;
}

export class ReasoningEngine extends EventEmitter {
  private rules: Map<string, Rule> = new Map();
  private facts: Map<string, any> = new Map();
  private logger: Logger;
  private options: ReasoningEngineOptions;
  private activeRequests: Map<string, ReasoningRequest> = new Map();

  constructor(options: ReasoningEngineOptions = {}) {
    super();
    
    this.options = {
      maxSteps: options.maxSteps || 100,
      timeout: options.timeout || 30000, // 30 seconds
      enableProbabilistic: options.enableProbabilistic || true,
      enableLearning: options.enableLearning || false,
      confidenceThreshold: options.confidenceThreshold || 0.5,
      ...options
    };

    this.logger = new Logger('ReasoningEngine');
  }

  // Add rule to the knowledge base
  addRule(rule: Omit<Rule, 'id'>): string {
    const id = this.generateRuleId();
    const fullRule: Rule = { id, ...rule };
    
    this.rules.set(id, fullRule);
    this.emit('rule-added', fullRule);
    this.logger.debug(`Rule added: ${id} - ${rule.name}`);
    
    return id;
  }

  // Remove rule
  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      this.emit('rule-removed', rule);
      this.logger.debug(`Rule removed: ${ruleId}`);
      return true;
    }
    return false;
  }

  // Add fact to the knowledge base
  addFact(key: string, value: any): void {
    this.facts.set(key, value);
    this.emit('fact-added', { key, value });
    this.logger.debug(`Fact added: ${key}`);
  }

  // Remove fact
  removeFact(key: string): boolean {
    if (this.facts.has(key)) {
      this.facts.delete(key);
      this.emit('fact-removed', key);
      this.logger.debug(`Fact removed: ${key}`);
      return true;
    }
    return false;
  }

  // Perform reasoning
  async reason(request: ReasoningRequest): Promise<ReasoningResult> {
    this.activeRequests.set(request.id, request);
    
    try {
      const result = await this.performReasoning(request);
      this.activeRequests.delete(request.id);
      
      this.emit('reasoning-completed', result);
      return result;
    } catch (error) {
      this.activeRequests.delete(request.id);
      this.logger.error(`Reasoning failed for request ${request.id}`, error);
      throw error;
    }
  }

  private async performReasoning(request: ReasoningRequest): Promise<ReasoningResult> {
    const startTime = Date.now();
    const steps: ReasoningStep[] = [];
    const alternatives: ReasoningAlternative[] = [];
    
    // Create reasoning context
    const context = {
      ...request.context,
      facts: Object.fromEntries(this.facts),
      input: request.input,
      constraints: request.constraints || []
    };

    let conclusion: any;
    let confidence = 0;

    switch (request.type) {
    case 'deductive':
      ({ conclusion, confidence } = await this.deductiveReasoning(context, steps));
      break;
    case 'inductive':
      ({ conclusion, confidence } = await this.inductiveReasoning(context, steps));
      break;
    case 'abductive':
      ({ conclusion, confidence } = await this.abductiveReasoning(context, steps));
      break;
    case 'analogical':
      ({ conclusion, confidence } = await this.analogicalReasoning(context, steps));
      break;
    case 'causal':
      ({ conclusion, confidence } = await this.causalReasoning(context, steps));
      break;
    case 'probabilistic':
      ({ conclusion, confidence } = await this.probabilisticReasoning(context, steps));
      break;
    default:
      throw new Error(`Unsupported reasoning type: ${request.type}`);
    }

    // Generate alternatives if confidence is low
    if (confidence < this.options.confidenceThreshold!) {
      alternatives.push(...await this.generateAlternatives(context, request.type));
    }

    const result: ReasoningResult = {
      id: this.generateResultId(),
      requestId: request.id,
      conclusion,
      confidence,
      reasoning: steps,
      ...(alternatives.length > 0 ? { alternatives } : {}),
      metadata: {
        processingTime: Date.now() - startTime,
        rulesApplied: steps.filter(s => s.rule).length,
        reasoningType: request.type
      }
    };

    return result;
  }

  // Deductive reasoning: from general rules to specific conclusions
  private async deductiveReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    let currentContext = { ...context };
    let stepCount = 0;
    let totalConfidence = 1.0;

    // Apply rules in priority order
    const sortedRules = Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (stepCount >= this.options.maxSteps!) break;

      try {
        if (rule.condition(currentContext)) {
          const output = rule.action(currentContext);
          
          steps.push({
            step: stepCount + 1,
            type: 'deductive',
            input: currentContext,
            output,
            rule: rule.id,
            confidence: rule.confidence
          });

          currentContext = { ...currentContext, ...output };
          totalConfidence *= rule.confidence;
          stepCount++;

          this.logger.debug(`Applied rule: ${rule.name} (confidence: ${rule.confidence})`);
        }
      } catch (error) {
        this.logger.warn(`Rule application failed: ${rule.name}`, error);
      }
    }

    return {
      conclusion: currentContext,
      confidence: totalConfidence
    };
  }

  // Inductive reasoning: from specific observations to general patterns
  private async inductiveReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    const observations = context.input;
    if (!Array.isArray(observations)) {
      throw new Error('Inductive reasoning requires array of observations');
    }

    // Find patterns in observations
    const patterns = this.findPatterns(observations);
    let confidence = 0;

    if (patterns.length > 0) {
      // Select most frequent pattern
      const bestPattern = patterns.reduce((best, current) => 
        current.frequency > best.frequency ? current : best
      );

      confidence = Math.min(bestPattern.frequency / observations.length, 1.0);

      steps.push({
        step: 1,
        type: 'inductive',
        input: observations,
        output: bestPattern,
        confidence
      });

      return {
        conclusion: {
          pattern: bestPattern.pattern,
          generalization: bestPattern.rule,
          supportingEvidence: bestPattern.examples
        },
        confidence
      };
    }

    return {
      conclusion: { pattern: null, message: 'No significant patterns found' },
      confidence: 0
    };
  }

  // Abductive reasoning: inference to the best explanation
  private async abductiveReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    const observation = context.input;
    const possibleExplanations: Array<{ explanation: any; likelihood: number }> = [];

    // Generate possible explanations using rules
    for (const rule of this.rules.values()) {
      try {
        const explanation = rule.action(context);
        
        // Check if this explanation could lead to the observation
        const likelihood = this.calculateExplanationLikelihood(explanation, observation);
        
        if (likelihood > 0) {
          possibleExplanations.push({ explanation, likelihood: likelihood * rule.confidence });
        }
      } catch (error) {
        // Rule doesn't apply
      }
    }

    if (possibleExplanations.length === 0) {
      return {
        conclusion: { explanation: null, message: 'No plausible explanations found' },
        confidence: 0
      };
    }

    // Select best explanation
    const bestExplanation = possibleExplanations.reduce((best, current) => 
      current.likelihood > best.likelihood ? current : best
    );

    steps.push({
      step: 1,
      type: 'abductive',
      input: observation,
      output: bestExplanation.explanation,
      confidence: bestExplanation.likelihood
    });

    return {
      conclusion: {
        explanation: bestExplanation.explanation,
        alternatives: possibleExplanations.slice(0, 3).map(e => e.explanation)
      },
      confidence: bestExplanation.likelihood
    };
  }

  // Analogical reasoning: reasoning by analogy
  private async analogicalReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    const sourceCase = context.input.source;
    const targetCase = context.input.target;

    if (!sourceCase || !targetCase) {
      throw new Error('Analogical reasoning requires source and target cases');
    }

    // Find similarities between source and target
    const similarities = this.findSimilarities(sourceCase, targetCase);
    const analogyStrength = similarities.length / Math.max(Object.keys(sourceCase).length, Object.keys(targetCase).length);

    if (analogyStrength > 0.3) { // Minimum similarity threshold
      // Apply source solution to target
      const conclusion = this.applyAnalogy(sourceCase, targetCase, similarities);
      
      steps.push({
        step: 1,
        type: 'analogical',
        input: { source: sourceCase, target: targetCase },
        output: conclusion,
        confidence: analogyStrength
      });

      return { conclusion, confidence: analogyStrength };
    }

    return {
      conclusion: { message: 'Insufficient similarity for analogical reasoning' },
      confidence: 0
    };
  }

  // Causal reasoning: understanding cause and effect
  private async causalReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    const events = context.input;
    if (!Array.isArray(events)) {
      throw new Error('Causal reasoning requires array of events');
    }

    // Sort events by timestamp
    const sortedEvents = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Find potential causal relationships
    const causalChains = this.findCausalChains(sortedEvents);
    
    if (causalChains.length > 0) {
      const strongestChain = causalChains.reduce((best, current) => 
        current.strength > best.strength ? current : best
      );

      steps.push({
        step: 1,
        type: 'causal',
        input: sortedEvents,
        output: strongestChain,
        confidence: strongestChain.strength
      });

      return {
        conclusion: {
          causalChain: strongestChain.chain,
          rootCause: strongestChain.chain[0],
          finalEffect: strongestChain.chain[strongestChain.chain.length - 1]
        },
        confidence: strongestChain.strength
      };
    }

    return {
      conclusion: { message: 'No significant causal relationships found' },
      confidence: 0
    };
  }

  // Probabilistic reasoning: reasoning under uncertainty
  private async probabilisticReasoning(context: any, steps: ReasoningStep[]): Promise<{ conclusion: any; confidence: number }> {
    if (!this.options.enableProbabilistic) {
      throw new Error('Probabilistic reasoning is disabled');
    }

    const hypotheses = context.input.hypotheses || [];
    const evidence = context.input.evidence || {};

    if (hypotheses.length === 0) {
      throw new Error('Probabilistic reasoning requires hypotheses');
    }

    // Calculate posterior probabilities using Bayes' theorem (simplified)
    const posteriors = hypotheses.map((hypothesis: any) => {
      const prior = hypothesis.prior || 0.5;
      const likelihood = this.calculateLikelihood(evidence, hypothesis);
      const posterior = (likelihood * prior) / this.calculateNormalizationConstant(hypotheses, evidence);

      return {
        hypothesis: hypothesis.name,
        probability: posterior,
        evidence
      };
    });

    // Sort by probability
    posteriors.sort((a: any, b: any) => b.probability - a.probability);

    steps.push({
      step: 1,
      type: 'probabilistic',
      input: { hypotheses, evidence },
      output: posteriors,
      confidence: posteriors[0].probability
    });

    return {
      conclusion: {
        mostLikely: posteriors[0],
        allProbabilities: posteriors
      },
      confidence: posteriors[0].probability
    };
  }

  // Helper methods
  private findPatterns(observations: any[]): Array<{ pattern: any; frequency: number; rule: string; examples: any[] }> {
    // Simplified pattern finding - in practice, this would be more sophisticated
    const patterns: Map<string, { count: number; examples: any[]; originalValue: any }> = new Map();

    observations.forEach(obs => {
      const key = typeof obs === 'object' ? JSON.stringify(obs) : String(obs);
      if (!patterns.has(key)) {
        patterns.set(key, { count: 0, examples: [], originalValue: obs });
      }
      patterns.get(key)!.count++;
      patterns.get(key)!.examples.push(obs);
    });

    return Array.from(patterns.entries()).map(([patternKey, data]) => {
      let parsedPattern: any;
      try {
        // Try to parse as JSON if it looks like an object
        parsedPattern = patternKey.startsWith('{') || patternKey.startsWith('[')
          ? JSON.parse(patternKey)
          : patternKey;
      } catch (error) {
        // If parsing fails, use the original value
        parsedPattern = data.originalValue;
      }

      return {
        pattern: parsedPattern,
        frequency: data.count,
        rule: `Pattern observed: ${typeof parsedPattern === 'object' ? JSON.stringify(parsedPattern) : parsedPattern}`,
        examples: data.examples
      };
    });
  }

  private calculateExplanationLikelihood(explanation: any, observation: any): number {
    // Simplified likelihood calculation
    if (typeof explanation === 'object' && typeof observation === 'object') {
      const commonKeys = Object.keys(explanation).filter(key => key in observation);
      return commonKeys.length / Math.max(Object.keys(explanation).length, Object.keys(observation).length);
    }
    return explanation === observation ? 1.0 : 0.0;
  }

  private findSimilarities(source: any, target: any): string[] {
    const similarities: string[] = [];
    
    if (typeof source === 'object' && typeof target === 'object') {
      for (const key in source) {
        if (key in target && source[key] === target[key]) {
          similarities.push(key);
        }
      }
    }
    
    return similarities;
  }

  private applyAnalogy(source: any, target: any, similarities: string[]): any {
    const result = { ...target };
    
    // Apply source properties that might be relevant to target
    for (const key in source) {
      if (!similarities.includes(key) && !(key in target)) {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private findCausalChains(events: any[]): Array<{ chain: any[]; strength: number }> {
    const chains: Array<{ chain: any[]; strength: number }> = [];
    
    // Simple causal chain detection based on temporal proximity
    for (let i = 0; i < events.length - 1; i++) {
      const chain = [events[i]];
      let strength = 1.0;
      
      for (let j = i + 1; j < events.length; j++) {
        const timeDiff = new Date(events[j].timestamp).getTime() - new Date(events[i].timestamp).getTime();
        if (timeDiff < 60000) { // Within 1 minute
          chain.push(events[j]);
          strength *= 0.8; // Decay strength with chain length
        } else {
          break;
        }
      }
      
      if (chain.length > 1) {
        chains.push({ chain, strength });
      }
    }
    
    return chains;
  }

  private calculateLikelihood(_evidence: any, _hypothesis: any): number {
    // Simplified likelihood calculation
    return 0.7; // Placeholder
  }

  private calculateNormalizationConstant(_hypotheses: any[], _evidence: any): number {
    // Simplified normalization
    return 1.0; // Placeholder
  }

  private async generateAlternatives(_context: any, _reasoningType: ReasoningType): Promise<ReasoningAlternative[]> {
    // Generate alternative conclusions with lower confidence
    return [];
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStats(): {
    totalRules: number;
    totalFacts: number;
    activeRequests: number;
    completedReasoning: number;
    } {
    return {
      totalRules: this.rules.size,
      totalFacts: this.facts.size,
      activeRequests: this.activeRequests.size,
      completedReasoning: 0 // Would track this in practice
    };
  }

  // Clear all rules and facts
  clear(): void {
    this.rules.clear();
    this.facts.clear();
    this.activeRequests.clear();
    
    this.emit('cleared');
    this.logger.info('Reasoning engine cleared');
  }
}

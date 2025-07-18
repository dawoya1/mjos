"use strict";
/**
 * MJOS Software Development Kit
 * 魔剑工作室操作系统软件开发工具包
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJOSSDK = void 0;
const index_1 = require("../index");
const index_2 = require("../core/index");
class MJOSSDK {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: options.apiEndpoint || 'http://localhost:3000/api/v1',
            timeout: options.timeout || 30000,
            retryAttempts: options.retryAttempts || 3,
            enableLogging: options.enableLogging !== false,
            ...options
        };
        this.logger = new index_2.Logger('MJOSSDK');
        // If no API endpoint provided, use local MJOS instance
        if (!options.apiEndpoint) {
            this.mjos = new index_1.MJOS();
        }
    }
    // Memory Operations
    async storeMemory(content, tags = [], importance = 0.5, type) {
        if (this.mjos) {
            return this.mjos.getMemorySystem().store(content, tags, importance, type);
        }
        return this.makeAPICall('POST', '/memory/store', {
            content,
            tags,
            importance,
            type
        });
    }
    async queryMemory(query) {
        if (this.mjos) {
            return this.mjos.getMemorySystem().query(query);
        }
        const response = await this.makeAPICall('POST', '/memory/query', query);
        return response.results || [];
    }
    async getMemory(id) {
        if (this.mjos) {
            return this.mjos.getMemorySystem().retrieve(id);
        }
        return this.makeAPICall('GET', `/memory/${id}`);
    }
    // Knowledge Operations
    async addKnowledge(knowledgeData) {
        if (this.mjos) {
            return this.mjos.getKnowledgeGraph().add(knowledgeData);
        }
        const response = await this.makeAPICall('POST', '/knowledge/add', knowledgeData);
        return response.knowledgeId;
    }
    async searchKnowledge(query) {
        if (this.mjos) {
            return this.mjos.getKnowledgeGraph().query(query);
        }
        const response = await this.makeAPICall('POST', '/knowledge/query', query);
        return response.results || [];
    }
    // Context Operations
    async createSession(userId) {
        if (this.mjos) {
            return this.mjos.getContextManager().createSession(userId);
        }
        const response = await this.makeAPICall('POST', '/context/sessions', { userId });
        return response.sessionId;
    }
    async getSession(sessionId) {
        if (this.mjos) {
            return this.mjos.getContextManager().getSession(sessionId);
        }
        return this.makeAPICall('GET', `/context/sessions/${sessionId}`);
    }
    async addMessage(sessionId, role, content) {
        if (this.mjos) {
            return this.mjos.getContextManager().addMessage(sessionId, { role, content });
        }
        await this.makeAPICall('POST', `/context/sessions/${sessionId}/messages`, { role, content });
        return true;
    }
    // Reasoning Operations
    async reason(type, input, context = {}) {
        if (this.mjos) {
            return this.mjos.reason(type, input, context);
        }
        return this.makeAPICall('POST', '/reasoning/reason', { type, input, context });
    }
    // Team Operations
    async getTeamMembers() {
        if (this.mjos) {
            return this.mjos.getTeamManager().getAllMembers();
        }
        const response = await this.makeAPICall('GET', '/team/members');
        return response.members || [];
    }
    async createTask(title, description) {
        if (this.mjos) {
            return this.mjos.createTask(title, description);
        }
        const response = await this.makeAPICall('POST', '/team/tasks', { title, description });
        return response.taskId;
    }
    async getTasks() {
        if (this.mjos) {
            return this.mjos.getTeamManager().getTasks();
        }
        const response = await this.makeAPICall('GET', '/team/tasks');
        return response.tasks || [];
    }
    // Performance Operations
    async getPerformanceMetrics() {
        if (this.mjos) {
            return this.mjos.getPerformanceMetrics();
        }
        return this.makeAPICall('GET', '/performance/metrics');
    }
    async getPerformanceSummary() {
        if (this.mjos) {
            return this.mjos.getPerformanceSummary();
        }
        return this.makeAPICall('GET', '/performance/summary');
    }
    // System Operations
    async getSystemStatus() {
        if (this.mjos) {
            return this.mjos.getStatus();
        }
        return this.makeAPICall('GET', '/status');
    }
    // Workflow Operations
    async executeWorkflow(workflowId, variables) {
        if (this.mjos) {
            return this.mjos.executeWorkflow(workflowId, variables);
        }
        const response = await this.makeAPICall('POST', `/workflow/execute/${workflowId}`, { variables });
        return response.executionId;
    }
    // Agent Operations
    async createAgent(definition) {
        if (this.mjos) {
            return this.mjos.createAgent(definition);
        }
        const response = await this.makeAPICall('POST', '/agents', definition);
        return response.agentId;
    }
    async assignTaskToAgent(taskId, agentId) {
        if (this.mjos) {
            return this.mjos.assignTaskToAgent(taskId, agentId);
        }
        const response = await this.makeAPICall('POST', '/agents/assign', { taskId, agentId });
        return response.assignmentId;
    }
    // Communication Operations
    async sendMessage(from, to, content, type = 'notification') {
        if (this.mjos) {
            return this.mjos.sendMessage(from, to, content, type);
        }
        const response = await this.makeAPICall('POST', '/communication/messages', { from, to, content, type });
        return response.messageId;
    }
    async createChannel(name, participants, type = 'multicast') {
        if (this.mjos) {
            return this.mjos.createCommunicationChannel(name, participants, type);
        }
        const response = await this.makeAPICall('POST', '/communication/channels', { name, participants, type });
        return response.channelId;
    }
    // Utility Methods
    async makeAPICall(method, endpoint, data) {
        const url = `${this.options.apiEndpoint}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.options.apiKey ? { 'Authorization': `Bearer ${this.options.apiKey}` } : {})
            },
            ...(data ? { body: JSON.stringify(data) } : {})
        };
        let lastError = null;
        for (let attempt = 0; attempt < this.options.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || result.message || 'API call failed');
                }
                return result.data;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.options.retryAttempts - 1) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('API call failed after retries');
    }
    // Code Generation
    generateCode(options) {
        const { language, includeTypes = true, includeExamples = true } = options;
        switch (language) {
            case 'typescript':
                return this.generateTypeScriptCode(includeTypes, includeExamples);
            case 'javascript':
                return this.generateJavaScriptCode(includeExamples);
            case 'python':
                return this.generatePythonCode(includeExamples);
            case 'java':
                return this.generateJavaCode(includeExamples);
            case 'csharp':
                return this.generateCSharpCode(includeExamples);
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }
    generateTypeScriptCode(includeTypes, includeExamples) {
        let code = `// MJOS TypeScript SDK
import { MJOSSDK } from 'mjos-sdk';

const sdk = new MJOSSDK({
  apiEndpoint: 'http://localhost:3000/api/v1',
  apiKey: 'your-api-key'
});
`;
        if (includeTypes) {
            code += `
// Type definitions
interface MemoryQuery {
  tags?: string[];
  limit?: number;
  importance?: number;
}

interface KnowledgeData {
  type: string;
  content: any;
  metadata: Record<string, any>;
}
`;
        }
        if (includeExamples) {
            code += `
// Examples
async function examples() {
  // Store memory
  const memoryId = await sdk.storeMemory('Hello World', ['greeting'], 0.8);
  
  // Query memory
  const memories = await sdk.queryMemory({ tags: ['greeting'] });
  
  // Add knowledge
  const knowledgeId = await sdk.addKnowledge({
    type: 'fact',
    content: 'TypeScript is a superset of JavaScript',
    metadata: { domain: 'programming', confidence: 0.9 }
  });
  
  // Create task
  const taskId = await sdk.createTask('Review code', 'Review the new feature implementation');
  
  // Get system status
  const status = await sdk.getSystemStatus();
  console.log('System status:', status);
}
`;
        }
        return code;
    }
    generateJavaScriptCode(includeExamples) {
        let code = `// MJOS JavaScript SDK
const { MJOSSDK } = require('mjos-sdk');

const sdk = new MJOSSDK({
  apiEndpoint: 'http://localhost:3000/api/v1',
  apiKey: 'your-api-key'
});
`;
        if (includeExamples) {
            code += `
// Examples
async function examples() {
  try {
    // Store memory
    const memoryId = await sdk.storeMemory('Hello World', ['greeting'], 0.8);
    console.log('Memory stored:', memoryId);
    
    // Query memory
    const memories = await sdk.queryMemory({ tags: ['greeting'] });
    console.log('Found memories:', memories.length);
    
    // Create task
    const taskId = await sdk.createTask('Review code', 'Review the new feature implementation');
    console.log('Task created:', taskId);
    
    // Get performance metrics
    const metrics = await sdk.getPerformanceMetrics();
    console.log('Performance metrics:', metrics);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

examples();
`;
        }
        return code;
    }
    generatePythonCode(includeExamples) {
        let code = `# MJOS Python SDK
import requests
import json
from typing import Dict, List, Any, Optional

class MJOSSDK:
    def __init__(self, api_endpoint: str = "http://localhost:3000/api/v1", api_key: Optional[str] = None):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Any:
        url = f"{self.api_endpoint}{endpoint}"
        response = self.session.request(method, url, json=data)
        response.raise_for_status()
        result = response.json()
        if not result.get("success"):
            raise Exception(result.get("error", "API call failed"))
        return result.get("data")
    
    def store_memory(self, content: Any, tags: List[str] = None, importance: float = 0.5, type_: Optional[str] = None) -> str:
        return self._make_request("POST", "/memory/store", {
            "content": content,
            "tags": tags or [],
            "importance": importance,
            "type": type_
        })
    
    def query_memory(self, query: Dict) -> List[Dict]:
        result = self._make_request("POST", "/memory/query", query)
        return result.get("results", [])
    
    def create_task(self, title: str, description: str) -> str:
        result = self._make_request("POST", "/team/tasks", {
            "title": title,
            "description": description
        })
        return result.get("taskId")
`;
        if (includeExamples) {
            code += `

# Examples
def main():
    sdk = MJOSSDK(api_key="your-api-key")
    
    try:
        # Store memory
        memory_id = sdk.store_memory("Hello World", ["greeting"], 0.8)
        print(f"Memory stored: {memory_id}")
        
        # Query memory
        memories = sdk.query_memory({"tags": ["greeting"]})
        print(f"Found {len(memories)} memories")
        
        # Create task
        task_id = sdk.create_task("Review code", "Review the new feature implementation")
        print(f"Task created: {task_id}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
`;
        }
        return code;
    }
    generateJavaCode(includeExamples) {
        let code = `// MJOS Java SDK
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

public class MJOSSDK {
    private final String apiEndpoint;
    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public MJOSSDK(String apiEndpoint, String apiKey) {
        this.apiEndpoint = apiEndpoint != null ? apiEndpoint : "http://localhost:3000/api/v1";
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    public String storeMemory(Object content, List<String> tags, double importance, String type) throws Exception {
        Map<String, Object> data = Map.of(
            "content", content,
            "tags", tags != null ? tags : List.of(),
            "importance", importance,
            "type", type != null ? type : ""
        );
        
        return makeRequest("POST", "/memory/store", data, String.class);
    }
    
    public String createTask(String title, String description) throws Exception {
        Map<String, Object> data = Map.of(
            "title", title,
            "description", description
        );
        
        Map<String, Object> result = makeRequest("POST", "/team/tasks", data, Map.class);
        return (String) result.get("taskId");
    }
    
    private <T> T makeRequest(String method, String endpoint, Object data, Class<T> responseType) throws Exception {
        String url = apiEndpoint + endpoint;
        String jsonData = data != null ? objectMapper.writeValueAsString(data) : "";
        
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json");
            
        if (apiKey != null) {
            requestBuilder.header("Authorization", "Bearer " + apiKey);
        }
        
        HttpRequest request = requestBuilder
            .method(method, HttpRequest.BodyPublishers.ofString(jsonData))
            .build();
            
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        
        Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
        if (!(Boolean) result.get("success")) {
            throw new RuntimeException((String) result.get("error"));
        }
        
        return objectMapper.convertValue(result.get("data"), responseType);
    }
}
`;
        if (includeExamples) {
            code += `

// Example usage
public class MJOSExample {
    public static void main(String[] args) {
        try {
            MJOSSDK sdk = new MJOSSDK("http://localhost:3000/api/v1", "your-api-key");
            
            // Store memory
            String memoryId = sdk.storeMemory("Hello World", List.of("greeting"), 0.8, null);
            System.out.println("Memory stored: " + memoryId);
            
            // Create task
            String taskId = sdk.createTask("Review code", "Review the new feature implementation");
            System.out.println("Task created: " + taskId);
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
`;
        }
        return code;
    }
    generateCSharpCode(includeExamples) {
        let code = `// MJOS C# SDK
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class MJOSSDK
{
    private readonly string _apiEndpoint;
    private readonly string _apiKey;
    private readonly HttpClient _httpClient;
    
    public MJOSSDK(string apiEndpoint = "http://localhost:3000/api/v1", string apiKey = null)
    {
        _apiEndpoint = apiEndpoint;
        _apiKey = apiKey;
        _httpClient = new HttpClient();
        
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        }
    }
    
    public async Task<string> StoreMemoryAsync(object content, List<string> tags = null, double importance = 0.5, string type = null)
    {
        var data = new
        {
            content = content,
            tags = tags ?? new List<string>(),
            importance = importance,
            type = type
        };
        
        return await MakeRequestAsync<string>("POST", "/memory/store", data);
    }
    
    public async Task<string> CreateTaskAsync(string title, string description)
    {
        var data = new { title, description };
        var result = await MakeRequestAsync<Dictionary<string, object>>("POST", "/team/tasks", data);
        return result["taskId"].ToString();
    }
    
    private async Task<T> MakeRequestAsync<T>(string method, string endpoint, object data = null)
    {
        var url = _apiEndpoint + endpoint;
        var json = data != null ? JsonSerializer.Serialize(data) : "";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        HttpResponseMessage response = method.ToUpper() switch
        {
            "GET" => await _httpClient.GetAsync(url),
            "POST" => await _httpClient.PostAsync(url, content),
            "PUT" => await _httpClient.PutAsync(url, content),
            "DELETE" => await _httpClient.DeleteAsync(url),
            _ => throw new ArgumentException($"Unsupported HTTP method: {method}")
        };
        
        response.EnsureSuccessStatusCode();
        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseJson);
        
        if (!(bool)result["success"])
        {
            throw new Exception(result["error"].ToString());
        }
        
        return JsonSerializer.Deserialize<T>(result["data"].ToString());
    }
}
`;
        if (includeExamples) {
            code += `

// Example usage
class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            var sdk = new MJOSSDK(apiKey: "your-api-key");
            
            // Store memory
            var memoryId = await sdk.StoreMemoryAsync("Hello World", new List<string> { "greeting" }, 0.8);
            Console.WriteLine($"Memory stored: {memoryId}");
            
            // Create task
            var taskId = await sdk.CreateTaskAsync("Review code", "Review the new feature implementation");
            Console.WriteLine($"Task created: {taskId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}
`;
        }
        return code;
    }
    // Documentation Generation
    generateDocumentation(options) {
        const { format, includeExamples = true, includeAPI = true } = options;
        switch (format) {
            case 'markdown':
                return this.generateMarkdownDocs(includeExamples, includeAPI);
            case 'html':
                return this.generateHTMLDocs(includeExamples, includeAPI);
            default:
                throw new Error(`Unsupported documentation format: ${format}`);
        }
    }
    generateMarkdownDocs(includeExamples, includeAPI) {
        let docs = `# MJOS SDK Documentation

## Overview

The MJOS SDK provides a comprehensive interface for interacting with the Magic Sword Studio Operating System. It supports both local and remote API access, making it easy to integrate MJOS capabilities into your applications.

## Installation

\`\`\`bash
npm install mjos-sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { MJOSSDK } from 'mjos-sdk';

const sdk = new MJOSSDK({
  apiEndpoint: 'http://localhost:3000/api/v1',
  apiKey: 'your-api-key'
});
\`\`\`
`;
        if (includeAPI) {
            docs += `
## API Reference

### Memory Operations

#### storeMemory(content, tags?, importance?, type?)
Stores content in the memory system.

**Parameters:**
- \`content\` (any): The content to store
- \`tags\` (string[]): Optional tags for categorization
- \`importance\` (number): Importance score (0-1)
- \`type\` (string): Optional memory type

**Returns:** Promise<string> - Memory ID

#### queryMemory(query)
Queries the memory system.

**Parameters:**
- \`query\` (object): Query parameters

**Returns:** Promise<any[]> - Array of matching memories

### Knowledge Operations

#### addKnowledge(knowledgeData)
Adds knowledge to the knowledge graph.

#### searchKnowledge(query)
Searches the knowledge graph.

### Task Operations

#### createTask(title, description)
Creates a new task.

#### getTasks()
Retrieves all tasks.

### System Operations

#### getSystemStatus()
Gets the current system status.

#### getPerformanceMetrics()
Gets performance metrics.
`;
        }
        if (includeExamples) {
            docs += `
## Examples

### Basic Usage

\`\`\`typescript
// Store memory
const memoryId = await sdk.storeMemory('Important information', ['work'], 0.8);

// Query memory
const memories = await sdk.queryMemory({ tags: ['work'] });

// Create task
const taskId = await sdk.createTask('Review document', 'Please review the attached document');

// Get system status
const status = await sdk.getSystemStatus();
console.log('System is', status.engine.running ? 'running' : 'stopped');
\`\`\`

### Advanced Usage

\`\`\`typescript
// Add knowledge with relationships
const knowledgeId = await sdk.addKnowledge({
  type: 'concept',
  content: 'Machine Learning',
  metadata: {
    domain: 'AI',
    confidence: 0.9,
    tags: ['AI', 'ML', 'technology']
  }
});

// Execute workflow
const executionId = await sdk.executeWorkflow('task_assignment', {
  task: { title: 'New feature', priority: 'high' }
});

// Create agent
const agentId = await sdk.createAgent({
  name: 'Code Reviewer',
  type: 'deliberative',
  capabilities: ['code_analysis', 'quality_check']
});
\`\`\`
`;
        }
        return docs;
    }
    generateHTMLDocs(includeExamples, includeAPI) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>MJOS SDK Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .method { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; }
    </style>
</head>
<body>
    <h1>MJOS SDK Documentation</h1>
    
    <h2>Overview</h2>
    <p>The MJOS SDK provides a comprehensive interface for interacting with the Magic Sword Studio Operating System.</p>
    
    <h2>Installation</h2>
    <pre><code>npm install mjos-sdk</code></pre>
    
    <h2>Quick Start</h2>
    <pre><code>import { MJOSSDK } from 'mjos-sdk';

const sdk = new MJOSSDK({
  apiEndpoint: 'http://localhost:3000/api/v1',
  apiKey: 'your-api-key'
});</code></pre>

    ${includeAPI ? `
    <h2>API Reference</h2>
    
    <div class="method">
        <h3>storeMemory(content, tags?, importance?, type?)</h3>
        <p>Stores content in the memory system.</p>
        <p><strong>Returns:</strong> Promise&lt;string&gt; - Memory ID</p>
    </div>
    
    <div class="method">
        <h3>queryMemory(query)</h3>
        <p>Queries the memory system.</p>
        <p><strong>Returns:</strong> Promise&lt;any[]&gt; - Array of matching memories</p>
    </div>
    
    <div class="method">
        <h3>createTask(title, description)</h3>
        <p>Creates a new task.</p>
        <p><strong>Returns:</strong> Promise&lt;string&gt; - Task ID</p>
    </div>
    ` : ''}

    ${includeExamples ? `
    <h2>Examples</h2>
    
    <h3>Basic Usage</h3>
    <pre><code>// Store memory
const memoryId = await sdk.storeMemory('Important information', ['work'], 0.8);

// Create task
const taskId = await sdk.createTask('Review document', 'Please review the attached document');

// Get system status
const status = await sdk.getSystemStatus();</code></pre>
    ` : ''}

</body>
</html>`;
    }
    // Cleanup
    destroy() {
        if (this.mjos) {
            // Clean up local MJOS instance if needed
        }
    }
}
exports.MJOSSDK = MJOSSDK;
// MJOSSDK is already exported above
//# sourceMappingURL=index.js.map
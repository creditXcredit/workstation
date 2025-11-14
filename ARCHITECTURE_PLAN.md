# UI & Backend Data Flow Architecture Plan

## Executive Summary

This document outlines the complete wiring plan for integrating a sleek, minimal UI with real-time charting, Supabase MCP integration, NVIDIA compute backend, and cable-free infrastructure synchronization with HuggingFace model quantization support.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Vite UI    │  │  Real-time   │  │   3D Graph   │             │
│  │   (React)    │←→│   Charts     │←→│   Visualizer │             │
│  │  TypeScript  │  │  (D3/Three)  │  │   (Three.js) │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket (Real-time)
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  FastAPI     │  │  WebSocket   │  │   GraphQL    │             │
│  │  REST API    │  │   Server     │  │   Endpoint   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Browser Agent (Existing System)                     │  │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐ │  │
│  │  │ Security   │ │   LLM    │ │ Automation │ │ Coordination│ │  │
│  │  └────────────┘ └──────────┘ └────────────┘ └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Supabase    │  │   Vector DB  │  │   Redis      │             │
│  │  PostgreSQL  │  │   (pgvector) │  │   Cache      │             │
│  │  (Primary)   │  │  (Embeddings)│  │  (Fast RTD)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPUTE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   NVIDIA     │  │  HuggingFace │  │   Ollama     │             │
│  │   Triton     │  │   Models     │  │   Local LLM  │             │
│  │   (Inference)│  │  (Quant 4bit)│  │  (Fallback)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   S3/R2      │  │  Time Series │  │   Archive    │             │
│  │   (Hot Data) │  │  (InfluxDB)  │  │  (Glacier)   │             │
│  │   CDN Edge   │  │  (Metrics)   │  │  (Cold)      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Frontend UI Layer (Sleek & Minimal)

#### Tech Stack
- **Framework**: React 18 + TypeScript + Vite (Fast HMR)
- **UI Library**: Tailwind CSS + shadcn/ui (Minimal, accessible)
- **Charting**: 
  - Apache ECharts (2D real-time charts, WebGL acceleration)
  - Three.js + React Three Fiber (3D graph visualization)
  - D3.js (Custom data-driven visualizations)
- **State Management**: Zustand (Lightweight, no boilerplate)
- **Real-time**: Socket.IO Client + React Query

#### Key Components

```typescript
// Component Structure
src/ui/
├── components/
│   ├── Dashboard/
│   │   ├── LiveMetrics.tsx       // Real-time system health
│   │   ├── ProcessFlow.tsx       // Agentic workflow visualization
│   │   └── PerformanceCharts.tsx // Time-series performance data
│   ├── Graphs/
│   │   ├── NetworkGraph3D.tsx    // 3D agent coordination graph
│   │   ├── DependencyTree.tsx    // Task dependency visualization
│   │   └── FlowDiagram.tsx       // Data flow modeling
│   ├── Monitoring/
│   │   ├── LogStream.tsx         // Real-time log viewer
│   │   ├── AlertPanel.tsx        // Error and warning alerts
│   │   └── HealthMonitor.tsx     // System health dashboard
│   └── Controls/
│       ├── TaskQueue.tsx         // Manual task submission
│       ├── AgentControls.tsx     // Agent management
│       └── ConfigPanel.tsx       // System configuration
├── hooks/
│   ├── useWebSocket.ts           // WebSocket connection hook
│   ├── useRealTimeData.ts        // Real-time data subscription
│   └── useChartData.ts           // Chart data transformation
├── stores/
│   ├── systemStore.ts            // Global system state
│   ├── metricsStore.ts           // Performance metrics
│   └── agentStore.ts             // Agent coordination state
└── services/
    ├── api.ts                    // REST API client
    ├── websocket.ts              // WebSocket service
    └── graphql.ts                // GraphQL client
```

#### Design System (Minimal & Non-Distracting)

```css
/* Color Palette - Dark theme, low contrast for focus */
:root {
  --bg-primary: #0a0e14;        /* Deep background */
  --bg-secondary: #161b22;      /* Card background */
  --text-primary: #c9d1d9;      /* Primary text */
  --text-secondary: #8b949e;    /* Secondary text */
  --accent-primary: #58a6ff;    /* Links, highlights */
  --accent-success: #3fb950;    /* Success states */
  --accent-warning: #d29922;    /* Warning states */
  --accent-error: #f85149;      /* Error states */
  --border: #30363d;            /* Subtle borders */
}

/* Minimal Layout Principles */
- Single column focus area
- Hidden scrollbars (show on hover)
- Floating action buttons (FAB) for controls
- Collapsible sidebars (auto-hide)
- Full-screen chart mode
- Keyboard shortcuts for all actions
```

### 2. API Gateway Layer

#### Tech Stack
- **Framework**: FastAPI (Python) - High performance, async
- **WebSocket**: Socket.IO (Bidirectional real-time)
- **GraphQL**: Strawberry GraphQL (TypeScript-like types)
- **Auth**: JWT tokens via Supabase Auth
- **Rate Limiting**: Redis-based sliding window

#### API Structure

```python
# Backend API Structure
api/
├── routers/
│   ├── agents.py              # Agent CRUD operations
│   ├── tasks.py               # Task management
│   ├── metrics.py             # Performance metrics
│   ├── logs.py                # Log streaming
│   └── system.py              # System health & config
├── websocket/
│   ├── events.py              # WebSocket event handlers
│   ├── rooms.py               # Room management (per agent)
│   └── streams.py             # Data streaming logic
├── graphql/
│   ├── schema.py              # GraphQL schema
│   ├── resolvers.py           # Query/mutation resolvers
│   └── subscriptions.py       # Real-time subscriptions
├── middleware/
│   ├── auth.py                # JWT validation
│   ├── rate_limit.py          # Rate limiting
│   └── logging.py             # Request logging
└── services/
    ├── agent_service.py       # Bridge to browser agent
    ├── metrics_service.py     # Metrics aggregation
    └── storage_service.py     # Data persistence
```

#### Key Endpoints

```typescript
// REST API
GET    /api/v1/agents                    // List all agents
POST   /api/v1/agents                    // Create agent
GET    /api/v1/agents/{id}/health        // Agent health
GET    /api/v1/agents/{id}/metrics       // Agent metrics
POST   /api/v1/tasks                     // Submit task
GET    /api/v1/tasks/{id}/status         // Task status
GET    /api/v1/system/health             // System health
GET    /api/v1/logs/stream               // SSE log stream

// WebSocket Events
connect     -> authenticate
subscribe   -> metrics, logs, agent_status
publish     -> task_update, health_change, error_alert
disconnect  -> cleanup

// GraphQL
query {
  agents { id, status, metrics }
  tasks(status: RUNNING) { id, progress }
  systemHealth { cpu, memory, agents }
}
subscription {
  metricsUpdated { agentId, metrics }
  taskStatusChanged { taskId, status }
}
```

### 3. Data Synchronization Layer

#### Supabase Integration

```typescript
// Supabase MCP (Model-Context-Protocol) Configuration
supabase/
├── schema/
│   ├── agents.sql             // Agent metadata
│   ├── tasks.sql              // Task history
│   ├── metrics.sql            // Time-series metrics
│   ├── logs.sql               // Structured logs
│   ├── checkpoints.sql        // State checkpoints
│   └── embeddings.sql         // Vector embeddings (pgvector)
├── functions/
│   ├── aggregate_metrics.sql  // Real-time aggregation
│   ├── cleanup_old_data.sql   // Data retention
│   └── backup_checkpoint.sql  // Checkpoint backup
├── triggers/
│   ├── metrics_insert.sql     // Auto-update materialized views
│   └── log_retention.sql      // Auto-delete old logs
└── realtime/
    └── subscriptions.sql      // Realtime channel config
```

#### Database Schema

```sql
-- Core Tables
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'idle', 'error', 'stopped')),
  capabilities JSONB,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  dependencies UUID[],
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE metrics (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  metric_type TEXT NOT NULL,
  value DOUBLE PRECISION,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  embedding vector(1536),  -- OpenAI/HF embedding size
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertable for time-series (if using TimescaleDB)
SELECT create_hypertable('metrics', 'timestamp');

-- Indexes for performance
CREATE INDEX idx_metrics_agent_timestamp ON metrics(agent_id, timestamp DESC);
CREATE INDEX idx_tasks_agent_status ON tasks(agent_id, status);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### Data Flow Synchronization Strategy

```typescript
// Data Flow Layers
1. Hot Path (Real-time, <100ms latency)
   - Redis pub/sub for live metrics
   - WebSocket for UI updates
   - In-memory cache (agent state)

2. Warm Path (Fast retrieval, <1s latency)
   - Supabase realtime subscriptions
   - PostgreSQL for recent data (last 7 days)
   - Redis cache for frequent queries

3. Cold Path (Long-term storage, <5s latency)
   - S3/R2 for historical data (>7 days)
   - Compressed JSONL format
   - Lazy loading on demand

4. Archive Path (Light store, retrieval on request)
   - Glacier for >1 year old data
   - Compressed + encrypted
   - Restore takes minutes
```

#### Sync Architecture

```typescript
// Dual-write with eventual consistency
class DataSyncManager {
  async writeMetric(metric: Metric) {
    // 1. Write to Redis (real-time)
    await this.redis.publish('metrics', metric);
    
    // 2. Buffer write to Supabase (batched)
    this.batchBuffer.add(metric);
    
    // 3. Background: Flush buffer every 5 seconds
    // 4. Background: Move old data to S3 every hour
    // 5. Background: Archive to Glacier weekly
  }

  async readMetric(agentId: string, timeRange: TimeRange) {
    // 1. Try Redis first (last 5 minutes)
    let data = await this.redis.get(`metrics:${agentId}`);
    
    // 2. Try Supabase (last 7 days)
    if (!data) {
      data = await this.supabase
        .from('metrics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);
    }
    
    // 3. Try S3 (historical)
    if (!data && timeRange.start < sevenDaysAgo) {
      data = await this.s3.getObject(`metrics/${agentId}/${timeRange.start}.jsonl`);
    }
    
    return data;
  }
}
```

### 4. NVIDIA Compute Integration

#### Triton Inference Server Configuration

```yaml
# triton/config.pbtxt
name: "browser_agent_llm"
platform: "onnxruntime_onnx"
max_batch_size: 32
input [
  {
    name: "input_ids"
    data_type: TYPE_INT64
    dims: [-1, -1]
  }
]
output [
  {
    name: "output_ids"
    data_type: TYPE_INT64
    dims: [-1, -1]
  }
]
instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [0, 1]
  }
]
optimization {
  cuda {
    graphs: true
  }
}
```

#### Integration Architecture

```typescript
// NVIDIA Compute Integration
class NVIDIAComputeManager {
  private tritonClient: TritonClient;
  private modelCache: Map<string, ModelHandle>;

  async initialize() {
    // Connect to Triton Inference Server
    this.tritonClient = new TritonClient('localhost:8001');
    
    // Load quantized models from HuggingFace
    await this.loadModel('codellama-7b-4bit', 'CodeLlama-7b-Instruct-GPTQ');
    await this.loadModel('mistral-7b-4bit', 'Mistral-7B-Instruct-v0.2-GPTQ');
  }

  async inference(modelId: string, input: string): Promise<string> {
    // 1. Check if NVIDIA GPU available
    if (!this.isGPUAvailable()) {
      // Fallback to Ollama (local CPU)
      return this.ollamaFallback(input);
    }

    // 2. Tokenize input
    const tokens = await this.tokenize(input);

    // 3. Run inference on Triton
    const output = await this.tritonClient.infer({
      model: modelId,
      inputs: { input_ids: tokens },
      outputs: ['output_ids']
    });

    // 4. Decode output
    return this.decode(output.output_ids);
  }

  // Dynamic batching for efficiency
  async batchInference(requests: InferenceRequest[]): Promise<string[]> {
    const batched = this.createBatch(requests);
    const results = await this.tritonClient.infer(batched);
    return this.splitBatch(results);
  }
}
```

### 5. HuggingFace Model Quantization

#### Model Selection & Quantization Strategy

```python
# models/quantize_hf_models.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from optimum.gptq import GPTQQuantizer
import torch

def quantize_model_for_edge(model_name: str, bits: int = 4):
    """
    Quantize HuggingFace models for cable-free edge deployment
    """
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    # GPTQ Quantization (4-bit)
    quantizer = GPTQQuantizer(
        bits=bits,
        dataset="c4",  # Calibration dataset
        block_name_to_quantize="model.layers",
        model_seqlen=2048
    )

    # Quantize
    quantized_model = quantizer.quantize_model(model, tokenizer)

    # Save
    quantized_model.save_pretrained(f"./models/{model_name}-{bits}bit")
    tokenizer.save_pretrained(f"./models/{model_name}-{bits}bit")

    print(f"Model size reduced: {get_model_size(model)} -> {get_model_size(quantized_model)}")

# Recommended models for browser agent
MODELS_TO_QUANTIZE = [
    "codellama/CodeLlama-7b-Instruct-hf",      # Code tasks
    "mistralai/Mistral-7B-Instruct-v0.2",      # General reasoning
    "meta-llama/Llama-2-7b-chat-hf",           # Conversation
    "bigcode/starcoder2-7b",                   # Code completion
]
```

#### Quantization Levels

```typescript
// Quantization trade-offs
interface QuantizationLevel {
  bits: number;
  sizeReduction: string;
  qualityLoss: string;
  inference: string;
  useCase: string;
}

const QUANT_LEVELS: QuantizationLevel[] = [
  {
    bits: 16,
    sizeReduction: '50%',
    qualityLoss: 'Negligible',
    inference: 'Fast',
    useCase: 'High-quality analysis'
  },
  {
    bits: 8,
    sizeReduction: '75%',
    qualityLoss: 'Minimal (<2%)',
    inference: 'Very Fast',
    useCase: 'Production recommended'
  },
  {
    bits: 4,
    sizeReduction: '87.5%',
    qualityLoss: 'Acceptable (5-10%)',
    inference: 'Extremely Fast',
    useCase: 'Edge/Mobile deployment'
  }
];
```

### 6. Cable-Free Infrastructure Sync

#### Wireless Fiber Optics Integration

```typescript
// infrastructure/wireless_sync.ts
class WirelessSyncManager {
  private connections: Map<string, WirelessConnection>;
  private syncState: SyncState;

  async initialize() {
    // Discover wireless fiber optic endpoints
    const endpoints = await this.discoverEndpoints();
    
    // Establish connections
    for (const endpoint of endpoints) {
      await this.connect(endpoint);
    }

    // Start sync daemon
    this.startSyncDaemon();
  }

  async syncData(data: Data, priority: Priority) {
    // 1. Check connection quality
    const quality = await this.checkConnectionQuality();

    if (quality > 0.95) {
      // High quality: Real-time sync
      return this.realtimeSync(data);
    } else if (quality > 0.80) {
      // Medium quality: Batched sync
      return this.batchedSync(data);
    } else {
      // Low quality: Queue for later
      return this.queueSync(data);
    }
  }

  private startSyncDaemon() {
    setInterval(async () => {
      // 1. Check pending queue
      const pending = await this.getPendingSync();

      // 2. Sync in priority order
      for (const item of pending) {
        try {
          await this.syncData(item.data, item.priority);
          await this.markSynced(item.id);
        } catch (error) {
          await this.handleSyncError(error, item);
        }
      }

      // 3. Verify integrity
      await this.verifyIntegrity();
    }, 5000); // Every 5 seconds
  }

  async verifyIntegrity() {
    // Compare checksums across all nodes
    const localChecksum = await this.computeChecksum();
    const remoteChecksums = await this.fetchRemoteChecksums();

    for (const [node, checksum] of remoteChecksums) {
      if (checksum !== localChecksum) {
        await this.reconcileNode(node);
      }
    }
  }
}
```

#### Sync Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CABLE-FREE SYNC LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │  Local   │◄────►│ Wireless │◄────►│  Cloud   │        │
│  │  Cache   │      │   Fiber  │      │  Backup  │        │
│  │  (Edge)  │      │  Network │      │ (Central)│        │
│  └──────────┘      └──────────┘      └──────────┘        │
│       │                  │                  │             │
│       │                  │                  │             │
│  ┌────▼──────────────────▼──────────────────▼──────┐     │
│  │         Conflict Resolution Layer               │     │
│  │  - CRDTs for eventual consistency               │     │
│  │  - Vector clocks for ordering                   │     │
│  │  - Last-write-wins with timestamps              │     │
│  └────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Wiring Plan

### Phase 1: Foundation (Week 1)
1. ✅ Set up Vite + React + TypeScript project
2. ✅ Design minimal UI components (shadcn/ui)
3. ✅ Set up FastAPI backend
4. ✅ Configure Supabase project and schema
5. ✅ Implement authentication layer

### Phase 2: Real-time Infrastructure (Week 2)
1. ✅ Implement WebSocket server (Socket.IO)
2. ✅ Set up Redis for pub/sub
3. ✅ Create data sync manager
4. ✅ Implement live charting components
5. ✅ Connect UI to backend via WebSocket

### Phase 3: Data Flow (Week 3)
1. ✅ Implement hot/warm/cold data paths
2. ✅ Set up S3/R2 for historical data
3. ✅ Configure TimescaleDB for time-series
4. ✅ Implement data retention policies
5. ✅ Create backup and restore system

### Phase 4: NVIDIA Compute (Week 4)
1. ✅ Set up NVIDIA Triton Inference Server
2. ✅ Integrate with HuggingFace models
3. ✅ Implement 4-bit quantization pipeline
4. ✅ Create fallback to Ollama
5. ✅ Benchmark and optimize

### Phase 5: Wireless Sync (Week 5)
1. ✅ Implement wireless fiber optic discovery
2. ✅ Create sync daemon with CRDT
3. ✅ Implement integrity verification
4. ✅ Set up conflict resolution
5. ✅ Test failover scenarios

### Phase 6: Integration & Polish (Week 6)
1. ✅ Connect all layers end-to-end
2. ✅ Implement 3D graph visualization
3. ✅ Add monitoring dashboards
4. ✅ Performance optimization
5. ✅ Documentation and deployment

## Data Flow Diagram

```
┌─────────┐
│ User UI │ (React + Vite)
└────┬────┘
     │ WebSocket
     ▼
┌─────────────────────┐
│   FastAPI Gateway   │
└────┬───────────┬────┘
     │           │
     │           └──────► Redis (Real-time cache)
     ▼
┌─────────────────────┐
│  Browser Agent      │ (Existing system)
│  - Security         │
│  - LLM              │
│  - Automation       │
│  - Coordination     │
└────┬───────────┬────┘
     │           │
     │           └──────► Supabase (Primary DB)
     ▼                        │
┌─────────────────────┐       │
│  NVIDIA Triton      │       │
│  - CodeLlama 4-bit  │       │
│  - Mistral 4-bit    │       │
└────┬────────────────┘       │
     │                        │
     └────────► Fallback      │
                   │           │
                   ▼           ▼
              ┌─────────────────────┐
              │  Ollama (Local CPU) │
              └─────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │   Storage     │
                │  - S3 (Hot)   │
                │  - Glacier    │
                │    (Archive)  │
                └───────────────┘
                        ▲
                        │ Wireless Sync
                        │
                ┌───────┴────────┐
                │ Cable-free Net │
                └────────────────┘
```

## Fast Re-touch Recall Architecture

### Memory Hierarchy

```typescript
// Fast recall with singular integrity
class FastRecallManager {
  // L1: In-memory (fastest, <1ms)
  private l1Cache: LRUCache<string, Data>;

  // L2: Redis (fast, <10ms)
  private l2Cache: RedisClient;

  // L3: Supabase (warm, <100ms)
  private l3Storage: SupabaseClient;

  // L4: S3 (cold, <1s)
  private l4Storage: S3Client;

  // L5: Glacier (archive, minutes)
  private l5Archive: GlacierClient;

  async recall(key: string): Promise<Data> {
    // Try L1
    let data = this.l1Cache.get(key);
    if (data) return this.validate(data);

    // Try L2
    data = await this.l2Cache.get(key);
    if (data) {
      this.l1Cache.set(key, data);
      return this.validate(data);
    }

    // Try L3
    data = await this.l3Storage.from('data').select('*').eq('key', key).single();
    if (data) {
      await this.l2Cache.set(key, data);
      this.l1Cache.set(key, data);
      return this.validate(data);
    }

    // Try L4
    data = await this.l4Storage.getObject({ Key: key });
    if (data) {
      // Promote to L3, L2, L1
      await this.promote(key, data);
      return this.validate(data);
    }

    // Try L5 (slow)
    return this.recallFromArchive(key);
  }

  private validate(data: Data): Data {
    // Singular integrity check
    const checksum = this.computeChecksum(data);
    if (checksum !== data.checksum) {
      throw new Error('Data integrity violation');
    }
    return data;
  }
}
```

### Singular Integrity Guarantee

```typescript
// Ensure all copies are identical
class IntegrityManager {
  async write(key: string, data: Data) {
    // 1. Compute checksum
    const checksum = sha256(JSON.stringify(data));
    const package = { ...data, checksum, version: Date.now() };

    // 2. Write to all layers (async, no wait)
    await Promise.allSettled([
      this.l1Cache.set(key, package),
      this.l2Cache.set(key, package),
      this.l3Storage.from('data').upsert({ key, data: package }),
      this.queueS3Upload(key, package)
    ]);

    // 3. Background verification
    setTimeout(() => this.verifyIntegrity(key), 5000);
  }

  async verifyIntegrity(key: string) {
    // Fetch from all available sources
    const sources = await Promise.allSettled([
      this.l1Cache.get(key),
      this.l2Cache.get(key),
      this.l3Storage.from('data').select('*').eq('key', key).single()
    ]);

    // Compare checksums
    const checksums = sources
      .filter(s => s.status === 'fulfilled')
      .map(s => s.value?.checksum);

    const unique = new Set(checksums);
    if (unique.size > 1) {
      // Conflict detected - resolve
      await this.resolveConflict(key, sources);
    }
  }

  async resolveConflict(key: string, sources: any[]) {
    // Last-write-wins strategy
    const sorted = sources
      .filter(s => s.status === 'fulfilled')
      .sort((a, b) => b.value.version - a.value.version);

    const canonical = sorted[0].value;

    // Overwrite all with canonical version
    await this.write(key, canonical);
  }
}
```

## Monitoring & Observability

### Real-time Charting Constructs

```typescript
// Chart Types
interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap' | 'graph3d';
  dataSource: string;
  updateInterval: number; // ms
  retentionWindow: number; // seconds
}

const CHARTS: ChartConfig[] = [
  // System Health
  {
    type: 'line',
    dataSource: 'metrics.cpu',
    updateInterval: 1000,
    retentionWindow: 300 // 5 minutes
  },

  // Agent Activity
  {
    type: 'bar',
    dataSource: 'agents.taskCount',
    updateInterval: 5000,
    retentionWindow: 3600 // 1 hour
  },

  // Task Flow
  {
    type: 'graph3d',
    dataSource: 'tasks.dependencies',
    updateInterval: 10000,
    retentionWindow: 7200 // 2 hours
  },

  // Error Heatmap
  {
    type: 'heatmap',
    dataSource: 'errors.byTime',
    updateInterval: 60000,
    retentionWindow: 86400 // 1 day
  }
];
```

### Process Modeling Visualization

```typescript
// 3D Graph for agent coordination
class ProcessModelVisualizer {
  private scene: THREE.Scene;
  private nodes: Map<string, THREE.Mesh>;
  private edges: Map<string, THREE.Line>;

  renderAgentNetwork(agents: Agent[], tasks: Task[]) {
    // Create nodes for each agent
    agents.forEach(agent => {
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: this.getStatusColor(agent.status)
      });
      const sphere = new THREE.Mesh(geometry, material);
      this.nodes.set(agent.id, sphere);
      this.scene.add(sphere);
    });

    // Create edges for task handoffs
    tasks.forEach(task => {
      if (task.handoffFrom) {
        const from = this.nodes.get(task.handoffFrom);
        const to = this.nodes.get(task.agentId);
        const edge = this.createEdge(from.position, to.position);
        this.edges.set(task.id, edge);
        this.scene.add(edge);
      }
    });

    // Animate
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    // Update node positions based on force-directed layout
    this.applyForces();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| UI Render | <16ms | 60 FPS |
| API Response | <100ms | P95 |
| WebSocket Latency | <50ms | P95 |
| Chart Update | <33ms | 30 FPS |
| Data Write | <10ms | Redis |
| Data Read (Hot) | <1ms | L1 Cache |
| Data Read (Warm) | <100ms | Supabase |
| Data Read (Cold) | <1s | S3 |
| LLM Inference (NVIDIA) | <500ms | 4-bit quantized |
| LLM Inference (Ollama) | <2s | Fallback |
| Sync Integrity Check | <5s | Background |
| Wireless Sync | <1s | P95 |

## Security Considerations

1. **Authentication**: JWT tokens via Supabase Auth
2. **Authorization**: Row-level security in Supabase
3. **Encryption**: TLS 1.3 for all network traffic
4. **API Keys**: Stored in environment variables
5. **Rate Limiting**: Per-IP and per-user limits
6. **CORS**: Whitelist only trusted origins
7. **CSP**: Content Security Policy headers
8. **Audit Logging**: All mutations logged
9. **Data Retention**: GDPR-compliant policies
10. **Backup**: Encrypted backups to Glacier

## Next Steps

1. **Review this architecture plan** - Confirm approach
2. **Set up development environment** - Vite + FastAPI + Supabase
3. **Implement Phase 1** - Foundation components
4. **Deploy PoC** - Minimal viable UI + backend
5. **Iterate** - Add features incrementally

## Estimated Timeline

- **Phase 1-2** (Weeks 1-2): Foundation + Real-time = 2 weeks
- **Phase 3-4** (Weeks 3-4): Data flow + NVIDIA = 2 weeks
- **Phase 5-6** (Weeks 5-6): Wireless + Integration = 2 weeks
- **Total**: **6 weeks to production**

## Questions to Resolve

1. Which Vite UI template from your repos should we use as the base?
2. Preferred Supabase region for deployment?
3. NVIDIA GPU availability (which model/instance type)?
4. HuggingFace model priority (CodeLlama, Mistral, or both)?
5. Wireless fiber optic network specifications?
6. Backup retention policy (how long to keep cold storage)?

---

**Status**: ✅ Architecture plan complete, ready for implementation.

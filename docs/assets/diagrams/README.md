# Architecture Diagrams

This directory contains system architecture and flow diagrams for Workstation.

## 📊 Available Diagrams

### System Architecture (Mermaid)

```mermaid
graph TB
    subgraph "Client Layer"
        A[Landing Page]
        B[Simple Dashboard]
        C[Control Center]
        D[API Client]
    end
    
    subgraph "API Layer"
        E[Express Server]
        F[JWT Auth Middleware]
        G[Rate Limiter]
        H[CORS Handler]
    end
    
    subgraph "Business Logic"
        I[Workflow Engine]
        J[Browser Agent]
        K[Agent Registry]
    end
    
    subgraph "Data Layer"
        L[SQLite/PostgreSQL]
        M[Workflow Storage]
        N[Execution Tracking]
    end
    
    subgraph "Browser Automation"
        O[Playwright]
        P[Chromium]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    F --> G
    G --> H
    H --> I
    
    I --> J
    I --> K
    J --> O
    O --> P
    
    I --> L
    L --> M
    L --> N
```

### Workflow Execution Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Engine
    participant Browser
    participant DB
    
    Client->>API: POST /api/v2/workflows/:id/execute
    API->>API: Validate JWT
    API->>DB: Create execution record
    DB-->>API: Execution ID
    API->>Engine: Start workflow
    API-->>Client: 202 Accepted (execution_id)
    
    loop For each task
        Engine->>Browser: Execute action
        Browser->>Browser: Navigate/Click/Extract
        Browser-->>Engine: Task result
        Engine->>DB: Update task status
    end
    
    Engine->>DB: Mark execution complete
    Client->>API: GET /api/v2/executions/:id
    API->>DB: Fetch execution
    DB-->>API: Execution data
    API-->>Client: Execution status
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant JWT
    participant Protected
    
    Client->>API: GET /auth/demo-token
    API->>JWT: Generate token
    JWT-->>API: JWT token
    API-->>Client: {"token": "..."}
    
    Client->>Protected: Request with Authorization header
    Protected->>JWT: Verify token
    alt Valid token
        JWT-->>Protected: User info
        Protected-->>Client: Protected resource
    else Invalid token
        JWT-->>Protected: Error
        Protected-->>Client: 401 Unauthorized
    end
```

### Deployment Architecture

```mermaid
graph LR
    subgraph "Local Development"
        A[Developer] --> B[npm run dev]
        B --> C[localhost:3000]
    end
    
    subgraph "Docker Deployment"
        D[Docker Build] --> E[Container Image]
        E --> F[Docker Run]
        F --> G[Container on Port 3000]
    end
    
    subgraph "Railway Deployment"
        H[GitHub Push] --> I[Railway Auto-Deploy]
        I --> J[Production URL]
        J --> K[Public Access]
    end
    
    subgraph "GitHub Pages"
        L[docs/ folder] --> M[GitHub Pages]
        M --> N[Static Site]
    end
```

## 🎨 Creating Diagrams

### Using Mermaid (Recommended)

Mermaid diagrams can be embedded directly in Markdown:

````markdown
```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```
````

**Tools:**
- [Mermaid Live Editor](https://mermaid.live/)
- [Mermaid Documentation](https://mermaid-js.github.io/)
- GitHub/GitLab render Mermaid automatically

### Using Draw.io

1. Visit [draw.io](https://draw.io)
2. Create diagram
3. Export as SVG or PNG
4. Save to this directory

### Using Excalidraw

1. Visit [excalidraw.com](https://excalidraw.com)
2. Create hand-drawn style diagram
3. Export as PNG/SVG
4. Save to this directory

## 📝 Diagram Guidelines

### Style
- **Consistent colors**: Use project color scheme
- **Clear labels**: Short, descriptive text
- **Logical flow**: Left-to-right or top-to-bottom
- **Grouping**: Use subgraphs for related components

### Format
- **Preferred**: SVG (scalable, small file size)
- **Alternative**: PNG (if SVG not possible)
- **Avoid**: JPEG (poor quality for diagrams)

### Naming
- Lowercase with hyphens: `system-architecture.svg`
- Descriptive: `workflow-execution-flow.svg`
- Versioned if needed: `architecture-v2.svg`

## 📚 Diagram Ideas

### System Diagrams
- [ ] High-level system architecture
- [ ] Component interaction diagram
- [ ] Data flow diagram
- [ ] Technology stack visualization

### Process Flows
- [ ] User authentication flow
- [ ] Workflow creation process
- [ ] Browser automation sequence
- [ ] Error handling flow

### Deployment
- [ ] Deployment options comparison
- [ ] Network architecture
- [ ] Security boundaries
- [ ] Scaling strategy

### Developer Guides
- [ ] Development workflow
- [ ] Testing strategy
- [ ] CI/CD pipeline
- [ ] Contribution process

## 🔗 Using Diagrams

### In Markdown Documentation
```markdown
![System Architecture](../assets/diagrams/system-architecture.svg)
```

### In HTML Pages
```html
<img src="assets/diagrams/system-architecture.svg" alt="System Architecture" class="w-full">
```

### With Captions
```markdown
![Architecture](diagram.svg)
*Figure 1: Workstation System Architecture*
```

## 🤝 Contributing Diagrams

Have a useful diagram? Add it!

1. Create diagram using preferred tool
2. Export as SVG (or PNG if necessary)
3. Add to this directory
4. Update this README
5. Reference in relevant documentation
6. Submit pull request

See [CONTRIBUTING.md](../guides/CONTRIBUTING.md) for details.

---

**Help us visualize the system! 📊**

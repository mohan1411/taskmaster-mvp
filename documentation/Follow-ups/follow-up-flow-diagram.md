# Follow-up System Flow Diagram

## Email Processing and Follow-up Detection Flow

```mermaid
flowchart TD
    A[Email Sync Starts] --> B{New Email?}
    B -->|No| C[Skip to Next Email]
    B -->|Yes| D[Save Email to Database]
    
    D --> E{Auto-Detect Enabled?}
    E -->|No| F[Continue to Next Email]
    E -->|Yes| G{OpenAI API Available?}
    
    G -->|No| F
    G -->|Yes| H[Get Email Body Content]
    
    H --> I[Send to OpenAI for Analysis]
    I --> J{Needs Follow-up?}
    
    J -->|No| F
    J -->|Yes| K[Create Follow-up Entry]
    
    K --> L[Mark Email as Needs Follow-up]
    L --> F
    
    F --> M{More Emails?}
    M -->|Yes| B
    M -->|No| N[Sync Complete]
```

## Follow-up Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Created (Auto/Manual)
    
    Pending --> InProgress: User Starts
    Pending --> Completed: User Completes
    Pending --> Ignored: User Ignores
    
    InProgress --> Completed: User Completes
    InProgress --> Ignored: User Abandons
    
    Completed --> [*]
    Ignored --> [*]
    
    note right of Pending
        Can be created:
        - Automatically by AI
        - Manually by user
        - From email detection
    end note
    
    note right of Completed
        Completion includes:
        - Optional notes
        - Completion timestamp
        - Status update
    end note
```

## User Interaction Flow

```mermaid
flowchart TD
    A[User Views Email] --> B{Action Choice}
    
    B --> C[Detect Follow-up]
    B --> D[Create Follow-up]
    
    C --> E[AI Analysis]
    E --> F{Follow-up Needed?}
    F -->|Yes| G[Pre-fill Form]
    F -->|No| H[Show Message]
    
    D --> I[Empty Form]
    G --> J[Follow-up Dialog]
    I --> J
    
    J --> K[User Fills Details]
    K --> L[Save Follow-up]
    L --> M[Update UI]
    
    subgraph Follow-up Details
        K1[Subject]
        K2[Contact Info]
        K3[Priority]
        K4[Due Date]
        K5[Key Points]
        K6[Notes]
    end
```

## Analytics Data Flow

```mermaid
flowchart LR
    A[Follow-up Data] --> B[Aggregation Queries]
    
    B --> C[Total Count]
    B --> D[Status Counts]
    B --> E[Overdue Count]
    B --> F[Due This Week]
    B --> G[Completion Rate]
    
    C --> H[Analytics Dashboard]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[UI Components]
    I --> J[User View]
```

## System Architecture

```mermaid
graph TB
    subgraph Frontend
        A[FollowUpsPage] --> B[Analytics Cards]
        A --> C[Filter Controls]
        A --> D[Follow-up List]
        A --> E[Action Dialogs]
    end
    
    subgraph API Layer
        F[Follow-up Routes] --> G[Follow-up Controller]
        H[Email Routes] --> I[Email Controller]
    end
    
    subgraph Services
        G --> J[Follow-up Service]
        I --> K[Detection Service]
        K --> L[OpenAI Integration]
    end
    
    subgraph Database
        J --> M[(Follow-ups Collection)]
        I --> N[(Emails Collection)]
        J --> O[(Settings Collection)]
    end
    
    A --> F
    A --> H
```

## Data Model Relationships

```mermaid
erDiagram
    USER ||--o{ FOLLOWUP : has
    USER ||--o{ EMAIL : receives
    USER ||--|| SETTINGS : configures
    
    EMAIL ||--o| FOLLOWUP : triggers
    FOLLOWUP }o--o| TASK : relates_to
    
    FOLLOWUP {
        ObjectId id PK
        ObjectId user FK
        String emailId
        String threadId
        String subject
        String status
        String priority
        Date dueDate
        Boolean aiGenerated
    }
    
    EMAIL {
        ObjectId id PK
        ObjectId user FK
        String messageId
        Boolean needsFollowUp
        Date followUpDueDate
    }
    
    SETTINGS {
        ObjectId id PK
        ObjectId user FK
        Boolean autoDetect
        Number defaultReminderDays
    }
```

## API Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant O as OpenAI
    participant D as Database
    
    U->>F: Request Follow-up Detection
    F->>B: POST /api/emails/:id/detect-followup
    B->>D: Get Email Content
    D-->>B: Email Data
    B->>O: Analyze Email
    O-->>B: Analysis Result
    
    alt Needs Follow-up
        B->>D: Create Follow-up
        B->>D: Update Email Status
        B-->>F: Follow-up Created
        F-->>U: Show Success
    else No Follow-up Needed
        B-->>F: No Follow-up Required
        F-->>U: Show Message
    end
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Operation Start] --> B{Check Prerequisites}
    
    B --> C{API Key?}
    C -->|No| D[Return Error: No API Key]
    C -->|Yes| E{Email Content?}
    
    E -->|No| F[Return Error: No Content]
    E -->|Yes| G[Process Request]
    
    G --> H{API Call Success?}
    H -->|No| I[Return Error: API Failed]
    H -->|Yes| J{Valid Response?}
    
    J -->|No| K[Return Error: Invalid Response]
    J -->|Yes| L[Continue Processing]
    
    L --> M{Database Save?}
    M -->|No| N[Return Error: Save Failed]
    M -->|Yes| O[Return Success]
    
    style D fill:#f96
    style F fill:#f96
    style I fill:#f96
    style K fill:#f96
    style N fill:#f96
    style O fill:#9f6
```

## Filter and Search Flow

```mermaid
flowchart TD
    A[User Sets Filters] --> B[Update State]
    B --> C[Trigger API Call]
    
    C --> D[Build Query Parameters]
    D --> E{Status Filter}
    E --> F{Priority Filter}
    F --> G{Date Range}
    G --> H{Search Term}
    
    H --> I[Execute Database Query]
    I --> J[Return Results]
    J --> K[Update UI]
    
    subgraph Query Building
        E1[pending, in-progress]
        F1[urgent, high, medium, low]
        G1[dueBefore, dueAfter]
        H1[subject, contact search]
    end
```

These diagrams illustrate the various flows and interactions within the follow-up system, making it easier to understand how different components work together.

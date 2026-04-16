# DiaFit Project Architecture

## Architecture Overview

```
                            +---------------+
                            |               |
                            |    main.tsx   |
                            |               |
                            +-------+-------+
                                    |
                                    | Renders
                                    v
                            +-------+-------+
                            |               |
                            |    App.tsx    |
                            |               |
                            +-------+-------+
                                    |
                                    | Contains routes to
                                    v
                +-------------------+-------------------+
                |                   |                   |
                v                   v                   v
        +-------+-------+   +-------+-------+   +------+------+
        |  AiAssistant  |   | HealthProfile  |   |   Medical   |
        |     Page      |   |     Page       |   | Information |
        +-------+-------+   +-------+-------+   +------+------+
                |                   |                   |
                | Uses              | Uses              | Uses
                v                   v                   v
        +-------+-------+   +-------+-------+   +------+------+
        |  AI Service    |   | Health Service |   | User Service|
        |               |   |               |   |              |
        +---------------+   +---------------+   +--------------+
                |                   |                   |
                | Interfaces with   | Interfaces with   | Interfaces with
                v                   v                   v
        +-------+-------+   +-------+-------+   +------+------+
        |  External AI  |   |   Database    |   |   Backend   |
        |     API       |   |   Storage     |   |     API     |
        +---------------+   +---------------+   +--------------+
```

## Component Relationships

### Core Application Flow

1. **main.tsx** - Entry point of the application
   - Renders the root `App` component
   - Sets up providers for the application (router, themes, etc.)

2. **App.tsx** - Main application component
   - Contains routing configuration
   - Manages global state
   - Provides layout structure

### Pages and Features

3. **AiAssistant Page** (src/pages/AiAssistant.tsx)
   - Implements the chat interface
   - Manages conversation state
   - Handles speech-to-text & text-to-speech functionality
   - Uses aiService to communicate with AI backend

4. **Health Profile Page**
   - Tracks user health metrics
   - Displays health statistics and trends
   - Allows input of diabetes-related health data
   - Uses healthService for data operations

5. **Medical Information Page**
   - Manages medical records
   - Tracks medications and prescriptions
   - Saves doctor information
   - Uses userService and healthService

### Services Layer

6. **AI Service** (src/services/aiService.ts)
   - Provides methods to interact with AI backend
   - Handles prompt formation
   - Manages conversation history
   - Implements error handling for API requests

7. **Health Service**
   - Handles health data storage and retrieval
   - Processes health metrics
   - Generates reports and analyses
   - Validates health-related inputs

8. **User Service**
   - Manages user authentication
   - Handles user preferences
   - Stores user profile information
   - Controls access permissions

## Data Flow

```
User Input → Component → Service → External API → Service → Component → UI Update
```

For example, when a user asks a question in the AI Assistant:

1. User types or speaks a question
2. AiAssistant component captures input
3. Input is passed to aiService
4. aiService formats and sends request to AI backend
5. Response is received and processed by aiService
6. Formatted response is returned to AiAssistant component
7. UI is updated with the response
8. (Optional) Text-to-speech reads response aloud

## Component Architecture

Each major component follows this structure:

```
Component/
├── State Management
│   ├── Local state (useState)
│   └── Side effects (useEffect)
├── Business Logic
│   ├── Event handlers
│   └── Data transformations
├── Service Interactions
│   ├── API calls
│   └── Data fetching
└── Rendering
    ├── JSX structure
    └── Conditional rendering
```

## Key Technologies Integration

- **Web Speech API** (in AiAssistant.tsx)
  - SpeechRecognition for voice input
  - SpeechSynthesis for voice output

- **Tailwind CSS** (throughout UI components)
  - Used for styling and responsive design

- **Lucide React** (throughout UI components)
  - Provides icon system

- **TypeScript** (all files)
  - Type definitions
  - Interface declarations
  - Type safety throughout the application 
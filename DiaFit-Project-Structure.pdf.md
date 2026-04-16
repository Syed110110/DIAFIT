# DiaFit Project Structure

## Application Overview

DiaFit is a comprehensive diabetes management platform built with React, TypeScript, and modern web technologies. The application helps users manage their diabetes through AI-powered assistance, health tracking, and medical information management.

## File Structure

```
diafit/
├── public/               # Static assets
│   ├── favicon.ico       # Site favicon
│   ├── index.html        # HTML entry point
│   └── assets/           # Images and other assets
│ 
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   │   ├── UI/           # Basic UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── Layout/       # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   │
│   │   └── Forms/        # Form components
│   │       ├── HealthForm.tsx
│   │       └── ...
│   │
│   ├── pages/            # Application pages
│   │   ├── AiAssistant.tsx     # AI chatbot interface
│   │   ├── HealthProfile.tsx   # Health tracking dashboard
│   │   ├── MedicalInfo.tsx     # Medical information management
│   │   └── ...
│   │
│   ├── services/         # Service layer
│   │   ├── aiService.ts         # AI integration service
│   │   ├── healthService.ts     # Health data service
│   │   ├── userService.ts       # User management service
│   │   └── ...
│   │
│   ├── types/            # TypeScript type definitions
│   │   ├── health.types.ts
│   │   ├── chat.types.ts
│   │   └── ...
│   │
│   ├── utils/            # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── ...
│   │
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
│
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── README.md             # Project documentation
```

## Key Components and Their Relationships

### AI Assistant (src/pages/AiAssistant.tsx)

The AI Assistant page provides a conversational interface for diabetes management guidance. Features include:

- Chat interface with AI responses
- Speech-to-text input capability
- Text-to-speech output for accessibility
- File upload for sharing medical documents
- Conversation history management

Dependencies:
- `aiService.ts` - Handles AI API integration
- Web Speech API - Manages voice input/output
- Lucide React - Provides UI icons

### Health Profile (src/pages/HealthProfile.tsx)

The Health Profile page allows users to track their health metrics relevant to diabetes management:

- Blood glucose tracking
- Weight and BMI monitoring
- Exercise activity logging
- Water intake tracking
- Medication adherence

Dependencies:
- `healthService.ts` - Manages health data
- Charts/visualization libraries
- Form components

### Medical Information (src/pages/MedicalInfo.tsx)

The Medical Information page stores important medical data:

- Doctor contact information
- Medication list and schedules
- Appointment tracking
- Medical history
- Emergency contacts

Dependencies:
- `userService.ts` - Manages user data
- `healthService.ts` - Interfaces with health records
- Storage utilities for medical information

## Service Layer

### AI Service (src/services/aiService.ts)

Handles communication with AI providers:

- Formats prompts for the AI model
- Sends requests to external AI APIs
- Processes AI responses
- Manages conversation context

### Health Service (src/services/healthService.ts)

Manages health-related data:

- Stores and retrieves health metrics
- Calculates trends and statistics
- Validates health data inputs
- Generates health reports

### User Service (src/services/userService.ts)

Handles user-related functionality:

- Authentication and authorization
- User profile management
- Preferences and settings
- Account operations

## Data Flow

1. User interacts with UI components
2. Components call appropriate services
3. Services communicate with external APIs or data storage
4. Data returns through services to components
5. UI updates to reflect new data state

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React
- **Voice Features**: Web Speech API
- **Build Tool**: Vite
- **Package Manager**: npm
- **Version Control**: Git 
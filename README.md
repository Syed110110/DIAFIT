# DiaFit - AI-Powered Diabetes Management Assistant

DiaFit is a comprehensive web application designed to help individuals manage diabetes through personalized health tracking, nutritional guidance, and an AI-powered assistant.

![DiaFit App](https://via.placeholder.com/800x400?text=DiaFit+App)

## Features

- **AI Assistant**: Intelligent conversational interface to answer questions about diabetes management, nutrition, exercise, and healthy living
- **Speech-to-Text**: Voice input for natural interaction with the AI assistant
- **Text-to-Speech**: Voice responses from the AI assistant with female voice
- **Health Profile**: Personalized health information tracking
- **Medical Information**: Management of diabetes-related medical data

## Tech Stack

- **Frontend**: React with TypeScript
- **UI**: Tailwind CSS for responsive design
- **Icons**: Lucide React icons
- **Voice Features**: Web Speech API and SpeechRecognition
- **AI Integration**: Integration with AI models for diabetes management assistance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/diafit.git
   cd diafit
   ```

2. Install dependencies
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Start the development server
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

4. Open your browser and navigate to http://localhost:5173

## Project Structure

```
diafit/
├── public/              # Public assets
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   │   ├── AiAssistant.tsx     # AI chat assistant
│   │   └── ...
│   ├── pages/           # Application pages
│   │   ├── AiAssistant.tsx     # AI chat assistant
│   │   └── ...
│   ├── services/        # Service layer for API interactions
│   │   ├── aiService.ts        # AI service integration
│   │   └── ...
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Key Features Explained

### AI Assistant
The AI Assistant provides a conversational interface where users can ask questions about diabetes management, nutrition, exercise plans, and general health advice. The assistant processes natural language queries and returns informative responses based on current medical knowledge.

### Voice Functionality
- **Speech-to-Text**: Users can speak directly to the application, which converts speech to text in real-time
- **Text-to-Speech**: The AI assistant can read responses aloud using a natural-sounding female voice

### Health Profile
Users can input and track key health metrics relevant to diabetes management, including:
- Blood glucose levels
- Weight and BMI
- Exercise activity
- Dietary information
- Medication schedules

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped build and improve DiaFit
- Special thanks to the open source community for providing the tools that made this project possible 
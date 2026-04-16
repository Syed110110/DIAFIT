/**
 * AI Service
 * 
 * This service handles communication with the OpenRouter API
 * to provide AI assistance for diabetes management and health questions.
 */

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// Define types for OpenRouter API
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  model: string;
  object: string;
  created: number;
}

// Service implementation
const aiService = {
  /**
   * Send a message to the AI and get a response
   */
  sendMessage: async (messages: ChatMessage[]): Promise<string> => {
    // Check if API key is set
    if (!API_KEY) {
      console.error('OpenRouter API key not configured. Please add it to your .env file.');
      return "I'm sorry, but my connection to the AI service isn't configured properly. Please contact support to set up the OpenRouter API key.";
    }
    
    try {
      console.log('Using API key:', API_KEY ? 'Key is present' : 'No key found');
      
      // Prepare the request
      const requestBody: ChatCompletionRequest = {
        model: "deepseek/deepseek-r1:free",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      };
      
      // Send the request to OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      // Check for errors
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API error:', response.status, errorBody);
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse the response
      const data: ChatCompletionResponse = await response.json();
      
      // Extract and return the assistant's message
      const assistantMessage = data.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response from AI service');
      }
      
      return assistantMessage;
    } catch (error) {
      console.error('Error in AI service:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    }
  },
  
  /**
   * Generate diabetes-specific system prompt
   */
  getDiabetesSystemPrompt: (): string => {
    return `You are an AI health assistant specializing in diabetes management. You provide helpful, 
    accurate information about diabetes care, nutrition, exercise, medication, and lifestyle adjustments 
    for people with diabetes. You can suggest general approaches to diabetes management but should always 
    clarify that your advice is not a replacement for professional medical care. Emphasize the importance 
    of consulting healthcare providers for personalized medical advice, medication changes, or concerning symptoms.
    
    When discussing nutrition, focus on general principles of balanced diet, carbohydrate awareness, 
    and foods that typically help with blood sugar management. For exercise, suggest general activities
    that are usually beneficial and safe for people with diabetes.
    
    If the user asks about symptoms, explain what typical diabetes symptoms might be but encourage them
    to seek medical attention for proper diagnosis and treatment. If they ask about medication adjustments
    or dosages, remind them that these decisions should only be made with their healthcare provider.
    
    Keep your responses supportive, informative, and empathetic, understanding that managing diabetes
    can be challenging. Offer encouragement and practical tips while maintaining appropriate medical caution.`;
  }
};

export default aiService; 
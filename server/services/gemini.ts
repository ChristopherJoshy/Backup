import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "" 
});

export interface GeneratedRecipe {
  name: string;
  ingredients: string[];
  effects: string[];
  instructions: string;
}

export class GeminiService {
  async generateRecipe(userIngredients?: string): Promise<GeneratedRecipe> {
    try {
      const ingredientsPrompt = userIngredients 
        ? `You must incorporate and use these specific ingredients provided by the user: ${userIngredients}. Build the recipe around these ingredients as the main components.`
        : 'using premium coffee ingredients and modern brewing techniques';

      const prompt = `You are a professional barista at "Neural Brew" - a modern tech-themed café. Create a sophisticated coffee recipe ${ingredientsPrompt}.

IMPORTANT REQUIREMENTS:
- Use ONLY real, purchasable coffee ingredients (coffee beans, milk, syrups, spices, etc.)
- NO fictional or fake ingredients
- NO slang or unprofessional language
- Each ingredient must be a real item you can buy at a coffee shop or grocery store
- If user provided ingredients, they must be the primary focus of the recipe

Recipe Guidelines:
- Professional coffee shop quality recipe
- 4-6 real ingredients maximum
- Use proper coffee terminology and techniques
- Modern presentation with tech-themed naming only for the recipe title
- Include realistic preparation steps using standard coffee equipment
- Effects should be realistic coffee benefits (alertness, flavor notes, etc.)

Examples of ACCEPTABLE real ingredients:
- Espresso beans, arabica coffee, cold brew concentrate
- Whole milk, oat milk, almond milk, heavy cream
- Vanilla syrup, caramel syrup, cinnamon, nutmeg
- Dark chocolate, cocoa powder, honey, brown sugar
- Steamed milk foam, ice cubes, hot water

Examples of UNACCEPTABLE fake ingredients:
- "Neural foam", "quantum milk", "digital compounds", "matrix syrup"
- Any fictional or made-up ingredients

Respond in JSON format:
{
  "name": "Professional recipe name with subtle tech theme",
  "ingredients": ["Real ingredient 1", "Real ingredient 2", "Real ingredient 3", ...],
  "effects": ["Realistic coffee benefit 1", "Realistic coffee benefit 2", ...],
  "instructions": "Step-by-step professional preparation using real coffee equipment and techniques"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              ingredients: { 
                type: "array",
                items: { type: "string" }
              },
              effects: {
                type: "array", 
                items: { type: "string" }
              },
              instructions: { type: "string" }
            },
            required: ["name", "ingredients", "effects", "instructions"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('Empty response from Gemini');
      }

      const recipe: GeneratedRecipe = JSON.parse(rawJson);
      return recipe;
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      // Only use fallback if API is completely unavailable
      if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured and generation failed');
      }
      // Realistic fallback recipe with real ingredients
      return {
        name: "Neural Network Espresso",
        ingredients: [
          "Double shot espresso",
          "Steamed whole milk",
          "Vanilla syrup",
          "Cinnamon powder"
        ],
        effects: [
          "Enhanced focus and alertness",
          "Improved cognitive function",
          "Sustained energy boost"
        ],
        instructions: "1. Pull a double shot of espresso into a 6oz cup. 2. Steam whole milk to 150°F with microfoam. 3. Add 0.5oz vanilla syrup to espresso. 4. Pour steamed milk creating latte art. 5. Dust with cinnamon powder and serve immediately."
      };
    }
  }

  async generateAutoRecipe(): Promise<GeneratedRecipe> {
    // Real coffee ingredients for automatic recipe generation
    const realIngredientCategories = {
      coffeeBases: ["espresso", "cold brew concentrate", "arabica coffee beans", "robusta coffee", "french press coffee"],
      milkOptions: ["whole milk", "oat milk", "almond milk", "coconut milk", "heavy cream", "half and half"],
      syrups: ["vanilla syrup", "caramel syrup", "hazelnut syrup", "cinnamon syrup", "brown sugar syrup"],
      spices: ["cinnamon", "nutmeg", "cardamom", "cocoa powder", "espresso powder"],
      extras: ["dark chocolate", "honey", "maple syrup", "brown sugar", "sea salt", "vanilla extract"]
    };

    // Select 2-3 real ingredients from different categories
    const selectedIngredients = [
      realIngredientCategories.coffeeBases[Math.floor(Math.random() * realIngredientCategories.coffeeBases.length)],
      realIngredientCategories.milkOptions[Math.floor(Math.random() * realIngredientCategories.milkOptions.length)],
      realIngredientCategories.syrups[Math.floor(Math.random() * realIngredientCategories.syrups.length)]
    ];

    // Randomly add spices or extras (50% chance)
    if (Math.random() > 0.5) {
      selectedIngredients.push(realIngredientCategories.spices[Math.floor(Math.random() * realIngredientCategories.spices.length)]);
    }
    if (Math.random() > 0.7) {
      selectedIngredients.push(realIngredientCategories.extras[Math.floor(Math.random() * realIngredientCategories.extras.length)]);
    }

    // Generate recipe using these real ingredients
    return this.generateRecipe(selectedIngredients.join(', '));
  }
}

export const geminiService = new GeminiService();

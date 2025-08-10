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
    // Determine recipe domain early so fallback can reuse
    const userList = userIngredients ? this.parseUserIngredients(userIngredients) : [];
    const coffeeKeywords = [
      'espresso','coffee','arabica','robusta','cold brew','americano','latte','cappuccino','mocha','ristretto','macchiato','brew'
    ];
    const teaIndicators = [ 'tea','chai','matcha','earl grey','oolong','green tea','black tea','herbal','mint','chamomile','hibiscus' ];
    const savoryIndicators = [ 'chicken','beef','pork','egg','eggs','cheese','onion','garlic','tomato','spinach','bread','rice','noodle','noodles','potato','paneer','tofu' ];
    let mode: 'coffee'|'tea'|'snack' = 'coffee';
    try {
      // Domain detection
      const coffeeKeywords = [
        'espresso','coffee','arabica','robusta','cold brew','americano','latte','cappuccino','mocha','ristretto','macchiato','brew'
      ]; // redeclared for prompt-scoped logic clarity
      if (userList.length) {
        const lower = userList.map(i => i.toLowerCase());
        const hasCoffee = lower.some(i => coffeeKeywords.some(k => i.includes(k)));
        const hasTea = lower.some(i => teaIndicators.some(k => i.includes(k)));
        const hasSavory = lower.some(i => savoryIndicators.some(k => i.includes(k)));
        if (hasSavory) mode = 'snack';
        else if (hasTea && !hasCoffee) mode = 'tea';
        else if (!hasCoffee && !hasTea && lower.some(i => i.match(/leaf|herb|flower|ginger|lemongrass|peppermint/))) mode = 'tea';
      }

      // If a clearly non-coffee protein/savory appears with coffee terms, prefer snack
      if (mode === 'coffee' && userList.length) {
        const lower = userList.map(i=>i.toLowerCase());
        if (lower.some(i => savoryIndicators.some(s => i.includes(s)))) mode = 'snack';
      }

      const modeDescriptor = mode === 'coffee' ? 'coffee beverage' : mode === 'tea' ? 'tea infusion' : 'savory cafe snack';
      const modeSpecificGuidelines = mode === 'coffee' ? `
Coffee Recipe Rules:
- 4-6 real coffee-related ingredients max
- Only real, purchasable coffee & cafe ingredients
- Professional barista style steps
` : mode === 'tea' ? `
Tea Recipe Rules:
- 3-6 real tea / herbal infusion ingredients
- Use real tea bases or herbs (NO fictional tech ingredients)
- Include proper steeping temperature & time
` : `
Snack Recipe Rules:
- 4-8 real, simple snack ingredients
- Must be a quick-prep cafe snack (sandwich, wrap, toast, salad bowl, energy bites, etc.)
- Provide concise assembly/prep steps (no baking unless absolutely necessary & <15 min)
`;

      const ingredientsPrompt = userIngredients
        ? `You must incorporate these user ingredients: ${userIngredients}. They must appear explicitly (normalized if needed) and be primary.`
        : (mode === 'coffee' ? 'using premium coffee ingredients and modern brewing techniques' : mode === 'tea' ? 'using real tea leaves or herbal ingredients' : 'using real, quick-preparation cafe snack ingredients');

  const prompt = `You are a professional creator at "Neural Brew" - a modern tech-themed café. Create a sophisticated ${modeDescriptor} recipe ${ingredientsPrompt}.

IMPORTANT REQUIREMENTS:
${mode === 'coffee' ? '- Use ONLY real, purchasable coffee ingredients (coffee beans, milk, syrups, spices, etc.)' : ''}
- NO fictional or fake ingredients
- NO slang or unprofessional language
- Every ingredient must be a real item purchasable at a cafe or grocery store
- If user provided ingredients, they must be the primary focus of the recipe

Recipe Guidelines:
${modeSpecificGuidelines}
- Modern presentation with subtle tech-themed naming only for the recipe title
- Include realistic preparation steps using standard cafe equipment
- Effects should be realistic benefits (flavor notes, mood, energy, focus, calming, satiation, etc.)

Examples of ACCEPTABLE real ingredients:
- Espresso beans, arabica coffee, cold brew concentrate
- Whole milk, oat milk, almond milk, heavy cream
- Vanilla syrup, caramel syrup, cinnamon, nutmeg
- Dark chocolate, cocoa powder, honey, brown sugar
- Steamed milk foam, ice cubes, hot water
 - (Tea) green tea, black tea, oolong, chamomile, peppermint, ginger, lemongrass, hibiscus
 - (Snack) bread, cheese, eggs, chicken, lettuce, spinach, tomato, herbs, olive oil, nuts, seeds

Examples of UNACCEPTABLE fake ingredients:
- "Neural foam", "quantum milk", "digital compounds", "matrix syrup"
- Any fictional or made-up ingredients

ADDITIONAL HARD REQUIREMENTS${userIngredients ? ` (USER INGREDIENTS PRESENT)` : ''}:
${userIngredients ? `- Each of the user supplied ingredients MUST appear as its own item in the ingredients array (you may normalize wording e.g. 'milk' -> 'whole milk' but MUST still include it clearly)
- Do NOT add completely unrelated flavors that would overshadow the user ingredients
- Prefer 1:1 mapping of user ingredient tokens to array entries (split on commas or the word 'and')` : '- Keep ingredients realistic and purchasable'}
- Never invent sci‑fi ingredients.

Respond strictly in JSON format (no markdown, no commentary). If mode is snack, instructions must be concise assembly steps. If tea, include steep temperature & time. If coffee, include extraction details.
Respond JSON only:
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

      // Robust extraction & enforcement of user ingredients
      if (userIngredients) {
        const parsedUser = this.parseUserIngredients(userIngredients);
        if (parsedUser.length) {
          // Map existing ingredients to lower-case for matching
          const existing = recipe.ingredients;
          const usedIndices = new Set<number>();
          const enforced: string[] = [];

          for (const raw of parsedUser) {
            const lc = raw.toLowerCase();
            // Find best match in existing ingredients (contains or equals)
            let matchIndex = -1;
            let exactIndex = -1;
            existing.forEach((ing, idx) => {
              if (usedIndices.has(idx)) return;
              const ingLc = ing.toLowerCase();
              if (ingLc === lc && exactIndex === -1) exactIndex = idx;
              if (matchIndex === -1 && ingLc.includes(lc)) matchIndex = idx;
            });
            const chosenIndex = exactIndex !== -1 ? exactIndex : matchIndex;
            if (chosenIndex !== -1) {
              enforced.push(existing[chosenIndex]);
              usedIndices.add(chosenIndex);
            } else {
              enforced.push(this.normalizeIngredient(raw));
            }
          }
          // Add the remaining (unused) original ingredients after enforced list, removing duplicates by lower-case
          const remaining = existing.filter((_, idx) => !usedIndices.has(idx));
          const seen = new Set(enforced.map(i => i.toLowerCase()));
          const finalList = [...enforced, ...remaining.filter(r => !seen.has(r.toLowerCase()))];
          recipe.ingredients = finalList;

          // Prepend note to instructions if not already referenced
          const note = `Use the user ingredients first: ${parsedUser.join(', ')}.`;
            if (!recipe.instructions.toLowerCase().includes(parsedUser[0].toLowerCase())) {
              recipe.instructions = note + '\n' + recipe.instructions;
            }
        }
      }

      return recipe;
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      // Only use fallback if API is completely unavailable
      if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured and generation failed');
      }
      // Realistic fallback recipe with real ingredients
      let base: GeneratedRecipe;
      if (mode === 'tea') {
        base = {
          name: 'Circuit Infusion Green Tea',
          ingredients: [ 'Green tea leaves', 'Hot water (175°F)', 'Honey', 'Fresh mint' ],
          effects: [ 'Gentle sustained focus', 'Calming aromatic lift' ],
          instructions: '1. Heat water to 175°F. 2. Steep green tea leaves 2 minutes. 3. Add honey and gently stir. 4. Bruise mint leaves lightly and add before serving.'
        };
      } else if (mode === 'snack') {
        base = {
          name: 'Neural Power Toast',
          ingredients: [ 'Whole grain bread slice', 'Avocado', 'Cherry tomatoes', 'Olive oil', 'Sea salt', 'Cracked black pepper' ],
          effects: [ 'Balanced energy', 'Healthy fats for cognitive support' ],
          instructions: '1. Toast bread to medium. 2. Mash avocado onto toast. 3. Halve cherry tomatoes and arrange. 4. Drizzle olive oil. 5. Season with sea salt and pepper. Serve immediately.'
        };
      } else {
        base = {
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
      if (userIngredients) {
        const requested = userIngredients.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
        for (const req of requested) {
          if (!base.ingredients.some(i => i.toLowerCase().includes(req.toLowerCase()))) {
            base.ingredients.unshift(this.normalizeIngredient(req));
          }
        }
        base.instructions = `Start by preparing user ingredients: ${requested.join(', ')}.\n` + base.instructions;
      }
      return base;
    }
  }

  private normalizeIngredient(raw: string): string {
    const r = raw.toLowerCase();
    if (r === 'milk') return 'Whole milk';
    if (r === 'sugar') return 'Brown sugar';
    if (r === 'coffee') return 'Freshly ground espresso beans';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  private parseUserIngredients(input: string): string[] {
    return input
      .split(/[,\n;]| and /i)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 8); // cap to avoid prompt abuse
  }

  // Removed auto recipe generation helper per request
}

export const geminiService = new GeminiService();

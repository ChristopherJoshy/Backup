export interface GeneratedRecipe {
  name: string;
  ingredients: string[];
  effects: string[];
}

export const generateRecipe = async (ingredients: string, username: string): Promise<GeneratedRecipe> => {
  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ingredients, username }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate recipe');
  }

  return response.json();
};

// Auto recipe generation removed per request

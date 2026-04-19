import { Product, CartItem } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export async function getAIRecommendations(
  recentlyViewed: Product[],
  cart: CartItem[],
  products: Product[],
  currentProduct?: Product
): Promise<Product[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return getRuleBasedRecommendations(recentlyViewed, cart, products, currentProduct);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const productsSummary = products.map(p => `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}`).join("\n");

    const prompt = `
      You are an expert e-commerce recommendation engine for a store called "HORIZON" (The Elite) in Yemen.
      Based on the following user data, suggest 4-6 products from our catalog that the user is most likely to be interested in.
      
      User Data:
      - Recently Viewed: ${recentlyViewed.map((p: any) => p.name).join(", ")}
      - Items in Cart: ${cart.map((item: any) => `${item.product?.name || 'Unknown'} (Qty: ${item.quantity})`).join(", ")}
      ${currentProduct ? `- Currently Viewing: ${currentProduct.name} (Category: ${currentProduct.category})` : ""}
      
      Catalog Summary (Product IDs and Names):
      ${productsSummary}
      
      Rules:
      1. Suggest products that complement what's in the cart (e.g., if they have a phone, suggest a case, charger, or headphones).
      2. Suggest products similar to what they recently viewed.
      3. If they are viewing a product now, suggest alternatives or accessories for it.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["recommendedIds"]
        }
      }
    });

    const text = response.text;
    const data = JSON.parse(text || '{"recommendedIds":[]}');
    const recommendedIds: string[] = data.recommendedIds || [];
    const recommendedProducts = products.filter(p => recommendedIds.includes(p.id));
    
    // Filter out items already in cart or currently being viewed
    const cartIds = cart.map(item => item.product?.id).filter(id => id);
    return recommendedProducts
      .filter(p => !cartIds.includes(p.id) && p.id !== currentProduct?.id)
      .slice(0, 6);
  } catch (error: any) {
    console.error("AI Recommendation Error:", error);
    // Silently handle AI recommendation errors and fallback to rule-based recommendations
    return getRuleBasedRecommendations(recentlyViewed, cart, products, currentProduct);
  }
}

export function getRuleBasedRecommendations(
  recentlyViewed: Product[],
  cart: CartItem[],
  products: Product[],
  currentProduct?: Product
): Product[] {
  const cartIds = cart.map(item => item.product?.id).filter(id => id);
  const viewedIds = recentlyViewed.map(p => p.id);
  
  let recommendations: Product[] = [];

  // 1. Complementary logic
  const cartCategories = cart.map(item => item.product?.category).filter(c => c);
  if (cartCategories.includes('إلكترونيات')) {
    // If they have electronics, suggest accessories
    recommendations.push(...products.filter(p => p.category === 'إكسسوارات' && !cartIds.includes(p.id)));
  }

  // 2. Similar to current product
  if (currentProduct) {
    const similar = products.filter(p => 
      p.category === currentProduct.category && 
      p.id !== currentProduct.id && 
      !cartIds.includes(p.id)
    );
    recommendations.push(...similar);
  }

  // 3. Based on history
  const historyCategories = recentlyViewed.map(p => p.category);
  const historyBased = products.filter(p => 
    historyCategories.includes(p.category) && 
    !viewedIds.includes(p.id) && 
    !cartIds.includes(p.id)
  );
  recommendations.push(...historyBased);

  // 4. Trending/New if nothing else
  if (recommendations.length < 4) {
    recommendations.push(...products.filter(p => p.isNew && !cartIds.includes(p.id)));
  }

  // Remove duplicates and limit
  const uniqueRecs = Array.from(new Set(recommendations.map(p => p.id)))
    .map(id => products.find(p => p.id === id)!)
    .filter(p => p.id !== currentProduct?.id && !cartIds.includes(p.id));

  return uniqueRecs.slice(0, 6);
}

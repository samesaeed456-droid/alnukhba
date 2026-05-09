import { create } from "zustand";
import { CartItem, Product } from "../types";

interface CartState {
  cart: CartItem[];
  wishlist: Product[];
  discount: {
    code: string | null;
    amount: number;
    type: "percentage" | "fixed";
    pointsUsed?: number;
  };
  
  // Actions
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  setWishlist: (wishlist: Product[] | ((prev: Product[]) => Product[])) => void;
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  setDiscount: (discount: CartState["discount"]) => void;
  removeDiscount: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: JSON.parse(localStorage.getItem("store_cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("store_wishlist") || "[]"),
  discount: { code: null, amount: 0, type: "percentage" },

  setCart: (input) => {
    const cart = typeof input === 'function' ? (input as any)(get().cart) : input;
    localStorage.setItem("store_cart", JSON.stringify(cart));
    set({ cart });
  },

  setWishlist: (input) => {
    const wishlist = typeof input === 'function' ? (input as any)(get().wishlist) : input;
    localStorage.setItem("store_wishlist", JSON.stringify(wishlist));
    set({ wishlist });
  },

  addToCart: (product, quantity = 1, color, size) => {
    const cart = get().cart;
    const itemId = `${product.id}-${color || "default"}-${size || "default"}`;
    const existingIndex = cart.findIndex(item => item.id === itemId);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      get().setCart(updatedCart);
    } else {
      get().setCart([...cart, { id: itemId, product, quantity, selectedColor: color, selectedSize: size }]);
    }
  },

  toggleWishlist: (product) => {
    const wishlist = get().wishlist;
    const isIn = wishlist.some(p => p.id === product.id);
    if (isIn) {
      get().setWishlist(wishlist.filter(p => p.id !== product.id));
    } else {
      get().setWishlist([...wishlist, product]);
    }
  },

  isInWishlist: (productId) => {
    return get().wishlist.some(p => p.id === productId);
  },

  updateCartQuantity: (id, delta) => {
    const updatedCart = get().cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    get().setCart(updatedCart);
  },

  removeFromCart: (id) => {
    get().setCart(get().cart.filter(item => item.id !== id));
  },

  clearCart: () => {
    get().setCart([]);
  },

  setDiscount: (discount) => set({ discount }),
  
  removeDiscount: () => set({ discount: { code: null, amount: 0, type: "percentage" } }),
}));

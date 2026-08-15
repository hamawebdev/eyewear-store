import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/schemas";
import { buildLocalizedText } from "@/lib/storefront-language";

const toLocalizedText = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    return buildLocalizedText({
      fr: value
    });
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "fr" in value &&
    "ar" in value &&
    typeof value.fr === "string" &&
    typeof value.ar === "string"
  ) {
    return buildLocalizedText({
      ar: value.ar,
      fr: value.fr
    });
  }

  return null;
};

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === newItem.id);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === newItem.id
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              )
            };
          }

          return { items: [...state.items, newItem] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item))
        }));
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      clearCart: () => set({ items: [] })
    }),
    {
      name: "cart-storage",
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              items?: Array<
                Omit<Partial<CartItem>, "name" | "optionLabel"> & {
                  id?: string;
                  name?: CartItem["name"] | string;
                  optionLabel?: CartItem["optionLabel"] | string;
                }
              >;
            }
          | undefined;
        const items = Array.isArray(state?.items)
          ? (state.items
              .map((item) => {
                const name = toLocalizedText(item.name);

                if (
                  !item.id ||
                  !name ||
                  !item.image ||
                  typeof item.price !== "number" ||
                  typeof item.quantity !== "number"
                ) {
                  return null;
                }

                const productId = item.productId || item.id.split(":")[0];

                if (!productId) {
                  return null;
                }

                return {
                  id: item.id,
                  image: item.image,
                  name,
                  optionId: item.optionId,
                  optionLabel: toLocalizedText(item.optionLabel) ?? undefined,
                  price: item.price,
                  productId,
                  productSlug: item.productSlug || productId,
                  quantity: item.quantity
                } satisfies CartItem;
              })
              .filter(Boolean) as CartItem[])
          : [];

        return {
          items
        };
      }
    }
  )
);

// =============================================================================
// LOCAL STORAGE DATA SERVICE
// Replaces Supabase for demo/offline functionality
// =============================================================================

const STORAGE_KEYS = {
  RESTAURANTS: 'grubby-restaurants',
  PROFILE: 'grubby-profile',
  SETTINGS: 'grubby-settings',
} as const;

// Generate a UUID for new items
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generic localStorage helpers
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    // If storage is full, try to clear old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, attempting to clear old data');
      // Could implement cleanup logic here
    }
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

// Restaurant-specific functions
export const restaurantStorage = {
  getAll: () => getFromStorage<any[]>(STORAGE_KEYS.RESTAURANTS, []),

  save: (restaurants: any[]) => setToStorage(STORAGE_KEYS.RESTAURANTS, restaurants),

  add: (restaurant: any) => {
    const restaurants = restaurantStorage.getAll();
    restaurants.unshift(restaurant);
    restaurantStorage.save(restaurants);
    return restaurant;
  },

  update: (id: string, updates: Partial<any>) => {
    const restaurants = restaurantStorage.getAll();
    const index = restaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      restaurants[index] = { ...restaurants[index], ...updates, updatedAt: new Date().toISOString() };
      restaurantStorage.save(restaurants);
      return restaurants[index];
    }
    return null;
  },

  delete: (id: string) => {
    const restaurants = restaurantStorage.getAll();
    const filtered = restaurants.filter(r => r.id !== id);
    restaurantStorage.save(filtered);
  },

  getById: (id: string) => {
    const restaurants = restaurantStorage.getAll();
    return restaurants.find(r => r.id === id);
  },
};

// Convert File to base64 data URL (compressed)
export async function fileToDataUrl(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Convert multiple files to data URLs
export async function filesToDataUrls(
  files: File[],
  maxWidth = 640,
  quality = 0.6,
  onProgress?: (processed: number, total: number) => void
): Promise<string[]> {
  const dataUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const dataUrl = await fileToDataUrl(files[i], maxWidth, quality);
      dataUrls.push(dataUrl);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to convert file ${i}:`, error);
    }
  }

  return dataUrls;
}

export { STORAGE_KEYS };

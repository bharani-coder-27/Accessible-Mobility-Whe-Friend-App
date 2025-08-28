import * as SecureStore from "expo-secure-store";

export async function saveToStorage(key: string, value: any) {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    await SecureStore.setItemAsync(key, stringValue);
  } catch (error) {
    console.error("Error saving to storage", error);
  }
}

export async function getFromStorage<T = any>(key: string): Promise<T | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T; // If it's not JSON, return as string
      }
    }
    return null;
  } catch (error) {
    console.error("Error retrieving from storage", error);
    return null;
  }
}

export async function removeFromStorage(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error("Error removing from storage", error);
  }
}

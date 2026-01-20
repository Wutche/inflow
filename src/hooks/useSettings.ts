"use client";

import { useSyncExternalStore, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface AccountSettings {
  fullName: string;
  email: string;
  bio: string;
  profilePicture: string | null; // Base64 data URL
}

export interface BusinessSettings {
  legalEntityName: string;
  country: string;
  taxId: string;
  currency: string;
}

export interface NotificationPreferences {
  invoicePaid: boolean;
  overdueReminders: boolean;
  bridgeCompletions: boolean;
  securityAlerts: boolean;
}

export interface AppSettings {
  account: AccountSettings;
  business: BusinessSettings;
  notifications: NotificationPreferences;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_ACCOUNT: AccountSettings = {
  fullName: "",
  email: "",
  bio: "",
  profilePicture: null,
};

const DEFAULT_BUSINESS: BusinessSettings = {
  legalEntityName: "",
  country: "United States",
  taxId: "",
  currency: "USD (United States Dollar)",
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  invoicePaid: true,
  overdueReminders: true,
  bridgeCompletions: true,
  securityAlerts: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  account: DEFAULT_ACCOUNT,
  business: DEFAULT_BUSINESS,
  notifications: DEFAULT_NOTIFICATIONS,
};

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = "inflow_settings";

// Module-level cache
let cachedSettings: AppSettings = DEFAULT_SETTINGS;
let cacheInitialized = false;

function readFromStorage(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  if (cacheInitialized) {
    return cachedSettings;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      // Merge with defaults to ensure all fields exist
      cachedSettings = {
        account: { ...DEFAULT_ACCOUNT, ...parsed.account },
        business: { ...DEFAULT_BUSINESS, ...parsed.business },
        notifications: { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications },
      };
    } else {
      cachedSettings = DEFAULT_SETTINGS;
    }
  } catch {
    console.warn("Failed to parse settings from localStorage");
    cachedSettings = DEFAULT_SETTINGS;
  }

  cacheInitialized = true;
  return cachedSettings;
}

function writeToStorage(settings: AppSettings): void {
  cachedSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
}

// ============================================================================
// SUBSCRIBERS
// ============================================================================

const subscribers = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cacheInitialized = false;
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): AppSettings {
  return readFromStorage();
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => callback());
}

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

/**
 * Resize and compress an image file to Base64
 * @param file - The image file to process
 * @param maxSize - Maximum width/height in pixels (default 200)
 * @param quality - JPEG quality 0-1 (default 0.8)
 */
export function processProfileImage(
  file: File,
  maxSize: number = 200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }

    // Validate file size (max 5MB input)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Image must be smaller than 5MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 JPEG
        const base64 = canvas.toDataURL("image/jpeg", quality);
        
        // Check final size (should be much smaller now)
        const sizeInBytes = (base64.length * 3) / 4;
        if (sizeInBytes > 500 * 1024) {
          // Try with lower quality
          const lowerQuality = canvas.toDataURL("image/jpeg", 0.5);
          resolve(lowerQuality);
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// HOOK
// ============================================================================

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  /**
   * Update account settings
   */
  const updateAccount = useCallback(
    (updates: Partial<AccountSettings>): void => {
      const current = readFromStorage();
      const updated: AppSettings = {
        ...current,
        account: { ...current.account, ...updates },
      };
      writeToStorage(updated);
      notifySubscribers();
    },
    []
  );

  /**
   * Update business settings
   */
  const updateBusiness = useCallback(
    (updates: Partial<BusinessSettings>): void => {
      const current = readFromStorage();
      const updated: AppSettings = {
        ...current,
        business: { ...current.business, ...updates },
      };
      writeToStorage(updated);
      notifySubscribers();
    },
    []
  );

  /**
   * Update notification preferences
   */
  const updateNotifications = useCallback(
    (updates: Partial<NotificationPreferences>): void => {
      const current = readFromStorage();
      const updated: AppSettings = {
        ...current,
        notifications: { ...current.notifications, ...updates },
      };
      writeToStorage(updated);
      notifySubscribers();
    },
    []
  );

  /**
   * Update profile picture
   */
  const updateProfilePicture = useCallback(
    async (file: File): Promise<void> => {
      const base64 = await processProfileImage(file);
      updateAccount({ profilePicture: base64 });
    },
    [updateAccount]
  );

  /**
   * Remove profile picture
   */
  const removeProfilePicture = useCallback((): void => {
    updateAccount({ profilePicture: null });
  }, [updateAccount]);

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback((): void => {
    writeToStorage(DEFAULT_SETTINGS);
    notifySubscribers();
  }, []);

  return {
    settings,
    account: settings.account,
    business: settings.business,
    notifications: settings.notifications,
    updateAccount,
    updateBusiness,
    updateNotifications,
    updateProfilePicture,
    removeProfilePicture,
    resetSettings,
  };
}

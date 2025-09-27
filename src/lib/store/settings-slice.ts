import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Settings interface
export interface UserSettings {
  // Contract display settings
  defaultContractStatus: 'active' | 'all' | 'archived' | 'awarded' | 'cancelled';
  contractsPerPage: number;
  defaultSortBy: 'posted_date' | 'title' | 'agency' | 'due_date';
  defaultSortOrder: 'asc' | 'desc';
  
  // Filter preferences
  rememberFilters: boolean;
  autoApplyFilters: boolean;
  
  // UI preferences
  theme: 'light' | 'dark' | 'system';
  compactView: boolean;
  showAdvancedFilters: boolean;
}

// Default settings
const defaultSettings: UserSettings = {
  defaultContractStatus: 'active',
  contractsPerPage: 20,
  defaultSortBy: 'posted_date',
  defaultSortOrder: 'desc',
  rememberFilters: false,
  autoApplyFilters: true,
  theme: 'system',
  compactView: false,
  showAdvancedFilters: false,
};

// Load settings from localStorage
const loadSettings = (): UserSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem('samx-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  
  return defaultSettings;
};

// Save settings to localStorage
const saveSettings = (settings: UserSettings) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('samx-settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

// Settings slice state interface
interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: loadSettings(),
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Update individual settings
    updateSetting: <K extends keyof UserSettings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: UserSettings[K] }>
    ) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
      saveSettings(state.settings);
    },
    
    // Update multiple settings at once
    updateSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      saveSettings(state.settings);
    },
    
    // Reset to default settings
    resetSettings: (state) => {
      state.settings = defaultSettings;
      saveSettings(state.settings);
    },
    
    // Load settings (useful for hydration)
    reloadSettings: (state) => {
      state.settings = loadSettings();
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  updateSetting,
  updateSettings,
  resetSettings,
  reloadSettings,
  setError,
  clearError,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings.settings;
export const selectSettingsLoading = (state: { settings: SettingsState }) => state.settings.isLoading;
export const selectSettingsError = (state: { settings: SettingsState }) => state.settings.error;

// Specific setting selectors for convenience
export const selectDefaultContractStatus = (state: { settings: SettingsState }) => 
  state.settings.settings.defaultContractStatus;
export const selectContractsPerPage = (state: { settings: SettingsState }) => 
  state.settings.settings.contractsPerPage;
export const selectDefaultSort = (state: { settings: SettingsState }) => ({
  sortBy: state.settings.settings.defaultSortBy,
  sortOrder: state.settings.settings.defaultSortOrder,
});
export const selectTheme = (state: { settings: SettingsState }) => 
  state.settings.settings.theme;
export const selectCompactView = (state: { settings: SettingsState }) => 
  state.settings.settings.compactView;
export const selectShowAdvancedFilters = (state: { settings: SettingsState }) => 
  state.settings.settings.showAdvancedFilters;

export default settingsSlice.reducer;
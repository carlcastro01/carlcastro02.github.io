import { createContext, type ComponentChildren, type FunctionComponent } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';

type Theme = 'system' | 'dark' | 'light';

interface SettingsState {
  theme: Theme;
  showOfflineTiles: boolean;
  mapTileSource: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'dark',
  showOfflineTiles: true,
  mapTileSource: 'offline'
};

interface SettingsContextValue extends SettingsState {
  update(partial: Partial<SettingsState>): void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const STORAGE_KEY = 'mesh-settings';

export const SettingsProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const [state, setState] = useState<SettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.warn('Failed to load settings', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((partial: Partial<SettingsState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    ...state,
    update
  }), [state, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

import type { PRCategory } from '@/lib/github/api'

export interface CategoryConfig {
  id: PRCategory
  label: string
  enabled: boolean
}

export interface Settings {
  categories: CategoryConfig[]
  refreshInterval: number // minutes
}

const SETTINGS_KEY = 'gh_pr_settings'

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'created', label: 'Opened by me', enabled: true },
  { id: 'review_requested', label: 'Review requested', enabled: true },
  { id: 'assigned', label: 'Assigned', enabled: true },
  { id: 'mentioned', label: 'Mentioned', enabled: false },
]

const DEFAULT_SETTINGS: Settings = {
  categories: DEFAULT_CATEGORIES,
  refreshInterval: 5,
}

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const stored = result[SETTINGS_KEY] as Settings | undefined
      if (!stored) {
        resolve(DEFAULT_SETTINGS)
        return
      }
      // Merge with defaults in case new categories are added
      const categories = DEFAULT_CATEGORIES.map((defaultCat) => {
        const saved = stored.categories?.find((c) => c.id === defaultCat.id)
        return saved ?? defaultCat
      })
      resolve({
        ...DEFAULT_SETTINGS,
        ...stored,
        categories,
      })
    })
  })
}

export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => resolve())
  })
}

export async function getEnabledCategories(): Promise<PRCategory[]> {
  const settings = await getSettings()
  return settings.categories.filter((c) => c.enabled).map((c) => c.id)
}

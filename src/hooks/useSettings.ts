import { useCallback, useEffect, useState } from 'react'
import {
  getSettings,
  saveSettings,
  type CategoryConfig,
  type Settings,
  DEFAULT_CATEGORIES,
} from '@/lib/storage/settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    categories: DEFAULT_CATEGORIES,
    refreshInterval: 5,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false))
  }, [])

  const updateCategories = useCallback(async (categories: CategoryConfig[]) => {
    const newSettings = { ...settings, categories }
    setSettings(newSettings)
    await saveSettings(newSettings)
  }, [settings])

  const toggleCategory = useCallback(async (categoryId: string) => {
    const categories = settings.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    )
    await updateCategories(categories)
  }, [settings.categories, updateCategories])

  const updateRefreshInterval = useCallback(async (minutes: number) => {
    const newSettings = { ...settings, refreshInterval: minutes }
    setSettings(newSettings)
    await saveSettings(newSettings)
  }, [settings])

  return {
    settings,
    isLoading,
    toggleCategory,
    updateRefreshInterval,
  }
}

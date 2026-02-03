import { useCallback, useEffect, useState } from 'react'
import { GitHubClient } from '@/lib/github/api'
import { initiateOAuthFlow } from '@/lib/github/oauth'
import type { Account, GitHubUser } from '@/lib/github/types'
import {
  addAccount,
  getActiveAccount,
  getAuthState,
  removeAccount,
  setActiveAccount,
} from '@/lib/storage/auth'

interface UseAuthState {
  isAuthenticated: boolean
  user: GitHubUser | null
  accounts: Account[]
  isLoading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  switchAccount: (userId: number) => Promise<void>
  accessToken: string | null
}

export function useAuth(): UseAuthState {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAuthState = useCallback(async () => {
    try {
      const state = await getAuthState()
      setAccounts(state.accounts)

      const active = await getActiveAccount()
      setActiveAccountState(active)
    } catch (err) {
      console.error('Failed to load auth state:', err)
    }
  }, [])

  useEffect(() => {
    loadAuthState().finally(() => setIsLoading(false))
  }, [loadAuthState])

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await initiateOAuthFlow()
      const client = new GitHubClient(token)
      const userData = await client.getCurrentUser()

      await addAccount(token, userData)
      await loadAuthState()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadAuthState])

  const logout = useCallback(async () => {
    if (!activeAccount) return

    setIsLoading(true)

    try {
      await removeAccount(activeAccount.user.id)
      await loadAuthState()
    } catch (err) {
      console.error('Failed to remove account:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeAccount, loadAuthState])

  const switchAccount = useCallback(
    async (userId: number) => {
      setIsLoading(true)

      try {
        await setActiveAccount(userId)
        await loadAuthState()
      } catch (err) {
        console.error('Failed to switch account:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [loadAuthState]
  )

  return {
    isAuthenticated: !!activeAccount,
    user: activeAccount?.user ?? null,
    accounts,
    isLoading,
    error,
    login,
    logout,
    switchAccount,
    accessToken: activeAccount?.accessToken ?? null,
  }
}

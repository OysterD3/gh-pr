import type { Account, AuthState, GitHubUser } from '@/lib/github/types'

const STORAGE_KEY = 'gh_pr_auth'

const DEFAULT_STATE: AuthState = {
  accounts: [],
  activeAccountId: null,
}

interface LegacyAuthState {
  accessToken: string | null
  user: GitHubUser | null
}

export async function getAuthState(): Promise<AuthState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as Record<string, unknown> | undefined

      if (!stored || typeof stored !== 'object') {
        resolve(DEFAULT_STATE)
        return
      }

      // Migrate from old single-account format
      if ('accessToken' in stored && !('accounts' in stored)) {
        const legacy = stored as unknown as LegacyAuthState
        if (legacy.accessToken && legacy.user) {
          resolve({
            accounts: [{ accessToken: legacy.accessToken, user: legacy.user }],
            activeAccountId: legacy.user.id,
          })
        } else {
          resolve(DEFAULT_STATE)
        }
        return
      }

      resolve(stored as unknown as AuthState)
    })
  })
}

async function saveAuthState(state: AuthState): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve())
  })
}

export async function addAccount(
  accessToken: string,
  user: GitHubUser
): Promise<void> {
  const state = await getAuthState()

  // Check if account already exists
  const existingIndex = state.accounts.findIndex((a) => a.user.id === user.id)

  if (existingIndex >= 0) {
    // Update existing account's token
    state.accounts[existingIndex] = { accessToken, user }
  } else {
    // Add new account
    state.accounts.push({ accessToken, user })
  }

  // Set as active account
  state.activeAccountId = user.id

  await saveAuthState(state)
}

export async function removeAccount(userId: number): Promise<void> {
  const state = await getAuthState()

  state.accounts = state.accounts.filter((a) => a.user.id !== userId)

  // If we removed the active account, switch to another one
  if (state.activeAccountId === userId) {
    state.activeAccountId = state.accounts[0]?.user.id ?? null
  }

  await saveAuthState(state)
}

export async function setActiveAccount(userId: number): Promise<void> {
  const state = await getAuthState()

  const accountExists = state.accounts.some((a) => a.user.id === userId)
  if (accountExists) {
    state.activeAccountId = userId
    await saveAuthState(state)
  }
}

export async function getActiveAccount(): Promise<Account | null> {
  const state = await getAuthState()

  if (!state.activeAccountId) {
    return state.accounts[0] ?? null
  }

  return state.accounts.find((a) => a.user.id === state.activeAccountId) ?? null
}

export async function clearAuthState(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, () => resolve())
  })
}

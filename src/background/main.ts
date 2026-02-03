// Background service worker for handling OAuth token exchange and periodic PR updates

const WORKER_URL = 'https://gh-pr-oauth.d3fb.workers.dev/exchange'
const GITHUB_API_BASE = 'https://api.github.com'
const STORAGE_KEY = 'gh_pr_auth'

interface Account {
  accessToken: string
  user: { id: number; login: string }
}

interface AuthState {
  accounts: Account[]
  activeAccountId: number | null
}

interface ExchangeCodeMessage {
  type: 'EXCHANGE_CODE'
  code: string
}

interface ExchangeCodeResponse {
  success: boolean
  accessToken?: string
  error?: string
}

// Message handler for OAuth token exchange
chrome.runtime.onMessage.addListener(
  (
    message: ExchangeCodeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExchangeCodeResponse) => void
  ) => {
    if (message.type === 'EXCHANGE_CODE') {
      exchangeCodeForToken(message.code)
        .then((accessToken) => {
          sendResponse({ success: true, accessToken })
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message })
        })
      return true
    }
  }
)

async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    // Log detailed error for debugging but don't expose to user
    console.error('Token exchange failed:', response.status)
    throw new Error('Authentication failed. Please try again.')
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Authentication failed. Please try again.')
  }
  return data.access_token
}

// Badge update logic
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const authState = result[STORAGE_KEY] as AuthState | undefined

    if (!authState?.accounts?.length) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    // Get active account
    const activeAccount = authState.activeAccountId
      ? authState.accounts.find((a) => a.user.id === authState.activeAccountId)
      : authState.accounts[0]

    if (!activeAccount) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    const { accessToken, user } = activeAccount

    // Fetch PR count
    const query = encodeURIComponent(`type:pr author:${user.login} is:open`)
    const response = await fetch(
      `${GITHUB_API_BASE}/search/issues?q=${query}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      const count = data.total_count || 0
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' })
      chrome.action.setBadgeBackgroundColor({ color: '#238636' })
    }
  } catch (error) {
    console.error('Failed to update badge:', error)
  }
}

// Set up periodic updates
chrome.alarms.create('updateBadge', { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge()
  }
})

// Update badge on storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    updateBadge()
  }
})

// Initial badge update
updateBadge()

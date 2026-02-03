const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const SCOPES = 'read:user repo'

// Store state for CSRF verification
let pendingState: string | null = null

export async function initiateOAuthFlow(): Promise<string> {
  const redirectUrl = chrome.identity.getRedirectURL('callback')

  // Generate and store state for CSRF protection
  const state = crypto.randomUUID()
  pendingState = state

  const authUrl = new URL(GITHUB_AUTH_URL)
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUrl)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('state', state)

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          pendingState = null
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (!responseUrl) {
          pendingState = null
          reject(new Error('No response URL received'))
          return
        }

        const url = new URL(responseUrl)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        const returnedState = url.searchParams.get('state')

        // Verify state to prevent CSRF attacks
        if (returnedState !== pendingState) {
          pendingState = null
          reject(new Error('State mismatch - potential CSRF attack'))
          return
        }
        pendingState = null

        if (error) {
          reject(new Error(`OAuth error: ${error}`))
          return
        }

        if (!code) {
          reject(new Error('No authorization code received'))
          return
        }

        // Send code to background script for token exchange
        chrome.runtime.sendMessage(
          { type: 'EXCHANGE_CODE', code },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }

            if (response.success) {
              resolve(response.accessToken)
            } else {
              reject(new Error(response.error || 'Token exchange failed'))
            }
          }
        )
      }
    )
  })
}

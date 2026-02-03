export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  name: string | null
}

export interface PullRequestLabel {
  id: number
  name: string
  color: string
}

export interface PullRequestRepository {
  id: number
  name: string
  full_name: string
  html_url: string
}

export type CheckStatus = 'pending' | 'success' | 'failure' | 'neutral'

export interface PullRequest {
  id: number
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  draft: boolean
  created_at: string
  updated_at: string
  labels: PullRequestLabel[]
  user: GitHubUser
  repository_url: string
  repository?: PullRequestRepository
  checkStatus?: CheckStatus
}

export interface SearchPullRequestsResponse {
  total_count: number
  incomplete_results: boolean
  items: PullRequest[]
}

export interface Account {
  accessToken: string
  user: GitHubUser
}

export interface AuthState {
  accounts: Account[]
  activeAccountId: number | null // GitHub user id
}

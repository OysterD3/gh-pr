import type { CheckStatus, GitHubUser, PullRequest, SearchPullRequestsResponse } from './types'

const GITHUB_API_BASE = 'https://api.github.com'

interface CombinedStatusResponse {
  state: 'pending' | 'success' | 'failure' | 'error'
  total_count: number
}

interface CheckRunsResponse {
  total_count: number
  check_runs: Array<{
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  }>
}

export type PRCategory = 'created' | 'review_requested' | 'assigned' | 'mentioned'

export class GitHubClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Validate GitHub username format
  private validateUsername(username: string): string {
    // GitHub usernames: alphanumeric and hyphens, 1-39 chars, can't start/end with hyphen
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$|^[a-zA-Z0-9]$/.test(username)) {
      throw new Error('Invalid username format')
    }
    return username
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async getCurrentUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user')
  }

  private async getCheckStatus(owner: string, repo: string, ref: string): Promise<CheckStatus> {
    try {
      const checkRuns = await this.fetch<CheckRunsResponse>(
        `/repos/${owner}/${repo}/commits/${ref}/check-runs`
      )

      if (checkRuns.total_count > 0) {
        const hasFailure = checkRuns.check_runs.some(
          (run) => run.conclusion === 'failure' || run.conclusion === 'timed_out'
        )
        const hasPending = checkRuns.check_runs.some(
          (run) => run.status === 'queued' || run.status === 'in_progress'
        )
        const allSuccess = checkRuns.check_runs.every(
          (run) => run.conclusion === 'success' || run.conclusion === 'skipped' || run.conclusion === 'neutral'
        )

        if (hasFailure) return 'failure'
        if (hasPending) return 'pending'
        if (allSuccess) return 'success'
        return 'neutral'
      }

      const status = await this.fetch<CombinedStatusResponse>(
        `/repos/${owner}/${repo}/commits/${ref}/status`
      )

      if (status.total_count === 0) return 'neutral'
      if (status.state === 'success') return 'success'
      if (status.state === 'pending') return 'pending'
      return 'failure'
    } catch {
      return 'neutral'
    }
  }

  private buildQuery(username: string, category: PRCategory): string {
    const base = 'type:pr is:open'
    switch (category) {
      case 'created':
        return `${base} author:${username}`
      case 'review_requested':
        return `${base} review-requested:${username}`
      case 'assigned':
        return `${base} assignee:${username}`
      case 'mentioned':
        return `${base} mentions:${username}`
    }
  }

  async getPRsByCategory(username: string, category: PRCategory): Promise<PullRequest[]> {
    const validatedUsername = this.validateUsername(username)
    const query = encodeURIComponent(this.buildQuery(validatedUsername, category))
    const response = await this.fetch<SearchPullRequestsResponse>(
      `/search/issues?q=${query}&sort=updated&order=desc&per_page=50`
    )

    const prsWithDetails = await Promise.all(
      response.items.map(async (pr) => {
        try {
          const repoUrlParts = pr.repository_url.split('/')
          const owner = repoUrlParts[repoUrlParts.length - 2]
          const repo = repoUrlParts[repoUrlParts.length - 1]

          const prDetails = await this.fetch<{ head: { sha: string } }>(
            `/repos/${owner}/${repo}/pulls/${pr.number}`
          )

          const checkStatus = await this.getCheckStatus(owner, repo, prDetails.head.sha)

          return {
            ...pr,
            repository: {
              id: 0,
              name: repo,
              full_name: `${owner}/${repo}`,
              html_url: `https://github.com/${owner}/${repo}`,
            },
            checkStatus,
          }
        } catch {
          return {
            ...pr,
            checkStatus: 'neutral' as CheckStatus,
          }
        }
      })
    )

    return prsWithDetails
  }

  // Legacy method for badge count
  async getOpenPRs(username: string): Promise<PullRequest[]> {
    return this.getPRsByCategory(username, 'created')
  }
}

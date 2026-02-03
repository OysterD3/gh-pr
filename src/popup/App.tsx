import {
  ArrowLeft,
  Check,
  ChevronDown,
  Circle,
  Github,
  GitPullRequest,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useCategorizedPRs, type CategoryPRs } from '@/hooks/useCategorizedPRs'
import { useSettings } from '@/hooks/useSettings'
import type { CheckStatus, PullRequest } from '@/lib/github/types'
import { cn } from '@/lib/utils'

function StatusIcon({ status }: { status?: CheckStatus }) {
  switch (status) {
    case 'success':
      return <Check className="h-3.5 w-3.5 text-green-500" />
    case 'failure':
      return <X className="h-3.5 w-3.5 text-red-500" />
    case 'pending':
      return <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />
  }
}

function PRItem({ pr }: { pr: PullRequest }) {
  const repoName = pr.repository?.full_name || 'Unknown'

  return (
    <a
      href={pr.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors"
    >
      <div className="flex flex-col items-center gap-1 mt-0.5">
        <GitPullRequest className="h-4 w-4 shrink-0 text-green-600" />
        <StatusIcon status={pr.checkStatus} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">{pr.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{repoName}</span>
          {pr.draft && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              Draft
            </Badge>
          )}
        </div>
      </div>
    </a>
  )
}

function PRListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-2 p-2">
          <Skeleton className="h-4 w-4 mt-0.5" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CategorySection({ category }: { category: CategoryPRs }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/50 transition-colors"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {category.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{category.prs.length}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              !isExpanded && '-rotate-90'
            )}
          />
        </div>
      </button>
      {isExpanded && (
        <div className="px-2 pb-2">
          {category.isLoading ? (
            <PRListSkeleton />
          ) : category.error ? (
            <p className="text-xs text-destructive p-2">{category.error}</p>
          ) : category.prs.length > 0 ? (
            <div className="space-y-1">
              {category.prs.map((pr) => (
                <PRItem key={pr.id} pr={pr} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground p-2">No pull requests</p>
          )}
        </div>
      )}
    </div>
  )
}

function SettingsPage({ onBack }: { onBack: () => void }) {
  const { settings, toggleCategory, updateRefreshInterval } = useSettings()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold">Settings</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-sm font-medium mb-3">Categories</h2>
            <div className="space-y-2">
              {settings.categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                >
                  <span className="text-sm">{cat.label}</span>
                  <input
                    type="checkbox"
                    checked={cat.enabled}
                    onChange={() => toggleCategory(cat.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3">Refresh Interval</h2>
            <select
              value={settings.refreshInterval}
              onChange={(e) => updateRefreshInterval(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-muted border border-border text-sm"
            >
              <option value={1}>Every 1 minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
            </select>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function MainView({
  user,
  accounts,
  onLogout,
  onLogin,
  onSwitchAccount,
  onOpenSettings,
}: {
  user: { id: number; login: string; name: string | null; avatar_url: string }
  accounts: Array<{ user: { id: number; login: string; avatar_url: string } }>
  onLogout: () => void
  onLogin: () => void
  onSwitchAccount: (userId: number) => void
  onOpenSettings: () => void
}) {
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const account = accounts.find((a) => a.user.id === user.id)
  const { categories, isLoading, refresh } = useCategorizedPRs(
    (account as { accessToken?: string } | undefined)?.accessToken ?? null,
    user.login,
    user.id
  )

  return (
    <div className="flex flex-col h-full">
      {/* Account Header */}
      <div className="relative shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-3 p-3 flex-1 hover:bg-accent transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.login} />
              <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.login}</p>
              <p className="text-xs text-muted-foreground">@{user.login}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                showAccountMenu && 'rotate-180'
              )}
            />
          </button>
          <div className="flex items-center gap-1 pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showAccountMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAccountMenu(false)} />
            <div className="absolute left-0 right-0 top-full z-20 bg-card border-t border-border shadow-lg">
              {accounts.map((account) => (
                <button
                  key={account.user.id}
                  onClick={() => {
                    onSwitchAccount(account.user.id)
                    setShowAccountMenu(false)
                  }}
                  className="flex items-center gap-3 p-3 w-full hover:bg-accent transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={account.user.avatar_url} alt={account.user.login} />
                    <AvatarFallback>
                      {account.user.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left text-sm">@{account.user.login}</span>
                  {account.user.id === user.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    onLogin()
                    setShowAccountMenu(false)
                  }}
                  className="flex items-center gap-3 p-3 w-full hover:bg-accent transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add another account
                </button>
                <button
                  onClick={() => {
                    onLogout()
                    setShowAccountMenu(false)
                  }}
                  className="flex items-center gap-3 p-3 w-full hover:bg-accent transition-colors text-sm text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out @{user.login}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* PR Categories */}
      <ScrollArea className="flex-1 border-t border-border">
        {isLoading && categories.length === 0 ? (
          <PRListSkeleton />
        ) : categories.length > 0 ? (
          categories.map((cat) => <CategorySection key={cat.category} category={cat} />)
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <GitPullRequest className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No categories enabled</p>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              Configure categories
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, user, accounts, isLoading, login, logout, switchAccount } = useAuth()
  const [view, setView] = useState<'main' | 'settings'>('main')

  if (!isAuthenticated || !user) {
    return (
      <div className="w-[360px] h-[400px] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="p-4 rounded-full bg-muted">
            <Github className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold">GitHub PR Tracker</h1>
            <p className="text-sm text-muted-foreground">Sign in to view your PRs</p>
          </div>
        </div>
        <Button
          className="w-full max-w-[200px] bg-[#24292f] hover:bg-[#24292f]/90 text-white"
          onClick={login}
          disabled={isLoading}
        >
          <LogIn className="h-4 w-4" />
          {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-[360px] h-[500px]">
      {view === 'settings' ? (
        <SettingsPage onBack={() => setView('main')} />
      ) : (
        <MainView
          user={user}
          accounts={accounts}
          onLogout={logout}
          onLogin={login}
          onSwitchAccount={switchAccount}
          onOpenSettings={() => setView('settings')}
        />
      )}
    </div>
  )
}

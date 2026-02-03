import { Github, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginButtonProps {
  onClick: () => void
  isLoading?: boolean
}

export function LoginButton({ onClick, isLoading }: LoginButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="w-full bg-[#24292f] hover:bg-[#24292f]/90 text-white"
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Github />
      )}
      {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
    </Button>
  )
}

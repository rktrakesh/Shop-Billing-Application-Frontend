import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <header className="sticky top-0 z-20 h-14 bg-background/95 backdrop-blur-sm border-b border-border/30 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="text-text-muted hover:text-text-primary transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:block text-sm text-text-muted">
          Welcome, <span className="text-text-secondary font-medium">{user?.fullName || user?.username}</span>
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldX, FileQuestion, ServerCrash, Shirt } from 'lucide-react'

interface ErrorPageProps {
  code: string
  icon: React.ElementType
  title: string
  description: string
}

function ErrorPage({ code, icon: Icon, title, description }: ErrorPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-2xl mb-6">
          <Icon className="h-8 w-8 text-danger" />
        </div>
        <p className="text-6xl font-bold text-text-primary/20 mb-2">{code}</p>
        <h1 className="text-xl font-bold text-text-primary mb-2">{title}</h1>
        <p className="text-sm text-text-muted mb-6">{description}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Shirt className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      icon={FileQuestion}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  )
}

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      icon={ShieldX}
      title="Access denied"
      description="You don't have permission to view this page. Contact your administrator if you believe this is a mistake."
    />
  )
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      code="500"
      icon={ServerCrash}
      title="Something went wrong"
      description="An unexpected server error occurred. Please try again later."
    />
  )
}

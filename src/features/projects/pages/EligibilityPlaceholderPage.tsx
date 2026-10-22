import { Link, useSearchParams } from 'react-router-dom'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { DEFAULT_CERT_DISPLAY_NAME } from '@/features/projects/lib/certificationCatalog'

export function EligibilityPlaceholderPage() {
  const [params] = useSearchParams()
  const cert = (params.get('cert') || DEFAULT_CERT_DISPLAY_NAME).toUpperCase()

  return (
    <div className="mx-auto mt-16 max-w-lg px-6" data-testid="eligibility-placeholder">
      <h1 className="text-xl font-semibold">Check {cert} Eligibility</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The eligibility questionnaire will be available in a later release. Your answers will pre-fill
        the scorecard.
      </p>
      <Link to="/projects/new" className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}>
        Back to project set-up
      </Link>
    </div>
  )
}

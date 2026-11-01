import { Link } from 'react-router-dom'
import commanLogo from '@/assets/comman-logo.png'
import { cn } from '@/shared/lib/utils'

type CommanLogoProps = {
  to?: string | null
  className?: string
}

export function CommanLogo({ to = '/app/projects', className }: CommanLogoProps) {
  const image = (
    <img src={commanLogo} alt="Comman" className={cn('h-[22px] w-auto', className)} />
  )
  if (!to) return image
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="Comman home">
      {image}
    </Link>
  )
}

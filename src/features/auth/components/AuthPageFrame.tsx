import type { ReactNode } from 'react'
import commanLogo from '@/assets/comman-logo.png'

export function AuthPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="mb-8 flex justify-center">
        <img src={commanLogo} alt="Comman" className="h-9 w-auto" />
      </div>
      {children}
    </div>
  )
}

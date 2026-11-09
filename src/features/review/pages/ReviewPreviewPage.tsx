import { ReviewResponsibilitiesStep } from '@/features/review/components/ReviewResponsibilitiesStep'

export function ReviewPreviewPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <ReviewResponsibilitiesStep onBack={() => {}} onNext={() => {}} />
    </div>
  )
}


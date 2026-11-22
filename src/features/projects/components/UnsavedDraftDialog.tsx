import { Button } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

type UnsavedDraftDialogProps = {
  open: boolean
  saving?: boolean
  onSaveDraft: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedDraftDialog({
  open,
  saving = false,
  onSaveDraft,
  onDiscard,
  onCancel,
}: UnsavedDraftDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent data-testid="unsaved-draft-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Save your progress as a draft?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Save a draft to continue later, or discard them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-8 border-neutral-200 bg-white text-xs font-medium text-neutral-800 shadow-none"
            onClick={onCancel}
            disabled={saving}
            data-testid="unsaved-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 border-neutral-200 bg-white text-xs font-medium text-neutral-800 shadow-none"
            onClick={onDiscard}
            disabled={saving}
            data-testid="unsaved-discard"
          >
            Discard
          </Button>
          <Button
            type="button"
            className="h-8 bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800"
            onClick={onSaveDraft}
            disabled={saving}
            data-testid="unsaved-save-draft"
          >
            {saving ? 'Saving...' : 'Save draft'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

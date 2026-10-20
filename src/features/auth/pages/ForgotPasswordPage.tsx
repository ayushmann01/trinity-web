import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Link } from 'react-router-dom'
import { useForgotPasswordMutation } from '@/features/auth/api/authApi'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
})
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [forgot, { isLoading }] = useForgotPasswordMutation()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      await forgot(values).unwrap()
      toast.success('If that email exists, reset instructions were sent')
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message
      toast.error(msg || 'Failed to request reset')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-semibold mb-6">Forgot password</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
      <div className="mt-4 text-sm text-muted-foreground">
        <Link className="underline" to="/auth/login">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

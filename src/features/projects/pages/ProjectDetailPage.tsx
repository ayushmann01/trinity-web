import { Link, useParams } from 'react-router-dom'
import { useGetProjectQuery } from '@/features/projects/api/projectsApi'
import {
  useCreateStakeholderMutation,
  useListStakeholderBucketsQuery,
  useListStakeholdersQuery,
} from '@/features/stakeholders/api/stakeholdersApi'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const { data: project } = useGetProjectQuery(projectId, { skip: !projectId })
  const { data: buckets } = useListStakeholderBucketsQuery()
  const { data: stakeholders, refetch } = useListStakeholdersQuery(projectId, {
    skip: !projectId,
  })
  const [createStakeholder, { isLoading: creating }] = useCreateStakeholderMutation()
  const form = useForm<{ name: string; email?: string; bucketId?: string }>({
    defaultValues: { name: '', email: '', bucketId: '' },
  })

  const onAddStakeholder = async (values: { name: string; email?: string; bucketId?: string }) => {
    try {
      await createStakeholder({ projectId, values }).unwrap()
      toast.success('Stakeholder added')
      form.reset()
      refetch()
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message
      toast.error(msg || 'Failed to add stakeholder')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project?.name}</h1>
          <div className="text-sm text-muted-foreground">
            Certification: {project?.certificationId} • Target: {project?.targetPoints ?? '-'}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/app/projects/${projectId}/edit`}
            className={buttonVariants({ size: 'sm', variant: 'outline' })}
          >
            Edit
          </Link>
          <Link
            to={`/app/projects/${projectId}/scorecard`}
            className={buttonVariants({ size: 'sm' })}
          >
            Open Scorecard
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stakeholders</h2>
        <div className="rounded-md border divide-y">
          {stakeholders?.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.email ?? '-'}</div>
              </div>
              <div className="text-sm text-muted-foreground">{s.bucketId ?? '-'}</div>
            </div>
          ))}
          {!stakeholders?.length && <div className="p-3 text-sm text-muted-foreground">None</div>}
        </div>
        <form
          onSubmit={form.handleSubmit(onAddStakeholder)}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name', { required: true })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} />
          </div>
          <div>
            <Label htmlFor="bucketId">Bucket</Label>
            <Select id="bucketId" {...form.register('bucketId')}>
              <option value="">Select bucket</option>
              {buckets?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

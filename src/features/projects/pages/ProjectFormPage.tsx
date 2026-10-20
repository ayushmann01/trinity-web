import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Select } from '@/shared/ui/select'
import {
  useCreateProjectMutation,
  useGetProjectQuery,
  useListCertificationsQuery,
  useUpdateProjectMutation,
} from '@/features/projects/api/projectsApi'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'

const schema = z.object({
  name: z.string().min(1),
  certificationId: z.string().min(1),
  typologyId: z.string().optional(),
  targetPoints: z.coerce.number().int().nonnegative().optional(),
})
type FormValues = z.infer<typeof schema>

export function ProjectFormPage() {
  const { projectId } = useParams()
  const isEdit = Boolean(projectId)
  const { data: project } = useGetProjectQuery(projectId!, { skip: !isEdit })
  const { data: certs } = useListCertificationsQuery()
  const [create, { isLoading: creating }] = useCreateProjectMutation()
  const [update, { isLoading: updating }] = useUpdateProjectMutation()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      certificationId: project?.certificationId ?? '',
      typologyId: project?.typologyId ?? '',
      targetPoints: project?.targetPoints ?? undefined,
    },
    values: project
      ? {
          name: project.name,
          certificationId: project.certificationId,
          typologyId: project.typologyId ?? '',
          targetPoints: project.targetPoints ?? undefined,
        }
      : undefined,
  })

  const watchedCertId = form.watch('certificationId')
  const selectedCert = useMemo(() => {
    return certs?.find((c) => c.id === watchedCertId)
  }, [certs, watchedCertId])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await update({ id: projectId!, changes: values }).unwrap()
        toast.success('Project updated')
        navigate(`/app/projects/${projectId}`)
      } else {
        const p = await create(values).unwrap()
        toast.success('Project created')
        navigate(`/app/projects/${p.id}`)
      }
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message
      toast.error(msg || 'Save failed')
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="certificationId">Certification</Label>
          <Select id="certificationId" {...form.register('certificationId')}>
            <option value="">Select certification</option>
            {certs?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {form.formState.errors.certificationId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.certificationId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="typologyId">Typology</Label>
          <Select id="typologyId" {...form.register('typologyId')}>
            <option value="">Select typology</option>
            {selectedCert?.typologies?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetPoints">Target (credits)</Label>
          <Input id="targetPoints" type="number" {...form.register('targetPoints')} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={creating || updating}>
            {isEdit ? (updating ? 'Saving...' : 'Save') : creating ? 'Creating...' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

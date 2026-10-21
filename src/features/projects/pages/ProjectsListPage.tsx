import { Link, useSearchParams } from 'react-router-dom'
import { useListProjectsQuery } from '@/features/projects/api/projectsApi'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/shared/ui/table'

export function ProjectsListPage() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const pageSize = 10
  const { data, isLoading } = useListProjectsQuery({ page, pageSize })

  const next = () => setParams({ page: String(page + 1) })
  const prev = () => setParams({ page: String(Math.max(1, page - 1)) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link to="/projects/new" className={buttonVariants({})}>
          New Project
        </Link>
      </div>
      {isLoading && <div>Loading...</div>}
      {!isLoading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Target</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.certificationId}</TableCell>
                  <TableCell>{p.targetPoints ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/app/projects/${p.id}`}
                        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                      >
                        View
                      </Link>
                      <Link
                        to={`/app/projects/${p.id}/edit`}
                        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {data?.page ?? page} /{' '}
          {data?.total != null ? Math.max(1, Math.ceil(data.total / pageSize)) : '?'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prev} disabled={page <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={next}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

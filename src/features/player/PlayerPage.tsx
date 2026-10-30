import { Link, useParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'

export function PlayerPage() {
  const { id } = useParams()
  return (
    <div style={{ padding: 'var(--gutter)' }}>
      <PageHeader eyebrow={`Session ${id}`} title="Player" />
      <p>
        Work and rest screens arrive on Days 2–3. <Link to={`/session/${id}/summary`}>Finish</Link> ·{' '}
        <Link to="/">End</Link>
      </p>
    </div>
  )
}

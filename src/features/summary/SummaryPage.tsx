import { Link, useParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'

export function SummaryPage() {
  const { id } = useParams()
  return (
    <div style={{ padding: 'var(--gutter)' }}>
      <PageHeader eyebrow={`Session ${id}`} title="Session complete" />
      <p>
        Summary arrives on Day 4. <Link to="/log">Save to log</Link>
      </p>
    </div>
  )
}

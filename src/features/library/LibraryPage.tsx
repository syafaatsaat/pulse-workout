import { Link } from 'react-router'
import { PageHeader } from '../../app/PageHeader'

export function LibraryPage() {
  return (
    <>
      <PageHeader title="Library" />
      <p>
        Search and filters arrive on Day 5. Sample detail: <Link to="/library/Pushups">Pushups</Link>
      </p>
    </>
  )
}

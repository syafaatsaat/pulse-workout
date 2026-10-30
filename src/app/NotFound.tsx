import { Link } from 'react-router'
import { PageHeader } from './PageHeader'

export function NotFound() {
  return (
    <>
      <PageHeader title="Not found" />
      <Link to="/">Back to Today</Link>
    </>
  )
}

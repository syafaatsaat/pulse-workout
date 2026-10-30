import { Link, useParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'

export function ExerciseDetailPage() {
  const { exerciseId } = useParams()
  return (
    <>
      <Link to="/library">← Library</Link>
      <PageHeader eyebrow={exerciseId} title="Exercise" />
      <p>Images, muscles and steps arrive on Day 5.</p>
    </>
  )
}

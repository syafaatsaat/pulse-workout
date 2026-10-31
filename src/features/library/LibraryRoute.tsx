import { useParams } from 'react-router'
import { useMediaQuery } from '../../app/useMediaQuery'
import { ExerciseDetailPage } from './ExerciseDetailPage'
import { LibraryPage, LibraryTwoPane } from './LibraryPage'

/**
 * /library and /library/:exerciseId. Phone: the list, and the detail as a pushed page.
 * Desktop: one two-pane view for both, so changing the selection keeps the list (and its scroll).
 */
export function LibraryRoute() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const { exerciseId } = useParams()
  if (desktop) return <LibraryTwoPane />
  return exerciseId ? <ExerciseDetailPage /> : <LibraryPage />
}

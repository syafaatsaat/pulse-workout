import { Navigate, useLocation } from 'react-router'

/** The old /log URL (bookmarks, ?month= links) lands on Progress, same month. */
export function LogRedirect() {
  return <Navigate to={{ pathname: '/progress', search: useLocation().search }} replace />
}

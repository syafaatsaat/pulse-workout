import { PageHeader } from '../../app/PageHeader'

const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

export function TodayPage() {
  return (
    <>
      <PageHeader eyebrow={dateLabel.format(new Date())} title="Today" />
      <p>Up next, week strip and quick starts arrive on Day 5.</p>
    </>
  )
}

import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { ShieldCheckIcon } from '../../../../src/components/ui/icons'

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="Every action, every actor, every change — immutably logged."
      />
      <EmptyState
        icon={<ShieldCheckIcon />}
        title="No audit events yet"
        description="As your team uses Covyvo, every action will be captured here with a tamper-evident hash chain."
      />
    </>
  )
}

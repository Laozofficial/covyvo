import { EmptyState } from '../../../src/components/EmptyState'
import { PageHeader } from '../../../src/components/PageHeader'
import { Button } from '../../../src/components/ui/Button'
import { BanknoteIcon } from '../../../src/components/ui/icons'

export default function PayrollPage() {
  return (
    <>
      <PageHeader
        title="Run Payroll"
        description="Gross-to-net with PAYE (NTA 2025), pension, NHF and CRA — built in."
        actions={<Button>Start payroll run</Button>}
      />
      <EmptyState
        icon={<BanknoteIcon />}
        title="No payroll runs yet"
        description="Add employees and a salary structure, then start your first run."
        action={<Button>Start payroll run</Button>}
      />
    </>
  )
}

import { Suspense } from "react";
import { PayslipView } from "@/widgets/payroll";

type Props = { params: Promise<{ id: string }> };

export default async function PayslipPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-fg-muted">Loading…</p>}>
      <PayslipView userId={id} />
    </Suspense>
  );
}
'use client';

import AdminDashboard from './AdminDashboard';
import type { Row } from './Forms';
import type { Run } from './Workspace';

export default function AdminPanel({
  onNotice
}: {
  data?: Row | null;
  loading?: boolean;
  busy?: boolean;
  run?: Run;
  onRefresh?: () => void;
  onNotice?: (s: string) => void;
}) {
  return <AdminDashboard onNotice={onNotice} />;
}

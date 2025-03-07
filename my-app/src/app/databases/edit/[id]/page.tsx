"use client";

import EditDatabaseContent from "./EditDatabaseContent";

export default function EditDatabasePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditDatabaseContent params={params} />;
}

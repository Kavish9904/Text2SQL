"use client";

import EditDatabaseContent from "./EditDatabaseContent";

// This generates all possible paths at build time
export function generateStaticParams() {
  // Since we can't access localStorage at build time,
  // we'll generate a dummy ID that will be replaced by actual IDs at runtime
  return [{ id: "placeholder" }];
}

export default function EditDatabasePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditDatabaseContent params={params} />;
}

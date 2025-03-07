"use client";

import EditDatabaseContent from "./EditDatabaseContent";

// This generates paths at build time
export async function generateStaticParams() {
  // Generate a few placeholder IDs that will be replaced at runtime
  return [
    { id: "placeholder-1" },
    { id: "placeholder-2" },
    { id: "placeholder-3" },
  ];
}

export default function EditDatabasePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditDatabaseContent params={params} />;
}

import EditDatabaseContent from "./EditDatabaseContent";

export default function EditDatabasePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditDatabaseContent params={params} />;
}

// This is required for Next.js to know which paths to pre-render
export async function generateStaticParams() {
  // Since we're using client-side data, we'll return an empty array
  // The page will be rendered on-demand
  return [];
}

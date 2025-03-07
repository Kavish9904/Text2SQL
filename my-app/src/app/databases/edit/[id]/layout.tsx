// This is a server component
export async function generateStaticParams() {
  // Generate a few placeholder IDs that will be replaced at runtime
  return [
    { id: "placeholder-1" },
    { id: "placeholder-2" },
    { id: "placeholder-3" },
  ];
}

export default function EditDatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

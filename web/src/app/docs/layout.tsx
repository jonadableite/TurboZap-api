import { DocsHeader, DocsSidebar } from "@/components/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DocsHeader />
      <div className="flex">
        <DocsSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}


import { auth } from "@/lib/auth";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export async function Header({ title, actions }: HeaderProps) {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
      <div className="flex items-center gap-4">
        {actions}
        <span className="text-sm text-neutral-500">{session?.user?.name}</span>
      </div>
    </header>
  );
}

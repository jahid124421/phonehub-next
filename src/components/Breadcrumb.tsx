import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs text-sm" aria-label="Breadcrumb">
      <ul>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx}>
              {isLast || !item.href ? (
                <span className={isLast ? "text-base-content font-medium" : ""}>{item.label}</span>
              ) : (
                <Link href={item.href} className="text-base-content/60 hover:text-primary">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

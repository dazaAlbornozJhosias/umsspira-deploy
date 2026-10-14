import Link from 'next/link';
import { HomeIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  breadcrumb: Crumb[];
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageLayout({ breadcrumb, eyebrow, title, description, children }: PageLayoutProps) {
  return (
    <>
      <header>
        <nav aria-label="Ruta de navegación">
          <ol className="breadcrumb-list">
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li key={item.label} className="breadcrumb-item">
                  {isLast || !item.href ? (
                    <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'breadcrumb-current' : 'breadcrumb-muted'}>
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="breadcrumb-link"
                    >
                      {index === 0 && <HomeIcon className="icon-small" aria-hidden="true" />}
                      {item.label}
                    </Link>
                  )}
                  {!isLast && (
                    <span aria-hidden="true" className="breadcrumb-separator">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {eyebrow && (
          <p className="page-eyebrow">
            {eyebrow}
          </p>
        )}
        <h1 className={eyebrow ? "page-title page-title-with-eyebrow" : "page-title"}>
          {title}
        </h1>
        {description && <p className="page-description">{description}</p>}
      </header>
      <div className="page-content">{children}</div>
    </>
  );
}

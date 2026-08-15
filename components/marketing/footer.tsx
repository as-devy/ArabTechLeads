import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.586 2 12.253c0 4.53 2.865 8.367 6.839 9.722.5.094.683-.222.683-.492 0-.243-.01-1.046-.014-1.9-2.782.617-3.369-1.37-3.369-1.37-.454-1.18-1.11-1.494-1.11-1.494-.908-.635.069-.622.069-.622 1.003.072 1.531 1.053 1.531 1.053.892 1.56 2.341 1.11 2.91.849.09-.66.35-1.11.636-1.365-2.22-.258-4.555-1.14-4.555-5.075 0-1.121.39-2.038 1.029-2.757-.103-.259-.446-1.3.098-2.71 0 0 .84-.274 2.75 1.053A9.35 9.35 0 0 1 12 7.062c.85.004 1.705.117 2.504.343 1.909-1.327 2.747-1.053 2.747-1.053.546 1.41.203 2.451.1 2.71.64.719 1.028 1.636 1.028 2.757 0 3.944-2.339 4.814-4.566 5.067.359.317.679.942.679 1.9 0 1.372-.012 2.477-.012 2.814 0 .273.18.59.688.49C19.138 20.616 22 16.78 22 12.253 22 6.586 17.523 2 12 2Z"
      />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export async function MarketingFooter() {
  const t = await getTranslations("footer");
  const brand = await getTranslations("brand");

  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
        <div>
          <BrandLogo />
          <p className="mt-3 max-w-xs text-sm leading-7 text-secondary">
            {t("tagline")}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-secondary transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <GitHubIcon className="size-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-secondary transition-colors hover:text-foreground"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            {t("platform")}
          </p>
          <ul className="space-y-2 text-sm text-secondary">
            <li>
              <a href="#explore" className="hover:text-foreground">
                {t("explore")}
              </a>
            </li>
            <li>
              <a href="#developers" className="hover:text-foreground">
                {t("developers")}
              </a>
            </li>
            <li>
              <a href="#communities" className="hover:text-foreground">
                {t("communities")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            {t("resources")}
          </p>
          <ul className="space-y-2 text-sm text-secondary">
            <li>
              <Link href="/help" className="hover:text-foreground">
                {t("help")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                {t("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            {t("legal")}
          </p>
          <ul className="space-y-2 text-sm text-secondary">
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 text-xs text-muted sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {brand("name")}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

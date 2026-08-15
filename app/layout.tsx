import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * Required root layout. Locale-specific <html>/<body> live in [locale]/layout.
 */
export default function RootLayout({ children }: Props) {
  return children;
}

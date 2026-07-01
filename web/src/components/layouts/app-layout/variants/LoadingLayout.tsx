/**
 * Loading layout variant
 * Shown during session loading and authentication redirects
 */

import { Spinner } from "@/src/components/layouts/spinner";
import { useI18n } from "@/src/features/i18n/useI18n";

type LoadingLayoutProps = {
  message?: string;
};

export function LoadingLayout({ message = "Loading" }: LoadingLayoutProps) {
  const { t } = useI18n();

  return <Spinner message={message === "Loading" ? t("layout.loading") : message} />;
}

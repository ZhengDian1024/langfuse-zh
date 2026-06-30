import { ActionButton } from "@/src/components/ActionButton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { ApiKeyRender } from "@/src/features/public-api/components/CreateApiKeyButton";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { type RouterOutput } from "@/src/utils/types";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useI18n } from "@/src/features/i18n/useI18n";
import { Check, Copy, LockIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const MANUAL_TRACING_DOCS_URL =
  "https://langfuse.com/docs/observability/get-started";

function CopyableSnippet({
  value,
  copiedLabel,
  copyLabel,
  copyFailedMessage,
  onCopy,
}: {
  value: string;
  copiedLabel: string;
  copyLabel: string;
  copyFailedMessage: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(value);
      onCopy?.();
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      toast.error(copyFailedMessage);
    }
  };

  return (
    <div className="bg-muted/50 flex items-center gap-4 rounded-2xl border p-5 shadow-xs">
      <code className="min-w-0 flex-1 font-mono text-xs leading-6 break-words whitespace-pre-wrap sm:text-sm">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        onClick={() => handleCopy()}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}

export function TracesSetupOnboardingCard({
  projectId,
}: {
  projectId: string;
}) {
  const capture = usePostHogClientCapture();
  const { t } = useI18n();
  const hasApiKeyCreateAccess = useHasProjectAccess({
    projectId,
    scope: "apiKeys:CUD",
  });
  const [apiKeys, setApiKeys] = useState<
    RouterOutput["projectApiKeys"]["create"] | null
  >(null);
  const utils = api.useUtils();
  const mutCreateApiKey = api.projectApiKeys.create.useMutation({
    onSuccess: (data) => {
      utils.projectApiKeys.invalidate();
      setApiKeys(data);
    },
  });

  const createApiKey = async () => {
    try {
      await mutCreateApiKey.mutateAsync({ projectId });
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error(t("setup.traces.create-api-key.failed"));
    }
  };

  return (
    <SplashScreen
      waitingFor={t("setup.traces.waiting")}
      title={t("setup.traces.title")}
      description={t("setup.traces.description")}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/traces-overview-v1.mp4"
      videoPosition="bottom"
      steps={[
        {
          title: t("setup.traces.step.create-api-keys.title"),
          description: t("setup.traces.step.create-api-keys.description"),
          content: apiKeys ? (
            <ApiKeyRender
              generatedKeys={apiKeys}
              scope="project"
              className="mt-1"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {hasApiKeyCreateAccess ? (
                <Button
                  onClick={createApiKey}
                  loading={mutCreateApiKey.isPending}
                  className="self-start"
                >
                  {t("setup.traces.create-new-api-key")}
                </Button>
              ) : (
                <Button disabled className="self-start">
                  <LockIcon
                    className="mr-2 -ml-0.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  {t("setup.traces.create-new-api-key")}
                </Button>
              )}
              <ActionButton
                href={`/project/${projectId}/settings/api-keys`}
                variant="secondary"
              >
                {t("setup.traces.manage-api-keys")}
              </ActionButton>
            </div>
          ),
        },
        {
          title: t("setup.traces.step.agent.title"),
          badge: (
            <Badge variant="tertiary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {t("setup.traces.recommended")}
            </Badge>
          ),
          description: t("setup.traces.step.agent.description"),
          content: (
            <>
              <CopyableSnippet
                value={t("setup.traces.agent.prompt")}
                copiedLabel={t("setup.traces.copy.copied")}
                copyLabel={t("setup.traces.copy.prompt")}
                copyFailedMessage={t("setup.traces.copy.failed")}
                onCopy={() =>
                  capture("onboarding:tracing_agent_prompt_copy_clicked", {
                    projectId,
                  })
                }
              />
              <div className="mt-3">
                <Link
                  href={MANUAL_TRACING_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex text-sm underline underline-offset-4 hover:no-underline"
                  onClick={() =>
                    capture("onboarding:tracing_manual_docs_link_clicked", {
                      href: MANUAL_TRACING_DOCS_URL,
                      projectId,
                    })
                  }
                >
                  {t("setup.traces.manual-docs-link")}
                </Link>
              </div>
            </>
          ),
        },
        {
          title: t("setup.traces.step.run-app.title"),
          description: t("setup.traces.step.run-app.description"),
        },
      ]}
    />
  );
}

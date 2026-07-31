import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { Trash } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useRouter } from "next/router";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useI18n } from "@/src/features/i18n/useI18n";

export function DeletePromptVersion({
  promptVersionId,
  version,
  countVersions,
}: {
  promptVersionId: string;
  version: number;
  countVersions: number;
}) {
  const capture = usePostHogClientCapture();
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const router = useRouter();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });

  const mutDeletePromptVersion = api.prompts.deleteVersion.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
      if (countVersions > 1) {
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, version: undefined },
          },
          undefined,
          { shallow: true },
        );
      } else {
        router.push(`/project/${projectId}/prompts`);
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  return (
    <Popover
      key={promptVersionId}
      open={isOpen}
      onOpenChange={() => {
        if (isOpen) {
          capture("prompt_detail:version_delete_open");
        }
        setIsOpen(!isOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          disabled={!hasAccess}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t("prompts.aria.delete-version", "Delete version")}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-semibold">{t("prompts.delete.confirm-title", "Please confirm")}</h2>
        <p className="mb-3 text-sm">
          {t("prompts.delete.version-description", "This action deletes the prompt version. Requests of version {version} of this prompt will return an error.", { version: String(version) })}
        </p>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">{t("prompts.form.error-prefix", "Error:")}</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={mutDeletePromptVersion.isPending}
            onClick={() => {
              if (!projectId) {
                console.error("Project ID is missing");
                return;
              }
              capture("prompt_detail:version_delete_submit");
              setError(null);

              mutDeletePromptVersion.mutate({
                promptVersionId,
                projectId,
              });
            }}
          >
            {t("prompts.action.delete-prompt-version", "Delete Prompt Version")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { StringParam, useQueryParam } from "use-query-params";
import { NewPromptForm } from "@/src/features/prompts/components/NewPromptForm";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { useI18n } from "@/src/features/i18n/useI18n";

export const NewPrompt = () => {
  const projectId = useProjectIdFromURL();
  const { t } = useI18n();
  const [initialPromptId] = useQueryParam("promptId", StringParam);

  const { data: initialPrompt, isLoading } = api.prompts.byId.useQuery(
    {
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      id: initialPromptId ?? "",
    },
    {
      enabled: Boolean(initialPromptId && projectId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  if (isLoading) {
    return <div className="p-3">{t("prompts.detail.loading", "Loading...")}</div>;
  }

  const breadcrumb: { name: string; href?: string }[] = [
    {
      name: t("breadcrumb.prompts", "Prompts"),
      href: `/project/${projectId}/prompts/`,
    },
    {
      name: t("prompts.breadcrumb.new-prompt", "New prompt"),
    },
  ];

  if (initialPrompt) {
    breadcrumb.pop(); // Remove "New prompt"
    breadcrumb.push(
      {
        name: initialPrompt.name,
        href: `/project/${projectId}/prompts/${encodeURIComponent(initialPrompt.name)}`,
      },
      { name: t("prompts.breadcrumb.new-version", "New version") },
    );
  }

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: initialPrompt
          ? t("prompts.page.new-version-title", "{name} \u2014 New version", { name: initialPrompt.name })
          : t("prompts.page.new-prompt-title", "Create new prompt"),
        help: {
          description: t("prompts.page.help-description", "Manage and version your prompts in Langfuse. Edit and update them via the UI and SDK. Retrieve the production version via the SDKs. Learn more in the docs."),
          href: "https://langfuse.com/docs/prompts",
        },
        breadcrumb: breadcrumb,
      }}
    >
      {initialPrompt ? (
        <p className="text-muted-foreground text-sm">
          {t("prompts.detail.immutable-note", "Prompts are immutable in Langfuse. To update a prompt, create a new version.")}
        </p>
      ) : null}
      <div className="my-8">
        <NewPromptForm {...{ initialPrompt }} />
      </div>
    </Page>
  );
};

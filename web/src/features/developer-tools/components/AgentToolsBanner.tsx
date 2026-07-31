import { Callout } from "@/src/components/ui/callout";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { Bot } from "lucide-react";
import { useI18n } from "@/src/features/i18n/useI18n";

const DOCS_HREF =
  "https://langfuse.com/docs/api-and-data-platform/features/agent-skill";

/**
 * Informational, dismissible banner that highlights Langfuse's support for AI
 * coding agents via the Agent Skill, MCP server, and CLI. Rendered on the
 * organization overview page.
 */
export function AgentToolsBanner() {
  const { t } = useI18n();
  return (
    <Callout
      className="mb-4"
      id="agent-tools-banner:v1"
      variant="info"
      align="middle"
      actions={() => (
        <Button asChild size="sm" variant="secondary">
          <Link href={DOCS_HREF} target="_blank">
            {t("developer-tools.banner-learn-more", "Learn more")}
          </Link>
        </Button>
      )}
    >
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">
            {t("developer-tools.banner-title", "Langfuse works great with your AI coding agents.")}
          </span>{" "}
          {t("developer-tools.banner-description", "Connect Claude Code, Codex, and other agents to your data with the Langfuse Agent Skill, MCP server, and CLI.")}
        </span>
      </div>
    </Callout>
  );
}

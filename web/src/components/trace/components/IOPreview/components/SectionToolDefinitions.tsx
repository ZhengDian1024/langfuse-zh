import {
  ToolCallDefinitionCard,
  type ToolDefinition,
} from "./ToolCallDefinitionCard";

// SectionToolDefinitions props
export interface SectionToolDefinitionsProps {
  tools: ToolDefinition[];
  toolCallCounts: Map<string, number>;
  toolNameToDefinitionNumber: Map<string, number>;
}

/**
 * SectionToolDefinitions renders tool definition cards at the top of IOPreview.
 *
 * Shows available tools with their call counts and definition numbers.
 */
import { useI18n } from "@/src/features/i18n/useI18n";
export function SectionToolDefinitions({
  tools,
  toolCallCounts,
  toolNameToDefinitionNumber,
}: SectionToolDefinitionsProps) {
  const { t } = useI18n();
  if (tools.length === 0) {
    return null;
  }

  return (
    <div className="[&_.io-message-content]:px-2 [&_.io-message-header]:px-2">
      <div className="border-border mb-4 border-b pb-4">
        <div className="io-message-header px-1 py-1 text-sm font-medium capitalize">
          {t("trace.common.tools", "Tools")}
        </div>
        <ToolCallDefinitionCard
          tools={tools}
          toolCallCounts={toolCallCounts}
          toolNameToDefinitionNumber={toolNameToDefinitionNumber}
          className="px-2"
        />
      </div>
    </div>
  );
}

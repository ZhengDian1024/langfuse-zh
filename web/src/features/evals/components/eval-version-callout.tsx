import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { type EvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import {
  isTraceTarget,
  isEventTarget,
  isExperimentTarget,
  isDatasetTarget,
} from "@/src/features/evals/utils/typeHelpers";
import { useI18n } from "@/src/features/i18n/useI18n";

interface EvalVersionCalloutProps {
  targetObject: string;
  evalCapabilities: EvalCapabilities;
}

interface CalloutContent {
  visible: boolean;
  title: string;
  description: React.ReactNode;
}

type TranslateFn = (
  key: Parameters<ReturnType<typeof useI18n>["t"]>[0],
  defaultMessageOrValues?:
    | string
    | Record<string, string>,
  values?: Record<string, string>,
) => string;

const getCalloutContent = (
  targetObject: string,
  evalCapabilities: EvalCapabilities,
  t: TranslateFn,
): CalloutContent => {
  const hidden = { visible: false, title: "", description: "" };

  // For event/observation target
  if (isEventTarget(targetObject)) {
    if (evalCapabilities.isNewCompatible) {
      return hidden;
    }

    return {
      visible: true,
      title: t(
        "evals.version.verify-sdk-observations-title",
        "Please verify your SDK version",
      ),
      description: (
        <>
          {t(
            "evals.version.verify-sdk-observations-desc",
            "This evaluator targets observations, which require JS SDK v4+ or Python SDK v3+. You can still configure this evaluator now—it will start running once you upgrade.",
          )}{" "}
          <a
            href="https://langfuse.com/docs/observability/sdk/upgrade-path"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-medium hover:opacity-80"
          >
            {t("evals.version.learn-more", "Learn more")}
          </a>
          .
        </>
      ),
    };
  }

  // For experiment target (Experiment Runner SDK)
  if (isExperimentTarget(targetObject)) {
    if (!evalCapabilities.isNewCompatible) {
      return {
        visible: true,
        title: t(
          "evals.version.verify-experiment-runner-title",
          "Please verify you are using the Experiment Runner SDK",
        ),
        description: (
          <>
            {t(
              "evals.version.verify-experiment-runner-desc",
              "The Experiment Runner SDK requires JS SDK v4.4+ or Python SDK v3.9+. You can still configure this evaluator now—it will start running once you upgrade.",
            )}{" "}
            <a
              href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-blue font-medium hover:opacity-80"
            >
              {t(
                "evals.version.learn-more-experiment-runner",
                "Learn more about the Experiment Runner SDK.",
              )}
            </a>
            .
          </>
        ),
      };
    }

    return hidden;
  }

  // For dataset target (legacy dataset run methods)
  if (isDatasetTarget(targetObject)) {
    return {
      visible: true,
      title: t(
        "evals.version.legacy-low-level-title",
        "Legacy low-level SDK methods",
      ),
      description: (
        <>
          {t(
            "evals.version.legacy-low-level-desc",
            "This evaluator targets traces from legacy low-level SDK methods for dataset runs that manually linked dataset items to traces. Consider upgrading to the Experiment Runner SDK for improved performance and features.",
          )}{" "}
          <a
            href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-medium hover:opacity-80"
          >
            {t("evals.version.learn-more", "Learn more")}
          </a>
          .
        </>
      ),
    };
  }

  // For trace target
  if (isTraceTarget(targetObject)) {
    return {
      visible: true,
      title: t(
        "evals.version.upgrade-observation-title",
        "Consider upgrading to observation evaluators",
      ),
      description: (
        <>
          {t(
            "evals.version.upgrade-observation-desc",
            "Observation evaluators provide more granular control and an easier workflow. We strongly recommend upgrading to observation evaluators.",
          )}{" "}
          <a
            href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-medium hover:opacity-80"
          >
            {t("evals.version.learn-more", "Learn more")}
          </a>
          .
        </>
      ),
    };
  }

  return hidden;
};

export function EvalVersionCallout({
  targetObject,
  evalCapabilities,
}: EvalVersionCalloutProps) {
  const { t } = useI18n();
  const content = getCalloutContent(targetObject, evalCapabilities, t);

  if (!content.visible) {
    return null;
  }

  return (
    <Alert
      variant="default"
      className="border-dark-yellow bg-light-yellow mt-2 max-w-4xl"
    >
      <AlertTriangle className="text-dark-yellow h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-foreground font-medium">{content.title}</span>
            <span className="text-foreground text-sm">
              {content.description}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Redirect helper for /trace/[traceId] URLs
// Looks up the projectId for a trace and redirects to /project/[projectId]/traces/[traceId]
// which displays the current trace view

import { ErrorPage } from "@/src/components/error-page";
import { useI18n } from "@/src/features/i18n/useI18n";
import { getTracesByIdsForAnyProject } from "@langfuse/shared/src/server";
import { type GetServerSideProps } from "next";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  const traceId = context.params.traceId as string;

  const traces = await getTracesByIdsForAnyProject([traceId]);

  if (!traces || traces.length === 0) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  if (traces.length > 1) {
    return {
      props: {
        duplicatesFound: true,
      },
    };
  }

  return {
    redirect: {
      destination: `/project/${traces[0].projectId}/traces/${traceId}`,
      permanent: false,
    },
  };
};

const TraceRedirectPage = ({
  notFound,
  duplicatesFound,
}: {
  notFound?: boolean;
  duplicatesFound?: boolean;
}) => {
  const router = useRouter();
  const { t } = useI18n();
  if (router.isFallback) {
    return (
      <div className="p-3">{t("trace.redirect.loading", "Loading...")}</div>
    );
  }

  if (notFound) {
    return (
      <ErrorPage
        title={t("trace.error.not-found-title", "Trace not found")}
        message={t(
          "trace.error.not-found-message",
          "The trace is either still being processed or has been deleted.",
        )}
        additionalButton={{
          label: t("common.retry", "Retry"),
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (duplicatesFound) {
    return (
      <ErrorPage
        title={t("trace.error.not-found-title", "Trace not found")}
        message={t(
          "trace.redirect.upgrade-sdk",
          "Please upgrade the SDK as the URL schema has changed.",
        )}
      />
    );
  }

  return null;
};

export default TraceRedirectPage;

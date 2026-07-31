import { type GetServerSideProps } from "next";
import { useI18n } from "@/src/features/i18n/useI18n";

// Keep the bare dataset URL as an alias only; tab content lives on explicit routes.
export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return {
      notFound: true,
    };
  }

  const projectId = context.params.projectId as string;
  const datasetId = context.params.datasetId as string;

  return {
    redirect: {
      destination: `/project/${projectId}/datasets/${datasetId}/items`,
      permanent: false,
    },
  };
};

export default function RedirectPage() {
  const { t } = useI18n();
  return <div>{t("datasets.redirecting", "Redirecting...")}</div>;
}

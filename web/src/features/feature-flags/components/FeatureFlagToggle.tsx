import { type Flag } from "@/src/features/feature-flags/types";
import { type SessionContextValue, useSession } from "next-auth/react";
import { useI18n } from "@/src/features/i18n/useI18n";

const isAdminOrExperimentalFeatures = (
  session: SessionContextValue,
): boolean => {
  const enableExperimentalFeatures =
    session.data?.environment?.enableExperimentalFeatures ?? false;
  const isAdmin = session.data?.user?.admin ?? false;

  return enableExperimentalFeatures || isAdmin;
};

const isWhitelistedForFeature = (
  session: SessionContextValue,
  featureFlag: Flag,
): boolean => {
  const flags = session.data?.user?.featureFlags;
  return flags !== undefined && flags[featureFlag];
};

export const FeatureFlagToggle = (props: {
  featureFlag: Flag;
  whenEnabled?: React.ReactNode;
  whenDisabled?: React.ReactNode;
  whenLoading?: React.ReactNode;
}) => {
  const session = useSession();
  const { t } = useI18n();

  if (isAdminOrExperimentalFeatures(session)) return props.whenEnabled ?? <></>;

  const isEnabled = isWhitelistedForFeature(session, props.featureFlag);

  if (session.status === "loading") {
    return props.whenLoading ?? (
      <div>{t("feature-flags.loading", "Loading ...")}</div>
    );
  }

  return isEnabled
    ? (props.whenEnabled ?? <></>)
    : (props.whenDisabled ?? <></>);
};

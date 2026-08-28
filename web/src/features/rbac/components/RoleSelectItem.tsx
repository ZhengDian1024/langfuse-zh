import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from "@/src/components/ui/hover-card";
import { SelectItem } from "@/src/components/ui/select";
import { Role } from "@langfuse/shared";
import { organizationRoleAccessRights } from "@/src/features/rbac/constants/organizationAccessRights";
import { projectRoleAccessRights } from "@/src/features/rbac/constants/projectAccessRights";
import { orderedRoles } from "@/src/features/rbac/constants/orderedRoles";
import { useI18n } from "@/src/features/i18n/useI18n";
import type { MessageKey } from "@/src/features/i18n/messages";

export const RoleSelectItem = ({
  role,
  isProjectRole,
}: {
  role: Role;
  isProjectRole?: boolean;
}) => {
  const { t } = useI18n();
  const isProjectNoneRole = role === Role.NONE && isProjectRole;
  const isOrgNoneRole = role === Role.NONE && !isProjectRole;
  const orgScopes = reduceScopesToListItems(
    organizationRoleAccessRights,
    role,
    t,
  );
  const projectScopes = reduceScopesToListItems(
    projectRoleAccessRights,
    role,
    t,
  );

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <SelectItem value={role} className="max-w-56">
          <span>
            {formatRole(role)}
            {isProjectNoneRole
              ? t("rbac.role.keep-default", " (keep default role)")
              : ""}
          </span>
        </SelectItem>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent hideWhenDetached={true} align="center" side="right">
          {isProjectNoneRole ? (
            <div className="text-xs">
              {t(
                "rbac.role.project-none-comment",
                "Do not override the organization role for this project.",
              )}
            </div>
          ) : isOrgNoneRole ? (
            <div className="text-xs">
              {t(
                "rbac.role.org-none-comment",
                "No access to organization resources by default. User needs to be granted project-level access via project roles.",
              )}
            </div>
          ) : (
            <>
              <div className="font-bold">
                {t("rbac.role.label", "Role: {role}", {
                  role: formatRole(role),
                })}
              </div>
              <p className="mt-2 text-xs font-semibold">
                {t("rbac.role.org-scopes", "Organization Scopes")}
              </p>
              <ul className="list-inside list-disc text-xs">{orgScopes}</ul>
              <p className="mt-2 text-xs font-semibold">
                {t("rbac.role.project-scopes", "Project Scopes")}
              </p>
              <ul className="list-inside list-disc text-xs">{projectScopes}</ul>
              <p className="mt-2 border-t pt-2 text-xs">
                {t("rbac.role.note", "Note:")}{" "}
                <span className="text-muted-foreground">
                  {t("rbac.role.muted-scopes", "Muted scopes")}
                </span>
                {t(
                  "rbac.role.inherited-note",
                  " are inherited from lower role.",
                )}
              </p>
            </>
          )}
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
};

const reduceScopesToListItems = (
  accessRights: Record<string, string[]>,
  role: Role,
  t: (key: MessageKey, defaultMessage?: string) => string,
) => {
  const currentRoleLevel = orderedRoles[role];
  const lowerRole = Object.entries(orderedRoles).find(
    ([_role, level]) => level === currentRoleLevel - 1,
  )?.[0] as Role | undefined;
  const inheritedScopes = lowerRole ? accessRights[lowerRole] : [];

  return accessRights[role].length > 0 ? (
    <>
      {Object.entries(
        accessRights[role].reduce(
          (acc, scope) => {
            const [resource, action] = scope.split(":");
            if (!acc[resource]) {
              acc[resource] = [];
            }
            acc[resource].push(action);
            return acc;
          },
          {} as Record<string, string[]>,
        ),
      ).map(([resource, actions]) => {
        const inheritedActions = actions.filter((action) =>
          inheritedScopes.includes(`${resource}:${action}`),
        );
        const newActions = actions.filter(
          (action) => !inheritedScopes.includes(`${resource}:${action}`),
        );

        return (
          <li key={resource}>
            <span>{resource}: </span>
            <span className="text-muted-foreground">
              {inheritedActions.length > 0 ? inheritedActions.join(", ") : ""}
              {newActions.length > 0 && inheritedActions.length > 0 ? ", " : ""}
            </span>
            <span className="font-semibold">
              {newActions.length > 0 ? newActions.join(", ") : ""}
            </span>
          </li>
        );
      })}
    </>
  ) : (
    <li>{t("rbac.role.none", "None")}</li>
  );
};

const formatRole = (role: Role) =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Card } from "@/src/components/ui/card";
import { NewOrganizationForm } from "@/src/features/organizations/components/NewOrganizationForm";
import { NewProjectForm } from "@/src/features/projects/components/NewProjectForm";
import { useQueryProjectOrOrganization } from "@/src/features/projects/hooks";
import { createProjectRoute } from "@/src/features/setup/setupRoutes";
import { cn } from "@/src/utils/tailwind";
import { Check } from "lucide-react";
import { useRouter } from "next/router";
import { useI18n } from "@/src/features/i18n/useI18n";

// Manual setup process
// 1. Create Organization: /setup
// 2. Create Project: /organization/:orgId/setup?orgstep=create-project
export function SetupPage() {
  const { organization } = useQueryProjectOrOrganization();
  const { t } = useI18n();
  const router = useRouter();

  // starts at 1 to align with breadcrumb
  const stepInt = organization ? 2 : 1;

  return (
    <ContainerPage
      headerProps={{
        title: t("setup.title"),
        help: {
          description: t("setup.description"),
        },
        ...(stepInt === 1 && {
          breadcrumb: [
            {
              name: "组织",
              href: "/",
            },
          ],
        }),
      }}
    >
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage
              className={cn(
                stepInt !== 1
                  ? "text-muted-foreground"
                  : "text-foreground font-semibold",
              )}
            >
              {t("setup.step.create-organization")}
              {stepInt > 1 && <Check className="ml-1 inline-block h-3 w-3" />}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage
              className={cn(
                stepInt !== 2
                  ? "text-muted-foreground"
                  : "text-foreground font-semibold",
              )}
            >
              {t("setup.step.create-project")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="p-3">
        {
          // 1. Create Org
          stepInt === 1 && (
            <div>
              <Header title={t("setup.new-organization")} />
              <p className="text-muted-foreground mb-4 text-sm">
                {t("setup.organization-description")}
              </p>
              <NewOrganizationForm
                onSuccess={(orgId) => {
                  router.push(createProjectRoute(orgId));
                }}
              />
            </div>
          )
        }
        {
          // 2. Create Project
          stepInt === 2 && organization && (
            <div>
              <Header title={t("setup.new-project")} />
              <p className="text-muted-foreground mb-4 text-sm">
                {t("setup.project-description")}
              </p>
              <NewProjectForm
                orgId={organization.id}
                onSuccess={(projectId) =>
                  router.push(`/project/${projectId}/traces`)
                }
              />
            </div>
          )
        }
      </Card>
    </ContainerPage>
  );
}

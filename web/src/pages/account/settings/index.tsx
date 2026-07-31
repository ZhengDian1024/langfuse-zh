import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import Header from "@/src/components/layouts/header";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { useSession, signOut } from "next-auth/react";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import ContainerPage from "@/src/components/layouts/container-page";
import { useRouter } from "next/router";
import { StringNoHTML } from "@langfuse/shared";
import Link from "next/link";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useI18n } from "@/src/features/i18n/useI18n";

const displayNameSchema = z.object({
  name: StringNoHTML.min(1, "Name cannot be empty").max(
    100,
    "Name must be at most 100 characters",
  ),
});

function UpdateDisplayName() {
  const { t } = useI18n();
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();

  const form = useForm({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const updateDisplayName = api.userAccount.updateDisplayName.useMutation({
    onSuccess: async () => {
      await updateSession();
      await utils.invalidate();
      form.reset();
      showSuccessToast({
        title: t("account.display-name.toast-title", "Display Name Updated"),
        description: t(
          "account.display-name.toast-description",
          "Your display name has been successfully updated.",
        ),
      });
    },
    onError: (error) => form.setError("name", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof displayNameSchema>) {
    updateDisplayName.mutate({ name: values.name });
  }

  return (
    <div>
      <Header title={t("account.display-name.title", "Display Name")} />
      <Card className="p-3">
        {form.getValues().name !== "" ? (
          <p className="text-primary mb-4 text-sm">
            {t(
              "account.display-name.updated-from",
              'Your display name will be updated from "{currentName}" to "{nextName}".',
              {
                currentName: session?.user?.name ?? "",
                nextName: form.watch().name,
              },
            )}
          </p>
        ) : (
          <p className="text-primary mb-4 text-sm">
            {t(
              "account.display-name.current",
              'Your display name is currently "{name}".',
              { name: session?.user?.name ?? "" },
            )}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder={session?.user?.name ?? ""}
                      {...field}
                      className="flex-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              variant="secondary"
              type="submit"
              loading={updateDisplayName.isPending}
              disabled={form.getValues().name === ""}
              className="mt-4"
            >
              {t("common.save", "Save")}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}

function DeleteAccountButton() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? "";

  const { data: canDeleteData } = api.userAccount.checkCanDelete.useQuery();
  const deleteAccount = api.userAccount.delete.useMutation();

  const formSchema = z.object({
    email: z.string().refine((val) => val === userEmail, {
      message: t("account.delete.confirm-email", "Please enter your email address: {email}", {
        email: userEmail,
      }),
    }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const canDelete = canDeleteData?.canDelete ?? false;
  const blockingOrganizations = canDeleteData?.blockingOrganizations ?? [];

  const onSubmit = async () => {
    if (!canDelete) return;
    try {
      await deleteAccount.mutateAsync();
      showSuccessToast({
        title: t("account.delete.toast-title", "Account Deleted"),
        description: t(
          "account.delete.toast-description",
          "Your account has been successfully deleted.",
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await signOut();
    } catch (error) {
      console.error(error);
      showErrorToast(
        t("account.delete.toast-error-title", "Failed to Delete Account"),
        error instanceof Error
          ? error.message
          : t("common.error.unexpected", "An unexpected error occurred."),
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive-secondary">
          {t("account.delete.button", "Delete Account")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("account.delete.button", "Delete Account")}
          </DialogTitle>
          <DialogDescription>
            {!canDelete && blockingOrganizations.length > 0 ? (
              <div>
                <p className="mb-2">
                  {t(
                    "account.delete.last-owner-prefix",
                    "You cannot delete your account because you are the last owner of the following organization(s):",
                  )}
                </p>
                <ul className="list-inside list-disc space-y-1">
                  {blockingOrganizations.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/organization/${org.id}/settings`}
                        className="text-primary hover:text-primary/80 font-semibold underline"
                      >
                        {org.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  {t(
                    "account.delete.last-owner-suffix",
                    "Please add another owner or delete these organizations before deleting your account.",
                  )}
                </p>
              </div>
            ) : (
              t(
                "account.delete.confirm-input",
                'To confirm, type your email address "{email}" in the input box',
                { email: userEmail },
              )
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {canDelete && (
              <DialogBody>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={userEmail} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </DialogBody>
            )}
            <DialogFooter>
              <Button
                type="submit"
                variant="destructive"
                loading={deleteAccount.isPending}
                disabled={!canDelete}
                className="w-full"
              >
                {t("account.delete.button", "Delete Account")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type AccountSettingsPage = {
  title: string;
  slug: string;
  content: React.ReactNode;
  cmdKKeywords?: string[];
};

// t is passed in (rather than read via useI18n) so this helper can be invoked
// from both the page component and the useAccountSettingsPages hook used by
// the command-K menu, each with their own i18n context.
const getAccountSettingsPages = (
  userEmail: string,
  t: ReturnType<typeof useI18n>["t"],
): AccountSettingsPage[] => [
  {
    title: t("account.tab.general", "General"),
    slug: "index",
    cmdKKeywords: [
      "account",
      "user",
      "profile",
      "email",
      "password",
      "name",
      "display",
      "delete",
      "remove",
    ],
    content: (
      <div className="flex flex-col gap-6">
        <div>
          <Header title={t("account.email.title", "Email")} />
          <Card className="p-3">
            <p className="text-primary text-sm">
              {t("account.email.your-email", "Your email address: ")}
              <b>{userEmail}</b>
            </p>
          </Card>
        </div>
        <UpdateDisplayName />
        <div>
          <Header title={t("account.password.title", "Password")} />
          <Card className="p-3">
            <p className="text-primary mb-4 text-sm">
              {t(
                "account.password.change-description",
                "To change your password, we will send you a secure link to your email address. Click the button below to start the password reset process.",
              )}
            </p>
            <Button asChild variant="secondary">
              <Link href="/auth/reset-password">
                {t("account.password.change-link", "Change Password")}
              </Link>
            </Button>
          </Card>
        </div>
        <SettingsDangerZone
          items={[
            {
              title: t(
                "account.delete.danger-title",
                "Delete your account",
              ),
              description: t(
                "account.delete.danger-description",
                "You can delete your account if you are not the last owner of any organization. If you are the last owner, please add another owner or delete the organization and all projects first.",
              ),
              button: <DeleteAccountButton />,
            },
          ]}
        />
      </div>
    ),
  },
];

export function useAccountSettingsPages(): AccountSettingsPage[] {
  const { data: session } = useSession();
  const { t } = useI18n();
  const userEmail = session?.user?.email ?? "";

  return getAccountSettingsPages(userEmail, t);
}

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const userEmail = session?.user?.email ?? "";

  const pages = getAccountSettingsPages(userEmail, t);

  return (
    <ContainerPage
      headerProps={{
        title: t("account.page-title", "Account Settings"),
      }}
    >
      <PagedSettingsContainer
        activeSlug={router.query.page as string | undefined}
        pages={pages}
      />
    </ContainerPage>
  );
}

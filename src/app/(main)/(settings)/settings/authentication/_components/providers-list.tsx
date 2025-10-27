import { auth, SUPPORTED_OAUTH_PROVIDERS, SupportedOAuthProvider } from "@/lib/auth"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import AccountActionsMenu from "./account-actions-menu"
import { ProviderLinkButton } from "./provider-link-button"

type Account = Awaited<ReturnType<typeof auth.api.listUserAccounts>>[number]

export default async function ProvidersList({ accounts }: { accounts: Account[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
        <CardDescription>Customize how you access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
            const account = accounts.find((account) => account.providerId === provider)
            return <ProviderCard key={provider} provider={provider} account={account} />
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ProviderCard({
  provider,
  account,
}: {
  provider: SupportedOAuthProvider
  account?: Account
}) {
  const Icon = Icons[provider as keyof typeof Icons]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="size-4" />}
          {provider?.charAt(0).toUpperCase() + provider?.slice(1)}
        </CardTitle>
        <CardDescription>
          {account?.createdAt
            ? `Linked on ${new Date(account.createdAt).toLocaleDateString()}`
            : "Not linked"}
        </CardDescription>
        <CardAction>
          {account ? (
            <AccountActionsMenu providerId={provider} accountId={account.accountId} />
          ) : (
            <ProviderLinkButton provider={provider} />
          )}
        </CardAction>
      </CardHeader>
    </Card>
  )
}

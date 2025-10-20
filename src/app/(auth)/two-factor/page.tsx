import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BackupCodeForm from "./_components/backup-code-form"
import TotpForm from "./_components/totp-form"

type SearchParams = Promise<{ callbackUrl?: string }>

export const metadata: Metadata = {
  title: "Two Factor Authentication",
  description: "Verify your identity with two factor authentication",
}

export default async function TwoFactorPage(props: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  const searchParams = await props.searchParams
  const { callbackUrl } = searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col">
          <Tabs defaultValue="totp">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totp">Authenticator</TabsTrigger>
              <TabsTrigger value="backup">Backup code</TabsTrigger>
            </TabsList>
            <Card>
              <CardHeader>
                <CardTitle>Two factor authentication</CardTitle>
                <CardDescription>Verify your identity to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="totp">
                  <TotpForm callbackUrl={callbackUrl} />
                </TabsContent>
                <TabsContent value="backup">
                  <BackupCodeForm callbackUrl={callbackUrl} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUserSettings } from "@/data/auth/get-user-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import AvatarForm from "./_components/avatar-form"
import BioForm from "./_components/bio-form"
import EmailCard from "./_components/email-card"
import JobDetailsForm from "./_components/job-details-form"
import NameForm from "./_components/name-form"
import PhoneForm from "./_components/phone-form"
import SocialLinksForm from "./_components/social-links-form"

const PAGE = {
  title: "Profile",
  description: "Update your profile information",
  callbackUrl: "/settings/profile",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  const user = await getUserSettings(session.user.id)

  if (!user) return notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="job">Job</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <NameForm name={user.name} />
          <AvatarForm />
          <EmailCard
            email={user.email}
            isPrimary={true}
            isVerified={user.emailVerified}
          />
          <BioForm bio={user.bio} />
          <PhoneForm phone={user.phone} />
        </TabsContent>
        <TabsContent value="social">
          <SocialLinksForm
            websiteUrl={user.websiteUrl}
            linkedinUrl={user.linkedinUrl}
            githubUrl={user.githubUrl}
            xUrl={user.xUrl}
          />
        </TabsContent>
        <TabsContent value="job">
          <JobDetailsForm
            jobTitle={user.jobTitle}
            company={user.company}
            department={user.department}
            location={user.location}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

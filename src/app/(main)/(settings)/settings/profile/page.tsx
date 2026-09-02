import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getUserSettings } from "@/data/auth/get-user-settings"
import { TabsContent } from "@/components/ui/tabs"
import { PageShell } from "@/components/page-shell"
import AvatarForm from "./_components/avatar-form"
import BioForm from "./_components/bio-form"
import EmailCard from "./_components/email-card"
import JobDetailsForm from "./_components/job-details-form"
import NameForm from "./_components/name-form"
import PhoneForm from "./_components/phone-form"
import ProfileTabs from "./_components/profile-tabs"
import { isProfileTab } from "./_components/profile-tabs-config"
import SocialLinksForm from "./_components/social-links-form"

const PAGE = definePage({
  title: "Profile",
  description: "Update your profile information",
  callbackUrl: "/settings/profile",
})

export const metadata: Metadata = PAGE.metadata

type SearchParams = Promise<{ tab?: string }>

export default async function ProfilePage(props: { searchParams: SearchParams }) {
  const session = await requireSession(PAGE.callbackUrl)

  const user = await getUserSettings(session.user.id)

  if (!user) return notFound()

  const searchParams = await props.searchParams
  const tab = isProfileTab(searchParams.tab) ? searchParams.tab : "profile"

  return (
    <PageShell page={PAGE} isSection>
      <ProfileTabs initialTab={tab}>
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
      </ProfileTabs>
    </PageShell>
  )
}

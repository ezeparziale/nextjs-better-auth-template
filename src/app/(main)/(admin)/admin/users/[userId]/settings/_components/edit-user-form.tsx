"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminAvatarForm from "./admin-avatar-form"
import BioForm from "./bio-form"
import EmailForm from "./email-form"
import JobDetailsForm from "./job-details-form"
import NameForm from "./name-form"
import PhoneForm from "./phone-form"
import SocialLinksForm from "./social-links-form"

type User = {
  id: string
  name: string
  image?: string | null
  email: string
  bio?: string | null
  phone?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  xUrl?: string | null
  jobTitle?: string | null
  company?: string | null
  department?: string | null
  location?: string | null
}

export default function EditUserForm({ user }: { user: User }) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="job">Job</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <NameForm userId={user.id} name={user.name} />
        <AdminAvatarForm
          userId={user.id}
          initialImage={user.image}
          userName={user.name}
        />
        <EmailForm userId={user.id} email={user.email} />
        <BioForm userId={user.id} bio={user.bio} />
        <PhoneForm userId={user.id} phone={user.phone} />
      </TabsContent>

      <TabsContent value="social">
        <SocialLinksForm
          userId={user.id}
          websiteUrl={user.websiteUrl}
          linkedinUrl={user.linkedinUrl}
          githubUrl={user.githubUrl}
          xUrl={user.xUrl}
        />
      </TabsContent>

      <TabsContent value="job">
        <JobDetailsForm
          userId={user.id}
          jobTitle={user.jobTitle}
          company={user.company}
          department={user.department}
          location={user.location}
        />
      </TabsContent>
    </Tabs>
  )
}

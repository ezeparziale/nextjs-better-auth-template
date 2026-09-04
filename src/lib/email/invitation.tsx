import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email"

interface InvitationEmailProps {
  appName?: string
  acceptUrl?: string
  expiresInDays?: number
}

export function InvitationEmail({
  appName = "Your app",
  acceptUrl = "https://example.com/signup",
  expiresInDays = 30,
}: InvitationEmailProps) {
  const previewText = `Your invitation to join ${appName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-116.25 rounded border border-solid border-gray-200 p-5">
            <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
              {appName}
            </Heading>
            <Heading className="mx-0 my-2 p-0 text-center text-sm font-medium text-black">
              Your invitation
            </Heading>
            <Text className="text-sm leading-6 text-black">
              You are invited to join {appName}.
            </Text>
            <Text className="text-sm leading-6 text-gray-500">
              This invitation will expire in {expiresInDays} days.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
                href={acceptUrl}
              >
                Accept invitation
              </Button>
            </Section>
            <Text className="text-xs leading-6 text-gray-500">
              If you&apos;re having trouble with the above button,{" "}
              <a href={acceptUrl} className="text-gray-500 underline">
                click here
              </a>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactInvitationEmail(props: InvitationEmailProps) {
  return <InvitationEmail {...props} />
}

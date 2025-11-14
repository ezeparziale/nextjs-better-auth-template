import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

interface PasswordChangedEmailProps {
  userEmail: string
  timestamp: string
  secureAccountLink: string
  appName: string
}

export function PasswordChangedEmail({
  userEmail,
  timestamp,
  secureAccountLink,
  appName,
}: PasswordChangedEmailProps) {
  const previewText = "Your password has been changed"

  return (
    <Html>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-gray-100 px-2 font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-gray-300 bg-white p-6">
            <Heading className="mx-0 mb-5 p-0 text-center text-2xl font-semibold text-black">
              Password changed successfully
            </Heading>
            <Text className="mb-5 text-sm leading-6 text-black">
              The password for your {appName} account{" "}
              <span className="text-indigo-600">{userEmail}</span> has been changed
              successfully.
            </Text>
            <Section className="my-6 rounded border border-solid border-gray-300 bg-gray-50 p-4">
              <Text className="m-0 mb-2 text-xs leading-5 text-gray-700">
                Changed at:
              </Text>
              <Text className="m-0 text-sm font-semibold text-black">{timestamp}</Text>
            </Section>
            <Text className="mb-5 text-sm leading-6 text-black">
              If you made this change, you can safely ignore this email. Your account is
              secure.
            </Text>
            <Section className="my-8 text-center">
              <Button
                href={secureAccountLink}
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
              >
                I didn&apos;t make this change
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactPasswordChangedEmail(props: PasswordChangedEmailProps) {
  return <PasswordChangedEmail {...props} />
}

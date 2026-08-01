import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email"

interface PasswordChangedEmailProps {
  userEmail: string
  timestamp: string
  secureAccountLink: string
  appName: string
  browser: string
  os: string
  location: string
  ipAddress: string
}

export function PasswordChangedEmail({
  userEmail,
  timestamp,
  secureAccountLink,
  appName,
  browser,
  os,
  location,
  ipAddress,
}: PasswordChangedEmailProps) {
  const previewText = "Your password has been changed"

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-116.25 rounded border border-solid border-gray-200 p-5">
            <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
              Password changed on your <strong>{appName}</strong> account
            </Heading>
            <Text className="text-sm leading-6 text-black">
              The password for your {appName} account{" "}
              <span className="text-indigo-600">{userEmail}</span> has been changed
              successfully.
            </Text>
            <Section className="my-6 rounded-md bg-gray-50 p-4">
              <Text className="m-0 mb-2 text-xs font-semibold text-gray-700">
                Change Details:
              </Text>
              <Text className="m-0 mb-1 text-sm text-gray-800">
                <strong>Browser:</strong> {browser}
              </Text>
              <Text className="m-0 mb-1 text-sm text-gray-800">
                <strong>Operating System:</strong> {os}
              </Text>
              <Text className="m-0 mb-1 text-sm text-gray-800">
                <strong>Location:</strong> {location}
              </Text>
              <Text className="m-0 mb-1 text-sm text-gray-800">
                <strong>IP Address:</strong> {ipAddress}
              </Text>
              <Text className="m-0 text-sm text-gray-800">
                <strong>Time:</strong> {timestamp}
              </Text>
            </Section>
            <Text className="text-sm leading-6 text-black">
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
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:{" "}
              <Link href={secureAccountLink} className="text-blue-600 no-underline">
                {secureAccountLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-6 w-full border border-solid border-gray-200" />
            <Text className="text-xs leading-6 text-gray-600">
              This is an automated security alert. If you don&apos;t recognize this
              activity, please secure your account immediately.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactPasswordChangedEmail(props: PasswordChangedEmailProps) {
  return <PasswordChangedEmail {...props} />
}

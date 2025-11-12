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
} from "@react-email/components"

interface VerifyEmailProps {
  name?: string
  verifyLink?: string
}

export function VerifyEmail({
  name = "there",
  verifyLink = "https://example.com/verify",
}: VerifyEmailProps) {
  const previewText = `Verify your Nog email address`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-[465px] rounded border border-solid border-gray-200 p-5">
            <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
              Verify your <strong>Nog</strong> email
            </Heading>
            <Text className="text-sm leading-6 text-black">Hello {name},</Text>
            <Text className="text-sm leading-6 text-black">
              Thanks for starting the registration process with Nog. Please click the
              button below to verify your email address and complete your account setup.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
                href={verifyLink}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:{" "}
              <Link href={verifyLink} className="text-blue-600 no-underline">
                {verifyLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-6 w-full border border-solid border-gray-200" />
            <Text className="text-xs leading-6 text-gray-600">
              If you didn&apos;t create an account with Nog, you can safely ignore this
              email. This verification link will expire in 24 hours.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactVerifyEmail(props: VerifyEmailProps) {
  return <VerifyEmail {...props} />
}

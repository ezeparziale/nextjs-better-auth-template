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

interface ResetPasswordEmailProps {
  name?: string
  resetLink?: string
}

export function ResetPasswordEmail({
  name = "there",
  resetLink = "https://example.com/reset",
}: ResetPasswordEmailProps) {
  const previewText = `Reset your Nog password`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-[465px] rounded border border-solid border-gray-200 p-5">
            <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
              Reset your <strong>Nog</strong> password
            </Heading>
            <Text className="text-sm leading-6 text-black">Hello {name},</Text>
            <Text className="text-sm leading-6 text-black">
              We received a request to reset your password for your Nog account. If you
              didn&apos;t make this request, you can safely ignore this email.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
                href={resetLink}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:{" "}
              <Link href={resetLink} className="text-blue-600 no-underline">
                {resetLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-6 w-full border border-solid border-gray-200" />
            <Text className="text-xs leading-6 text-gray-600">
              If you didn&apos;t request a password reset, please ignore this email or
              contact support if you have concerns.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactResetPasswordEmail(props: ResetPasswordEmailProps) {
  return <ResetPasswordEmail {...props} />
}

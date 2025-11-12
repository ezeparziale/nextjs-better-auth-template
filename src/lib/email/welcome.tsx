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
} from "@react-email/components"

interface WelcomeEmailProps {
  name?: string
  loginLink?: string
}

export function WelcomeEmail({
  name = "there",
  loginLink = "https://example.com/login",
}: WelcomeEmailProps) {
  const previewText = `Welcome to Nog!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-[465px] rounded border border-solid border-gray-200 p-5">
            <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
              Welcome to <strong>Nog</strong>!
            </Heading>
            <Text className="text-sm leading-6 text-black">Hello {name},</Text>
            <Text className="text-sm leading-6 text-black">
              Thank you for joining Nog! We&apos;re excited to have you on board. Your
              account has been successfully created and you&apos;re ready to get
              started.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
                href={loginLink}
              >
                Get Started
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function reactWelcomeEmail(props: WelcomeEmailProps) {
  return <WelcomeEmail {...props} />
}

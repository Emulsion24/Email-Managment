import { Html, Body, Container, Text, Heading, Button } from "@react-email/components";

export const WelcomeTemplate = ({ name, role }: { name: string, role: string }) => (
  <Html>
    <Body style={{ backgroundColor: "#f9f9f9", padding: "20px" }}>
      <Container style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "5px" }}>
        <Heading>Welcome, {name}!</Heading>
        <Text>You have been registered as a {role} in our system.</Text>
        <Button href="https://yourlink.com" style={{ background: "#000", color: "#fff", padding: "10px" }}>
          Go to Dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);
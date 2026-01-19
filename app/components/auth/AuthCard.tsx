import { Card, Heading, Text } from "@radix-ui/themes";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card size="4" style={{ maxWidth: 420 }} className="w-full">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-1 w-10 rounded-full bg-accent" />

        <Heading size="6">Hunger Truck</Heading>

        <Text size="2" color="gray">
          Track hunger. Understand patterns.
        </Text>
      </div>

      <div className="mt-8">{children}</div>
    </Card>
  );
}

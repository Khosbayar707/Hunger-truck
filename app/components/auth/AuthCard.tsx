import { Card, Heading, Text } from "@radix-ui/themes";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card
      size="4"
      className="relative w-full max-w-md border-0 shadow-xl backdrop-blur-sm bg-white/95"
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" />

        <Heading size="7" className="tracking-tight">
          Hunger Truck
        </Heading>

        <Text size="2" color="gray">
          Track hunger. Understand patterns. Feel better.
        </Text>
      </div>

      <div className="mt-8">{children}</div>
    </Card>
  );
}

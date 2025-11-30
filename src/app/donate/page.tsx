import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="container py-24">
      <div className="max-w-2xl mx-auto text-center">
        <Heart className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold">Support GitAssist</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          GitAssist is a passion project dedicated to improving the developer experience. Your support helps us cover server costs, invest in new features, and keep the core service free for everyone.
        </p>
      </div>

      <div className="max-w-md mx-auto mt-12">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>Choose an amount or enter a custom one.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Button variant="outline" size="lg">$5</Button>
                <Button variant="outline" size="lg">$10</Button>
                <Button variant="default" size="lg">$25</Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              You will be redirected to a secure payment processor.
            </p>
            <Button size="lg" className="w-full mt-4">
              Donate with Stripe (Placeholder)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

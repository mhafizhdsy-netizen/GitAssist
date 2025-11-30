
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Coffee, Star } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="container py-24 sm:py-32">
      <div className="max-w-3xl mx-auto text-center">
        <Heart className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold">Support GitAssist</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          GitAssist is a passion project dedicated to improving the developer experience. Your support helps us cover server costs, invest in new features, and keep the core service free for everyone. Every little bit helps!
        </p>
      </div>

      <div className="max-w-4xl mx-auto mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DonationCard
            icon={Coffee}
            title="Buy Us a Coffee"
            amount="$5"
            description="A small thank you to keep us fueled."
          />
          <DonationCard
            icon={Heart}
            title="Supporter"
            amount="$25"
            description="Help us cover monthly server costs."
            isFeatured={true}
          />
          <DonationCard
            icon={Star}
            title="Super Fan"
            amount="$100"
            description="Fund new feature development."
          />
        </div>
        <div className="text-center mt-12">
            <p className="text-muted-foreground">All donations are processed securely. We appreciate your support!</p>
        </div>
      </div>
    </div>
  );
}

function DonationCard({ icon: Icon, title, amount, description, isFeatured = false }: { icon: React.ElementType, title: string, amount: string, description: string, isFeatured?: boolean }) {
    return (
        <Card className={`glass-card flex flex-col text-center ${isFeatured ? 'border-primary shadow-primary/20' : ''}`}>
            <CardHeader className="flex-grow">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold mb-4">{amount}</p>
                <Button className="w-full" variant={isFeatured ? 'default' : 'outline'}>
                    Donate {amount}
                </Button>
            </CardContent>
        </Card>
    )
}

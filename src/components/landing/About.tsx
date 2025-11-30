import { PlaceHolderImages } from "@/lib/placeholder-images";
import { TEAM_MEMBERS } from "@/lib/constants";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "../ui/card";

export function About() {
  return (
    <section id="about" className="container py-24 sm:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold">The Mission Behind GitAssist</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          We believe in building tools that empower developers to be more productive and write better code. GitAssist was born from a desire to automate the tedious parts of version control, so you can focus on innovation.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="text-center text-3xl font-bold mb-10">Meet the Team</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {TEAM_MEMBERS.map((member) => {
            const memberImage = PlaceHolderImages.find(p => p.id === member.avatar);
            return (
              <Card key={member.name} className="glass-card p-6 flex flex-col items-center text-center">
                {memberImage && (
                  <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                    <AvatarImage src={memberImage.imageUrl} alt={member.name} data-ai-hint={memberImage.imageHint} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <h4 className="text-xl font-bold">{member.name}</h4>
                <p className="text-primary">{member.role}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

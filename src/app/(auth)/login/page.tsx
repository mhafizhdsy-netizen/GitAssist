import { signInWithGithub } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to GitAssist</CardTitle>
          <CardDescription>Sign in to continue to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <Button formAction={signInWithGithub} className="w-full" size="lg">
              <Github className="mr-2 h-5 w-5" />
              Login with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { type User } from "@supabase/supabase-js";
import { AiCommitHelper } from "@/components/dashboard/AiCommitHelper";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, UploadCloud } from "lucide-react";

type DashboardClientProps = {
  user: User;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <div className="container py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">
          Welcome, {user.user_metadata.full_name || user.email}
        </h1>
        <p className="text-muted-foreground mt-2">Ready to simplify your workflow?</p>
      </div>

      <Tabs defaultValue="uploader" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="uploader"><UploadCloud className="mr-2 h-4 w-4" /> Uploader</TabsTrigger>
          <TabsTrigger value="ai-commit"><Code className="mr-2 h-4 w-4" /> AI Commit Helper</TabsTrigger>
        </TabsList>
        <TabsContent value="uploader">
          <FileUploader />
        </TabsContent>
        <TabsContent value="ai-commit">
          <AiCommitHelper />
        </TabsContent>
      </Tabs>
    </div>
  );
}

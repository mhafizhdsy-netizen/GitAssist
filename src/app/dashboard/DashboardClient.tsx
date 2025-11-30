
"use client";

import { type User } from "firebase/auth";
import { AiCommitHelper } from "@/components/dashboard/AiCommitHelper";
import { FileUploader } from "@/components/dashboard/FileUploader";

type DashboardClientProps = {
  user: User;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <div className="container py-24 sm:py-32">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          Welcome, {user.displayName || user.email}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Let's get started. What would you like to do today?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-3">
          <FileUploader />
        </div>
        <div className="lg:col-span-2">
          <AiCommitHelper />
        </div>
      </div>
    </div>
  );
}

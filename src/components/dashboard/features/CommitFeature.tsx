
'use client';

import { AiCommitHelper } from "@/components/dashboard/AiCommitHelper";
import { FileUploader } from "@/components/dashboard/FileUploader";

export function CommitFeature() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-3">
                <FileUploader />
            </div>
            <div className="lg:col-span-2">
                <AiCommitHelper />
            </div>
        </div>
    );
}

'use client';

import { AiCommitHelper } from "@/components/dashboard/AiCommitHelper";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { motion } from "framer-motion";

export function CommitFeature() {
    return (
        <motion.div 
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="lg:col-span-3">
                <FileUploader />
            </div>
            <div className="lg:col-span-2">
                <AiCommitHelper />
            </div>
        </motion.div>
    );
}

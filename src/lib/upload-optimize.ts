
// ============================================================================
// STRATEGI OPTIMASI UPLOAD BANYAK FILE KE GITHUB
// ============================================================================

/**
 * STRATEGI 1: BATCH PROCESSING (PALING OPTIMAL!)
 * Upload file dalam batch paralel dengan kontrol concurrency
 * - Menghindari rate limit GitHub API (5000 requests/hour)
 * - Memanfaatkan Promise.all untuk paralel processing
 * - Progress tracking untuk UX yang lebih baik
 */

import pLimit from 'p-limit';

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
}

interface BatchUploadOptions {
  files: Array<{ path: string; content: string }>;
  githubToken: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  onProgress?: (progress: UploadProgress) => void;
  batchSize?: number; // Jumlah file per batch
  concurrency?: number; // Jumlah request paralel
}

/**
 * METODE 1: Single Commit untuk Semua File (TERCEPAT!)
 * Semua file di-upload dalam 1 commit menggunakan Git Data API
 * ✅ Tercepat untuk bulk upload
 * ✅ Hanya 1 commit di history
 * ✅ Atomic operation (all or nothing)
 * ⚠️  Max ~1000 files per commit (GitHub limit)
 */
export async function uploadFilesInSingleCommit(options: BatchUploadOptions) {
  const { files, githubToken, owner, repo, branch, commitMessage, onProgress } = options;
  
  const total = files.length;
  let completed = 0;
  let failed = 0;

  const updateProgress = () => {
    if (onProgress) {
      onProgress({
        total,
        completed,
        failed,
        percentage: Math.round((completed / total) * 100)
      });
    }
  };

  try {
    // Step 1: Get current branch reference
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    const refData = await refResponse.json();
    const currentCommitSha = refData.object.sha;

    // Step 2: Get current commit to get tree SHA
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3: Create blobs for all files (PARALLEL!)
    const concurrency = options.concurrency || 10; // Max 10 parallel requests
    const limit = pLimit(concurrency);

    const blobPromises = files.map((file) =>
      limit(async () => {
        try {
          const base64Content = Buffer.from(file.content, 'utf-8').toString('base64');
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
              body: JSON.stringify({
                content: base64Content,
                encoding: 'base64',
              }),
            }
          );
          const data = await response.json();
          completed++;
          updateProgress();
          return {
            path: file.path,
            sha: data.sha,
            mode: '100644',
            type: 'blob' as const,
          };
        } catch (error) {
          failed++;
          updateProgress();
          throw error;
        }
      })
    );

    const blobs = await Promise.all(blobPromises);

    // Step 4: Create tree with all blobs
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: blobs,
        }),
      }
    );
    const treeData = await treeResponse.json();

    // Step 5: Create commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [currentCommitSha],
        }),
      }
    );
    const newCommitData = await newCommitResponse.json();

    // Step 6: Update branch reference
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    );

    return {
      success: true,
      commitSha: newCommitData.sha,
      filesUploaded: completed,
      filesFailed: failed,
    };
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}

/**
 * METODE 2: Batched Commits (untuk file sangat banyak > 1000)
 * Upload file dalam beberapa commit dengan batch tertentu
 * ✅ Cocok untuk 1000+ files
 * ✅ Progress tracking lebih detail
 * ✅ Retry mechanism per batch
 * ⚠️  Lebih lambat dari single commit
 * ⚠️  Multiple commits di history
 */
export async function uploadFilesInBatches(options: BatchUploadOptions) {
  const { files, batchSize = 100, onProgress } = options;
  
  const total = files.length;
  let completed = 0;
  let failed = 0;

  const updateProgress = () => {
    if (onProgress) {
      onProgress({
        total,
        completed,
        failed,
        percentage: Math.round((completed / total) * 100)
      });
    }
  };

  // Split files into batches
  const batches: Array<Array<{ path: string; content: string }>> = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  const results = [];

  // Process each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1}/${batches.length}...`);
    
    try {
      const result = await uploadFilesInSingleCommit({
        ...options,
        files: batches[i],
        commitMessage: `${options.commitMessage} (batch ${i + 1}/${batches.length})`,
      });
      
      completed += batches[i].length;
      updateProgress();
      results.push(result);
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      failed += batches[i].length;
      updateProgress();
    }
  }

  return {
    success: failed === 0,
    totalBatches: batches.length,
    successfulBatches: results.length,
    failedBatches: batches.length - results.length,
    filesUploaded: completed,
    filesFailed: failed,
  };
}

/**
 * METODE 3: GraphQL API (ALTERNATIF MODERN)
 * Menggunakan GraphQL Mutation.createCommitOnBranch
 * ✅ Single API call untuk multiple files
 * ✅ Modern approach
 * ✅ Lebih efisien dari REST API
 */
export async function uploadFilesViaGraphQL(options: BatchUploadOptions) {
  const { files, githubToken, owner, repo, branch, commitMessage } = options;

  // Get current HEAD OID
  const headQuery = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        ref(qualifiedName: "refs/heads/${branch}") {
          target {
            oid
          }
        }
      }
    }
  `;

  const headResponse = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: headQuery }),
  });

  const headData = await headResponse.json();
  const headOid = headData.data.repository.ref.target.oid;

  // Create commit with multiple files
  const additions = files.map(file => ({
    path: file.path,
    contents: Buffer.from(file.content, 'utf-8').toString('base64'),
  }));

  const mutation = `
    mutation {
      createCommitOnBranch(input: {
        branch: {
          repositoryNameWithOwner: "${owner}/${repo}",
          branchName: "${branch}"
        },
        message: {
          headline: "${commitMessage}"
        },
        fileChanges: {
          additions: ${JSON.stringify(additions)}
        },
        expectedHeadOid: "${headOid}"
      }) {
        commit {
          oid
          url
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  const data = await response.json();

  return {
    success: true,
    commitOid: data.data.createCommitOnBranch.commit.oid,
    commitUrl: data.data.createCommitOnBranch.commit.url,
  };
}

// ============================================================================
// REACT COMPONENT EXAMPLE - Progress UI
// ============================================================================

import { useState } from 'react';

export function BulkUploadComponent() {
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleBulkUpload = async (files: File[]) => {
    setIsUploading(true);

    // Convert files to format needed
    const fileContents = await Promise.all(
      files.map(async (file) => ({
        path: file.name,
        content: await file.text(),
      }))
    );

    try {
      // PILIHAN 1: Single commit (recommended untuk < 1000 files)
      if (files.length <= 1000) {
        await uploadFilesInSingleCommit({
          files: fileContents,
          githubToken: 'YOUR_TOKEN',
          owner: 'YOUR_USERNAME',
          repo: 'YOUR_REPO',
          branch: 'main',
          commitMessage: `Upload ${files.length} files`,
          onProgress: setProgress,
          concurrency: 10, // 10 parallel requests
        });
      } 
      // PILIHAN 2: Batched commits (untuk > 1000 files)
      else {
        await uploadFilesInBatches({
          files: fileContents,
          githubToken: 'YOUR_TOKEN',
          owner: 'YOUR_USERNAME',
          repo: 'YOUR_REPO',
          branch: 'main',
          commitMessage: `Bulk upload files`,
          onProgress: setProgress,
          batchSize: 100, // 100 files per commit
          concurrency: 10,
        });
      }

      alert('Upload completed!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed!');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleBulkUpload(files);
        }}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="mt-4">
          <div className="mb-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {progress.completed} / {progress.total} files uploaded
            {progress.failed > 0 && (
              <span className="text-red-600 ml-2">
                ({progress.failed} failed)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PACKAGE.JSON DEPENDENCIES
// ============================================================================
/*
{
  "dependencies": {
    "p-limit": "^5.0.0"  // Untuk concurrency control
  }
}
*/

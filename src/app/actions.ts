'use server';

import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';
import crypto from 'crypto';

export async function signOut() {
  // This server action is now only responsible for redirection.
  // The client will handle the actual Firebase sign-out.
  return redirect('/');
}

export type Repo = {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
    owner: {
        login: string;
    };
    default_branch: string;
    topics: string[];
};

export type Branch = {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
};

export type RepoContent = {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    html_url: string;
    download_url: string | null;
};

type GitHubFile = {
  path: string;
  content: string;
};

export interface UploadProgress {
  step: 'preparing' | 'uploading' | 'finalizing';
  progress: number;
  totalBatches?: number;
  currentBatch?: number;
}

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
  onProgress?: (progress: UploadProgress) => void;
};

/**
 * Generate SHA-1 hash for Git empty tree
 * This creates the universal empty tree hash that Git uses
 * Formula: sha1("tree 0\0")
 */
function generateEmptyTreeSHA(): string {
    const header = 'tree 0\0';
    const hash = crypto.createHash('sha1');
    hash.update(header);
    const sha = hash.digest('hex');
    
    console.log(`✓ Generated empty tree SHA: ${sha}`);
    return sha;
}

/**
 * Fallback: hardcoded SHA-1 empty tree hash
 * This is the universal Git empty tree hash for SHA-1
 */
const FALLBACK_EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

/**
 * Get empty tree SHA with fallback
 */
function getEmptyTreeSHA(): string {
    try {
        const dynamicSHA = generateEmptyTreeSHA();
        
        if (dynamicSHA === FALLBACK_EMPTY_TREE_SHA) {
            console.log('✓ Dynamic SHA matches expected value');
            return dynamicSHA;
        } else {
            console.warn(`⚠️ Dynamic SHA (${dynamicSHA}) doesn't match expected (${FALLBACK_EMPTY_TREE_SHA})`);
            console.warn('Using fallback SHA');
            return FALLBACK_EMPTY_TREE_SHA;
        }
    } catch (error) {
        console.error('Failed to generate empty tree SHA dynamically:', error);
        console.log('Using fallback SHA');
        return FALLBACK_EMPTY_TREE_SHA;
    }
}

async function api(url: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.github.com${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        
        console.error('--- GITHUB API ERROR DETAIL ---');
        console.error(`METHOD: ${options.method || 'GET'}`);
        console.error(`URL: https://api.github.com${url}`);
        console.error(`STATUS: ${response.status} ${response.statusText}`);
        console.error('BODY:', errorBody);
        console.error('-----------------------------');

        throw new Error(errorBody.message || `GitHub API error: ${response.status} ${response.statusText}`);
    }
  
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
    }
    
    return response.json();
}

async function isRepositoryEmpty(owner: string, repo: string, token: string): Promise<boolean> {
    try {
        const repoData = await api(`/repos/${owner}/${repo}`, token);
        if (!repoData) return true;

        const branchName = repoData.default_branch || 'main';
        await api(`/repos/${owner}/${repo}/git/ref/heads/${branchName}`, token);
        
        return false;
    } catch (error: any) {
        if (error.message && (error.message.includes('Not Found') || error.message.includes('Git Repository is empty'))) {
            return true;
        }
        console.error("Error saat mendeteksi repositori kosong:", error);
        throw error;
    }
}

async function initializeEmptyRepository(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string; encoding: 'utf-8' | 'base64' }>,
    token: string,
    commitMessage: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; commitUrl: string }> {
    console.log(`Memulai inisialisasi repositori kosong untuk ${owner}/${repo}`);

    const repoInfo = await api(`/repos/${owner}/${repo}`, token);
    const branchToCreate = repoInfo.default_branch || 'main';

    onProgress?.({ step: 'preparing', progress: 10 });
    
    // Step 1: Buat blobs untuk semua file
    console.log(`Step 1: Creating ${files.length} blob(s)...`);
    const blobs = await Promise.all(
        files.map(async (file, index) => {
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: file.content, encoding: file.encoding }),
            });
            console.log(`✓ Created blob for ${file.path}: ${blob.sha}`);
            onProgress?.({ step: 'uploading', progress: 10 + Math.round(((index + 1) / files.length) * 70) });
            return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' as const };
        })
    );

    onProgress?.({ step: 'finalizing', progress: 80 });

    // Step 2: Buat tree dari blobs
    console.log('Step 2: Creating tree from blobs...');
    const tree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ tree: blobs }),
    });
    console.log(`✓ Created tree: ${tree.sha}`);
    
    // Step 3: Buat commit yang menunjuk ke tree
    console.log('Step 3: Creating commit...');
    const commit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: [],
        }),
    });
    console.log(`✓ Created commit: ${commit.sha}`);
    
    onProgress?.({ step: 'finalizing', progress: 90 });

    // Step 4: Buat branch reference ke commit baru
    console.log('Step 4: Creating branch reference...');
    await api(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/heads/${branchToCreate}`,
            sha: commit.sha,
        }),
    });
    console.log(`✓ Branch ${branchToCreate} now points to new commit`);

    return { 
        success: true, 
        commitUrl: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`
    };
}


async function commitToExistingRepoOptimized(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string; encoding: 'utf-8' | 'base64' }>,
    token: string,
    targetBranch: string,
    commitMessage: string,
    options: { concurrency?: number; onProgress?: (progress: UploadProgress) => void; batchInfo?: { current: number, total: number }}
): Promise<{ success: boolean; commitUrl: string }> {
    const { concurrency = 10, onProgress, batchInfo } = options;
    console.log(`Committing ${files.length} files to ${owner}/${repo}...`);
    onProgress?.({ step: 'preparing', progress: 10, ...(batchInfo && { currentBatch: batchInfo.current, totalBatches: batchInfo.total }) });

    const refData = await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token);
    const latestCommitSha = refData.object.sha;

    const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = latestCommitData.tree.sha;

    const blobs = [];
    const totalFiles = files.length;
    let filesProcessed = 0;
    
    for (let i = 0; i < totalFiles; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const batchBlobs = await Promise.all(
            batch.map(async (file) => {
                const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                    method: 'POST',
                    body: JSON.stringify({ content: file.content, encoding: file.encoding }),
                });
                 filesProcessed++;
                 const overallProgress = 10 + Math.round((filesProcessed / totalFiles) * 70);
                 onProgress?.({ step: 'uploading', progress: overallProgress, ...(batchInfo && { currentBatch: batchInfo.current, totalBatches: batchInfo.total }) });
                return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
            })
        );
        blobs.push(...batchBlobs);
    }

    onProgress?.({ step: 'finalizing', progress: 80, ...(batchInfo && { currentBatch: batchInfo.current, totalBatches: batchInfo.total }) });

    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }),
    });

    const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] }),
    });
    
    onProgress?.({ step: 'finalizing', progress: 90, ...(batchInfo && { currentBatch: batchInfo.current, totalBatches: batchInfo.total }) });

    await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha }),
    });

    return { success: true, commitUrl: newCommit.html_url };
}

async function commitInBatches(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string; encoding: 'utf-8' | 'base64' }>,
    token: string,
    branch: string,
    commitMessage: string,
    options: { onProgress?: (progress: UploadProgress) => void; batchSize?: number; concurrency?: number; }
): Promise<{ success: boolean; commitUrl: string }> {
    const { onProgress, batchSize = 100, concurrency = 10 } = options;

    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }

    const totalBatches = batches.length;
    console.log(`Splitting into ${totalBatches} batches of ${batchSize} files each`);

    let lastCommitUrl = '';

    for (let i = 0; i < batches.length; i++) {
        const currentBatch = i + 1;
        console.log(`Processing batch ${currentBatch}/${totalBatches}...`);
        
        const result = await commitToExistingRepoOptimized(
            owner,
            repo,
            batches[i],
            token,
            branch,
            `${commitMessage} (batch ${currentBatch}/${totalBatches})`,
            { onProgress, concurrency, batchInfo: { current: currentBatch, total: totalBatches } }
        );
        lastCommitUrl = result.commitUrl;
    }

    return {
        success: true,
        commitUrl: lastCommitUrl
    };
}

export async function commitToRepo({ 
    repoUrl, 
    commitMessage, 
    files, 
    githubToken, 
    destinationPath, 
    branchName,
    onProgress
}: CommitParams): Promise<{ success: boolean; commitUrl: string }> {
    if (!githubToken) {
        throw new Error('GitHub token required');
    }

    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) {
        throw new Error('Invalid repository URL format');
    }
    const [owner, repo] = urlParts;

    const finalFiles = files.map(file => {
      const finalPath = destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path;
      return { ...file, path: finalPath };
    });
    
    onProgress?.({ step: 'preparing', progress: 5 });

    try {
        const repoIsEmpty = await isRepositoryEmpty(owner, repo, githubToken);
        
        if (repoIsEmpty) {
            console.log('⚠️  Empty repository detected. Initializing...');
            return await initializeEmptyRepository(owner, repo, finalFiles, githubToken, commitMessage, onProgress);
        }

        const repoInfo = await api(`/repos/${owner}/${repo}`, githubToken);
        const targetBranch = branchName || repoInfo.default_branch || 'main';

        const fileCount = finalFiles.length;
        
        if (fileCount <= 500) {
            console.log(`✓ Using single commit strategy for ${fileCount} files`);
            return await commitToExistingRepoOptimized(
                owner, 
                repo, 
                finalFiles, 
                githubToken, 
                targetBranch, 
                commitMessage,
                { onProgress, concurrency: 10 }
            );
        } else {
            console.log(`✓ Using batched commit strategy for ${fileCount} files`);
            return await commitInBatches(
                owner,
                repo,
                finalFiles,
                githubToken,
                targetBranch,
                commitMessage,
                { onProgress, batchSize: 100, concurrency: 10 }
            );
        }
    } catch (error: any) {
        console.error('Failed to commit to GitHub:', error);
        throw new Error(error.message || 'Failed to commit files');
    }
}


export async function fetchUserRepos(githubToken: string, page: number = 1, perPage: number = 100): Promise<Repo[]> {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }
    
    const repos = await api(`/user/repos?type=owner&sort=updated&per_page=${perPage}&page=${page}`, githubToken);
    
    if (!Array.isArray(repos)) return [];

    return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        owner: {
            login: repo.owner.login,
        },
        default_branch: repo.default_branch,
        topics: repo.topics || [],
    }));
}

export async function fetchRepoBranches(githubToken: string, owner: string, repo: string): Promise<Branch[]> {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }
    try {
        const branches = await api(`/repos/${owner}/${repo}/branches`, githubToken);
        return branches || [];
    } catch (error: any) {
        if (error.message && (error.message.includes('Git Repository is empty') || error.message.includes('Not Found'))) {
            return [];
        }
        console.error("Gagal mengambil branches:", error);
        throw error;
    }
}

export async function fetchRepoContents(githubToken: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[] | string> {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }
    try {
      const contents = await api(`/repos/${owner}/${repo}/contents/${path}`, githubToken);
      
      if (contents === null) {
          return [];
      }

      if (contents?.type === 'file' && typeof contents?.content === 'string' && contents.encoding === 'base64') {
          try {
            const buffer = Buffer.from(contents.content, 'base64');
            // Simple check for binary content (e.g. looking for null bytes)
            let isBinary = false;
            for (let i = 0; i < Math.min(buffer.length, 512); i++) {
                if (buffer[i] === 0) {
                    isBinary = true;
                    break;
                }
            }
            if (isBinary) {
                return contents.content; // Return base64 for images/binary
            }
            return buffer.toString('utf-8');
          } catch(e) {
            // If buffer fails, it's likely a browser environment without polyfill, return base64
            return contents.content;
          }
      }

      if (!Array.isArray(contents)) return [];
      
      contents.sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
      });

      return contents.map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          type: item.type,
          html_url: item.html_url,
          download_url: item.download_url
      }));
    } catch (error: any) {
      if (error.message && (error.message.includes("This repository is empty") || error.message.includes("Not Found"))) {
        return [];
      }
      throw error;
    }
}

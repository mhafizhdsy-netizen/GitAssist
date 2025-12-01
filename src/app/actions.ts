'use server';

import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';
import crypto from 'crypto';

export async function signOut() {
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

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
};

export interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
}

function generateEmptyTreeSHA(): string {
    const header = 'tree 0\0';
    const hash = crypto.createHash('sha1');
    hash.update(header);
    return hash.digest('hex');
}

const FALLBACK_EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

function getEmptyTreeSHA(): string {
    try {
        const dynamicSHA = generateEmptyTreeSHA();
        if (dynamicSHA === FALLBACK_EMPTY_TREE_SHA) {
            return dynamicSHA;
        }
        return FALLBACK_EMPTY_TREE_SHA;
    } catch (error) {
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
        console.error('--- GITHUB API ERROR ---');
        console.error(`${options.method || 'GET'} ${url}: ${response.status}`);
        throw new Error(errorBody.message || `GitHub API error: ${response.status}`);
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
        throw error;
    }
}

async function initializeEmptyRepository(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    token: string,
    commitMessage: string
): Promise<{ success: boolean; commitUrl: string }> {
    console.log(`Initializing empty repository ${owner}/${repo}`);

    const repoInfo = await api(`/repos/${owner}/${repo}`, token);
    const branchToCreate = repoInfo.default_branch || 'main';

    const dummyContent = Buffer.from('dummy', 'utf-8').toString('base64');
    const dummyResponse = await api(`/repos/${owner}/${repo}/contents/dummy`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: 'Initialize repository',
            content: dummyContent,
            branch: branchToCreate
        }),
    });

    const dummySHA = dummyResponse.content?.sha;

    await api(`/repos/${owner}/${repo}/contents/dummy`, token, {
        method: 'DELETE',
        body: JSON.stringify({
            message: 'Delete dummy file',
            sha: dummySHA,
            branch: branchToCreate
        }),
    });

    const blobs = await Promise.all(
        files.map(async (file) => {
            const base64Content = Buffer.from(file.content, 'utf-8').toString('base64');
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
            });
            return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' as const };
        })
    );

    const emptyTreeSHA = getEmptyTreeSHA();
    const tree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ base_tree: emptyTreeSHA, tree: blobs }),
    });

    const commit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: [],
        }),
    });

    await api(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/heads/${branchToCreate}`,
            sha: commit.sha,
        }),
    });

    return { 
        success: true, 
        commitUrl: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`
    };
}

/**
 * OPTIMIZED: Upload banyak file dengan parallel processing
 * Menggunakan Promise.all untuk membuat blobs secara paralel
 */
async function commitToExistingRepoOptimized(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    token: string,
    targetBranch: string,
    commitMessage: string,
    concurrency: number = 10
): Promise<{ success: boolean; commitUrl: string }> {
    console.log(`Committing ${files.length} files to ${owner}/${repo}...`);

    const refData = await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token);
    const latestCommitSha = refData.object.sha;

    const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = latestCommitData.tree.sha;

    // OPTIMIZED: Create blobs in parallel with concurrency control
    const blobs = [];
    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const batchBlobs = await Promise.all(
            batch.map(async (file) => {
                const base64Content = Buffer.from(file.content, 'utf-8').toString('base64');
                const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                    method: 'POST',
                    body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
                });
                return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
            })
        );
        blobs.push(...batchBlobs);
        console.log(`Progress: ${Math.min(i + concurrency, files.length)}/${files.length} blobs created`);
    }

    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }),
    });

    const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] }),
    });

    await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha }),
    });

    return { success: true, commitUrl: newCommit.html_url };
}

/**
 * STRATEGY: Automatic decision between single commit or batched commits
 * - < 500 files: Single commit with parallel blob creation
 * - >= 500 files: Multiple commits in batches
 */
export async function commitToRepo({ 
    repoUrl, 
    commitMessage, 
    files, 
    githubToken, 
    destinationPath, 
    branchName 
}: CommitParams) {
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

    try {
        const repoIsEmpty = await isRepositoryEmpty(owner, repo, githubToken);
        
        if (repoIsEmpty) {
            console.log('⚠️  Empty repository detected. Initializing...');
            return await initializeEmptyRepository(owner, repo, finalFiles, githubToken, commitMessage);
        }

        const repoInfo = await api(`/repos/${owner}/${repo}`, githubToken);
        const targetBranch = branchName || repoInfo.default_branch || 'main';

        // STRATEGY: Choose optimal upload method based on file count
        const fileCount = finalFiles.length;
        
        if (fileCount <= 500) {
            // Single commit with parallel blob creation (FASTEST)
            console.log(`✓ Using single commit strategy for ${fileCount} files`);
            return await commitToExistingRepoOptimized(
                owner, 
                repo, 
                finalFiles, 
                githubToken, 
                targetBranch, 
                commitMessage,
                10 // 10 parallel requests
            );
        } else {
            // Multiple commits in batches (for large uploads)
            console.log(`✓ Using batched commit strategy for ${fileCount} files`);
            return await commitInBatches(
                owner,
                repo,
                finalFiles,
                githubToken,
                targetBranch,
                commitMessage,
                100 // 100 files per batch
            );
        }
    } catch (error: any) {
        console.error('Failed to commit to GitHub:', error);
        throw new Error(error.message || 'Failed to commit files');
    }
}

/**
 * BATCHED COMMITS: For very large file uploads (500+ files)
 */
async function commitInBatches(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    token: string,
    branch: string,
    commitMessage: string,
    batchSize: number = 100
): Promise<{ success: boolean; commitUrl: string }> {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }

    console.log(`Splitting into ${batches.length} batches of ${batchSize} files each`);

    let lastCommitUrl = '';

    for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1}/${batches.length}...`);
        const result = await commitToExistingRepoOptimized(
            owner,
            repo,
            batches[i],
            token,
            branch,
            `${commitMessage} (batch ${i + 1}/${batches.length})`,
            10
        );
        lastCommitUrl = result.commitUrl;
    }

    return {
        success: true,
        commitUrl: lastCommitUrl
    };
}

export async function fetchUserRepos(githubToken: string, page: number = 1, perPage: number = 100): Promise<Repo[]> {
    if (!githubToken) {
        throw new Error('GitHub token required');
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
        throw new Error('GitHub token required');
    }
    try {
        const branches = await api(`/repos/${owner}/${repo}/branches`, githubToken);
        return branches || [];
    } catch (error: any) {
        if (error.message && (error.message.includes('Git Repository is empty') || error.message.includes('Not Found'))) {
            return [];
        }
        throw error;
    }
}

export async function fetchRepoContents(githubToken: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[] | string> {
    if (!githubToken) {
        throw new Error('GitHub token required');
    }
    try {
      const contents = await api(`/repos/${owner}/${repo}/contents/${path}`, githubToken);
      
      if (contents === null) return [];

      if (contents?.type === 'file' && typeof contents?.content === 'string' && contents.encoding === 'base64') {
          return Buffer.from(contents.content, 'base64').toString('utf-8');
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

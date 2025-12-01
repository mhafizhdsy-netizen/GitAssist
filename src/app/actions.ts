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

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
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

        // An empty repo might have a default branch name but no actual branches.
        // We must check if any refs exist.
        const refs = await api(`/repos/${owner}/${repo}/git/refs?per_page=1`, token);
        if (Array.isArray(refs) && refs.length === 0) {
            return true;
        }
        
        return false;
    } catch (error: any) {
        // A 404 on the repo itself means it doesn't exist, which isn't "empty" in this context
        // But a 409 usually means it's empty.
        if (error.message && (error.message.includes('Git Repository is empty') || error.message.includes('409'))) {
            return true;
        }
        console.error("Error saat mendeteksi repositori kosong:", error);
        throw error; // Rethrow other errors
    }
}

async function initializeEmptyRepository(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    token: string,
    commitMessage: string
): Promise<{ success: boolean; commitUrl: string }> {
    console.log(`Memulai inisialisasi repositori kosong untuk ${owner}/${repo}`);

    const repoInfo = await api(`/repos/${owner}/${repo}`, token);
    const branchToCreate = repoInfo.default_branch || 'main';

    console.log(`Step 1: Creating ${files.length} blob(s) for initial commit...`);
    const blobs = await Promise.all(
        files.map(async (file) => {
            const base64Content = file.content; // Content is already base64 encoded
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
            });
            console.log(`✓ Created blob for ${file.path}: ${blob.sha}`);
            return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' as const };
        })
    );

    console.log('Step 2: Creating tree from blobs...');
    const tree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ tree: blobs }),
    });
    console.log(`✓ Created tree: ${tree.sha}`);

    console.log('Step 3: Creating initial commit...');
    const commit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: [], // No parents for the first commit
        }),
    });
    console.log(`✓ Created commit: ${commit.sha}`);

    console.log('Step 4: Creating new branch ref...');
    await api(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/heads/${branchToCreate}`,
            sha: commit.sha,
        }),
    });
    console.log(`✓ Branch ${branchToCreate} created and points to new commit`);

    return { 
        success: true, 
        commitUrl: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`
    };
}


async function commitToExistingRepo(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    token: string,
    targetBranch: string,
    commitMessage: string
): Promise<{ success: boolean; commitUrl: string }> {
    console.log(`Melakukan commit ke repositori yang sudah ada ${owner}/${repo} di branch ${targetBranch}`);

    const refData = await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token);
    const latestCommitSha = refData.object.sha;

    const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = latestCommitData.tree.sha;

    const blobs = await Promise.all(
        files.map(async (file) => {
            const base64Content = file.content; // Content is already base64
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
            });
            return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
        })
    );

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

export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath, branchName }: CommitParams) {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }

    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) {
        throw new Error('Format URL repositori tidak valid. Diharapkan "owner/repo".');
    }
    const [owner, repo] = urlParts;

    const finalFiles = files.map(file => {
      const finalPath = destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path;
      return { ...file, path: finalPath };
    });

    try {
        const repoIsEmpty = await isRepositoryEmpty(owner, repo, githubToken);
        
        if (repoIsEmpty) {
            console.log('⚠️ Repositori kosong terdeteksi. Menjalankan inisialisasi...');
            return await initializeEmptyRepository(owner, repo, finalFiles, githubToken, commitMessage);
        } else {
            console.log('✓ Repositori sudah ada isinya. Melanjutkan commit standar...');
            const repoInfo = await api(`/repos/${owner}/${repo}`, githubToken);
            const targetBranch = branchName || repoInfo.default_branch || 'main';
            return await commitToExistingRepo(owner, repo, finalFiles, githubToken, targetBranch, commitMessage);
        }
    } catch (error: any) {
        console.error('Gagal melakukan commit ke GitHub:', error);
        throw new Error(error.message || 'Gagal melakukan commit file ke repositori.');
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

export async function createBranch(githubToken: string, owner: string, repo: string, newBranchName: string, sourceBranchName: string): Promise<any> {
    if (!githubToken) {
      throw new Error('Token GitHub diperlukan.');
    }
    
    // 1. Get the SHA of the source branch
    const refData = await api(`/repos/${owner}/${repo}/git/ref/heads/${sourceBranchName}`, githubToken);
    const sha = refData.object.sha;
  
    if (!sha) {
      throw new Error(`Tidak dapat menemukan SHA untuk branch sumber '${sourceBranchName}'.`);
    }
  
    // 2. Create the new branch (ref)
    const newRef = await api(`/repos/${owner}/${repo}/git/refs`, githubToken, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha: sha,
      }),
    });
  
    return newRef;
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

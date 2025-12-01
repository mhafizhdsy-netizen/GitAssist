'use server';

import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';

export async function signOut() {
  // This server action is now only responsible for redirection.
  // The client will handle the actual Firebase sign-out.
  return redirect('/');
}

// ==================================
// COMMON TYPES
// ==================================
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

export type Issue = {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
    created_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
};

export type Release = {
    id: number;
    tag_name: string;
    name: string;
    body: string | null;
    html_url: string;
    published_at: string;
    author: {
        login: string;
        avatar_url: string;
    };
    assets: Array<{
        id: number;
        name: string;
        browser_download_url: string;
    }>;
    tarball_url: string | null;
    zipball_url: string | null;
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

// ==================================
// GITHUB API WRAPPER
// ==================================
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

// ==================================
// REPO & BRANCH ACTIONS
// ==================================
export async function fetchUserRepos(githubToken: string, page: number = 1, perPage: number = 100): Promise<Repo[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    
    const repos = await api(`/user/repos?type=owner&sort=updated&per_page=${perPage}&page=${page}`, githubToken);
    
    if (!Array.isArray(repos)) return [];

    return repos.map((repo: any) => ({
        id: repo.id, name: repo.name, full_name: repo.full_name, html_url: repo.html_url, description: repo.description, language: repo.language,
        stargazers_count: repo.stargazers_count, forks_count: repo.forks_count, updated_at: repo.updated_at,
        owner: { login: repo.owner.login }, default_branch: repo.default_branch, topics: repo.topics || [],
    }));
}

export async function fetchRepoBranches(githubToken: string, owner: string, repo: string): Promise<Branch[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    try {
        const branches = await api(`/repos/${owner}/${repo}/branches`, githubToken);
        return branches || [];
    } catch (error: any) {
        if (error.message && (error.message.includes('Git Repository is empty') || error.message.includes('Not Found'))) return [];
        console.error("Gagal mengambil branches:", error);
        throw error;
    }
}

export async function fetchRepoContents(githubToken: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[] | string> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
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
          name: item.name, path: item.path, sha: item.sha, size: item.size, type: item.type,
          html_url: item.html_url, download_url: item.download_url
      }));
    } catch (error: any) {
      if (error.message && (error.message.includes("This repository is empty") || error.message.includes("Not Found"))) return [];
      throw error;
    }
}


export async function createBranch(githubToken: string, owner: string, repo: string, newBranchName: string, sourceBranchName: string): Promise<any> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    
    const refData = await api(`/repos/${owner}/${repo}/git/ref/heads/${sourceBranchName}`, githubToken);
    const sha = refData.object.sha;
  
    if (!sha) throw new Error(`Tidak dapat menemukan SHA untuk branch sumber '${sourceBranchName}'.`);
  
    return await api(`/repos/${owner}/${repo}/git/refs`, githubToken, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${newBranchName}`, sha: sha }),
    });
}

// ==================================
// COMMIT ACTIONS
// ==================================
type CommitParams = {
  repoUrl: string; commitMessage: string; files: GitHubFile[]; githubToken: string; destinationPath?: string; branchName?: string;
};

async function isRepositoryEmpty(owner: string, repo: string, token: string): Promise<boolean> {
    try {
        const repoData = await api(`/repos/${owner}/${repo}`, token);
        // An empty repo has size 0
        return repoData.size === 0;
    } catch (error: any) {
        if (error.message && error.message.includes('404')) return true; // Not found can be considered empty for our purpose
        throw error;
    }
}

async function initializeEmptyRepository(owner: string, repo: string, files: Array<{ path: string; content: string }>, token: string, commitMessage: string, branchToCreate: string): Promise<{ success: boolean; commitUrl: string }> {
    const blobs = await Promise.all(
        files.map(async (file) => {
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: file.content, encoding: 'base64' }),
            });
            return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' as const };
        })
    );
    const tree = await api(`/repos/${owner}/${repo}/git/trees`, token, { method: 'POST', body: JSON.stringify({ tree: blobs }) });
    const commit = await api(`/repos/${owner}/${repo}/git/commits`, token, { method: 'POST', body: JSON.stringify({ message: commitMessage, tree: tree.sha, parents: [] }) });
    await api(`/repos/${owner}/${repo}/git/refs`, token, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branchToCreate}`, sha: commit.sha }) });
    return { success: true, commitUrl: commit.html_url };
}

async function commitToExistingRepo(owner: string, repo: string, files: Array<{ path: string; content: string }>, token: string, targetBranch: string, commitMessage: string): Promise<{ success: boolean; commitUrl: string }> {
    const refData = await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token);
    const latestCommitSha = refData.object.sha;
    const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = latestCommitData.tree.sha;
    
    const blobs = await Promise.all(
        files.map(async (file) => {
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: file.content, encoding: 'base64' }),
            });
            return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
        })
    );
    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, token, { method: 'POST', body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }) });
    const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, token, { method: 'POST', body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] }) });
    await api(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, token, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
    return { success: true, commitUrl: newCommit.html_url };
}

export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath, branchName }: CommitParams) {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');
    if (!owner || !repo) throw new Error('Format URL repositori tidak valid.');

    const finalFiles = files.map(file => ({
      ...file,
      path: destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path,
    }));

    try {
        const repoInfo = await api(`/repos/${owner}/${repo}`, githubToken);
        const targetBranch = branchName || repoInfo.default_branch || 'main';
        
        let repoIsEmpty;
        try {
            // Check for branches. If it fails with 404 or empty repo error, it's empty.
            await api(`/repos/${owner}/${repo}/branches/${targetBranch}`, githubToken);
            repoIsEmpty = false;
        } catch (error: any) {
            if (error.message.includes('Not Found') || error.message.includes('Git Repository is empty')) {
                repoIsEmpty = true;
            } else {
                throw error;
            }
        }
        
        if (repoIsEmpty) {
            return await initializeEmptyRepository(owner, repo, finalFiles, githubToken, commitMessage, targetBranch);
        } else {
            return await commitToExistingRepo(owner, repo, finalFiles, githubToken, targetBranch, commitMessage);
        }
    } catch (error: any) {
        throw new Error(error.message || 'Gagal melakukan commit file ke repositori.');
    }
}

// ==================================
// ISSUES ACTIONS
// ==================================
export async function fetchRepoIssues(githubToken: string, owner: string, repo: string): Promise<Issue[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    const issues = await api(`/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc`, githubToken);
    return Array.isArray(issues) ? issues : [];
}

export async function createIssue(githubToken: string, owner: string, repo: string, title: string, body: string): Promise<any> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    return await api(`/repos/${owner}/${repo}/issues`, githubToken, {
        method: 'POST',
        body: JSON.stringify({ title, body }),
    });
}

// ==================================
// RELEASES ACTIONS
// ==================================
type ReleasePayload = {
    tag_name: string;
    target_commitish: string;
    name: string;
    body: string;
    draft?: boolean;
    prerelease?: boolean;
};

export async function fetchRepoReleases(githubToken: string, owner: string, repo: string): Promise<Release[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    const releases = await api(`/repos/${owner}/${repo}/releases`, githubToken);
    return Array.isArray(releases) ? releases : [];
}

export async function createRelease(githubToken: string, owner: string, repo: string, payload: ReleasePayload): Promise<any> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    return await api(`/repos/${owner}/${repo}/releases`, githubToken, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function uploadReleaseAsset(githubToken: string, uploadUrl: string, file: File): Promise<any> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');

    // The upload_url from GitHub already contains the template {?name,label}
    const url = uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(file.name)}`);
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Length': file.size.toString(),
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Gagal mengunggah aset rilis: ${errorBody.message}`);
    }
    return response.json();
}


'use server';

import { redirect } from 'next/navigation';

// Helper function to handle base64 encoding universally
function toBase64(string: string) {
    if (typeof btoa === 'function') {
        return btoa(string);
    }
    if (typeof Buffer === 'function') {
        return Buffer.from(string).toString('base64');
    }
    throw new Error("Tidak dapat menemukan fungsi encoding Base64 yang valid.");
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

export type Tag = {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
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
    name: string | null;
    body: string | null;
    html_url: string;
    published_at: string | null;
    author: {
        login: string;
        avatar_url: string;
    } | null;
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
  content: string; // Can be base64 or utf-8
};


// ==================================
// ACTION: SIGN OUT
// ==================================
export async function signOut() {
  return redirect('/');
}

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
// REPO, BRANCH & TAG ACTIONS
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

export async function fetchRepoTags(githubToken: string, owner: string, repo: string): Promise<Tag[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    try {
        const tags = await api(`/repos/${owner}/${repo}/tags`, githubToken);
        return tags || [];
    } catch (error: any) {
        if (error.message && (error.message.includes('Git Repository is empty') || error.message.includes('Not Found'))) return [];
        console.error("Gagal mengambil tags:", error);
        throw error;
    }
}


export async function fetchRepoContents(githubToken: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[] | string> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    try {
      const contents = await api(`/repos/${owner}/${repo}/contents/${path}`, githubToken);
      
      if (contents === null) return [];

      if (contents?.type === 'file' && typeof contents?.content === 'string' && contents.encoding === 'base64') {
          // Use Buffer on server, but it's better to avoid Buffer on client/edge
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

export async function createTagObject(githubToken: string, owner: string, repo: string, tagName: string, commitSha: string): Promise<any> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    
    // Create an annotated tag object
    const tagObject = await api(`/repos/${owner}/${repo}/git/tags`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
            tag: tagName,
            message: `Release ${tagName}`,
            object: commitSha,
            type: 'commit'
        }),
    });

    // Create a ref for the tag
    return await api(`/repos/${owner}/${repo}/git/refs`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/tags/${tagName}`,
            sha: tagObject.sha,
        }),
    });
}

// ==================================
// COMMIT ACTIONS
// ==================================
type CommitParams = {
  repoUrl: string; commitMessage: string; files: GitHubFile[]; githubToken: string; destinationPath?: string; branchName?: string;
};

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

async function initializeEmptyRepository(owner: string, repo: string, files: Array<{ path: string; content: string }>, token: string, commitMessage: string, branchToCreate: string): Promise<{ success: boolean; commitUrl: string }> {
    // This simplified approach uses the contents API for the very first commit, which is more robust for empty repos.
    // It creates one file to initialize, then the next commit can use the standard Git Data API.
    // Note: This creates one commit per file, which is a trade-off for robustness. A better approach for many files is to create one dummy file, then a second commit with all files.
    // For this app's use case, we will commit files one by one for initialization.

    const firstFile = files[0];
    const firstCommit = await api(`/repos/${owner}/${repo}/contents/${firstFile.path}`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: `init: ${commitMessage}`,
            content: firstFile.content,
            branch: branchToCreate
        })
    });
    
    // If there are more files, commit them in a second commit.
    if (files.length > 1) {
        const remainingFiles = files.slice(1);
        return await commitToExistingRepo(owner, repo, remainingFiles, token, branchToCreate, commitMessage);
    }

    return { success: true, commitUrl: firstCommit.commit.html_url };
}


export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath, branchName }: CommitParams) {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');
    if (!owner || !repo) throw new Error('Format URL repositori tidak valid.');

    // Ensure all content is base64
    const finalFiles = files.map(file => ({
      path: destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path,
      content: file.content // Assuming it's already base64 encoded from the client
    }));

    try {
        const repoInfo = await api(`/repos/${owner}/${repo}`, githubToken);
        const targetBranch = branchName || repoInfo.default_branch || 'main';
        
        // A simple check for an empty repository is its size.
        const repoIsEmpty = repoInfo.size === 0;
        
        if (repoIsEmpty) {
            // The contents API is more reliable for the very first commit.
            // We'll create the first file to initialize the repo and the branch.
            const firstFile = finalFiles[0];
            const result = await api(`/repos/${owner}/${repo}/contents/${firstFile.path}`, githubToken, {
                method: 'PUT',
                body: JSON.stringify({
                    message: commitMessage,
                    content: firstFile.content, // Content must be base64
                    branch: targetBranch,
                }),
            });

            // If there are more files, create a second commit with the rest.
            if (finalFiles.length > 1) {
                return await commitToExistingRepo(owner, repo, finalFiles.slice(1), githubToken, targetBranch, commitMessage);
            }
            return { success: true, commitUrl: result.commit.html_url };
        } else {
            return await commitToExistingRepo(owner, repo, finalFiles, githubToken, targetBranch, commitMessage);
        }
    } catch (error: any) {
        console.error('Gagal melakukan commit:', error);
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


'use server';

import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';

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
  content: string; // plain text content (will be encoded to base64 in the function)
};

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
};

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
  
    if (response.status === 404 || response.status === 409) {
      return null; 
    }
  
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error('GitHub API Error:', `[${options.method || 'GET'}] ${url}`, response.status, error);
      throw new Error(error.message || `Permintaan GitHub API ke ${url} gagal dengan status ${response.status}`);
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
        const refData = await api(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, token);
        
        return refData === null;
    } catch (error) {
        console.error("Error saat mendeteksi repositori kosong:", error);
        return true;
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

    const blobs = await Promise.all(
      files.map(async (file) => {
        const base64Content = Buffer.from(file.content).toString('base64');
        const blobData = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
            method: 'POST',
            body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
        });
        if (!blobData) throw new Error(`Gagal membuat blob untuk ${file.path}`);
        return { path: file.path, sha: blobData.sha, mode: '100644', type: 'blob' as const };
      })
    );

    const tree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ tree: blobs }),
    });
    if (!tree) throw new Error("Gagal membuat tree.");

    const commit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: [],
        }),
    });
    if (!commit) throw new Error("Gagal membuat commit.");

    const repoInfo = await api(`/repos/${owner}/${repo}`, token);
    const branchToCreate = repoInfo.default_branch || 'main';

    await api(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/heads/${branchToCreate}`,
            sha: commit.sha,
        }),
    });

    return { success: true, commitUrl: commit.html_url };
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
    if (!refData) {
        throw new Error(`Branch ${targetBranch} tidak ditemukan di repositori ${owner}/${repo}.`);
    }
    const latestCommitSha = refData.object.sha;

    const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    if (!latestCommitData) throw new Error("Gagal mendapatkan data commit terakhir.");
    const baseTreeSha = latestCommitData.tree.sha;

    const blobs = await Promise.all(
        files.map(async (file) => {
            const base64Content = Buffer.from(file.content).toString('base64');
            const blob = await api(`/repos/${owner}/${repo}/git/blobs`, token, {
                method: 'POST',
                body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
            });
            if (!blob) throw new Error(`Gagal membuat blob untuk ${file.path}`);
            return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' as const };
        })
    );

    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }),
    });
    if (!newTree) throw new Error("Gagal membuat tree baru.");

    const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] }),
    });
    if (!newCommit) throw new Error("Gagal membuat commit baru.");

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

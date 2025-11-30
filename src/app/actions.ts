
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
    size: number;
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
  content: string; // plain text content
};

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
};

// Generic GitHub API fetch function
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
        console.error(`URL: ${options.method || 'GET'} https://api.github.com${url}`);
        console.error(`STATUS: ${response.status} ${response.statusText}`);
        console.error('RESPONSE BODY:', errorBody);
        console.error('------------------------');
        throw new Error(errorBody.message || `GitHub API error: ${response.status}`);
    }
  
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
    }
    
    return response.json();
}

export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath, branchName }: CommitParams) {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');

    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) throw new Error('Format URL repositori tidak valid. Diharapkan "owner/repo".');
    const [owner, repo] = urlParts;

    console.log(`Memulai commit ke ${owner}/${repo}`);

    const finalFiles = files.map(file => {
      const finalPath = destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path;
      return { ...file, path: finalPath };
    });

    try {
        const repoData: Repo = await api(`/repos/${owner}/${repo}`, githubToken);
        const targetBranch = branchName || repoData.default_branch || 'main';
        const isRepoEmpty = repoData.size === 0;

        let parentCommitSha: string | null = null;

        if (!isRepoEmpty) {
            console.log('Repositori ada isinya. Mengambil commit terakhir...');
            try {
                const refData = await api(`/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`, githubToken);
                parentCommitSha = refData.object.sha;
            } catch (error: any) {
                 if (error.message.includes("Not Found")) {
                    console.warn(`Branch '${targetBranch}' tidak ditemukan. Akan membuat branch baru.`);
                 } else {
                    throw error;
                 }
            }
        } else {
            console.log('Repositori kosong. Membuat commit pertama.');
        }

        console.log(`Membuat ${finalFiles.length} blob secara paralel...`);
        const blobs = await Promise.all(
            finalFiles.map(async (file) => {
                const blob = await api(`/repos/${owner}/${repo}/git/blobs`, githubToken, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: Buffer.from(file.content, 'utf-8').toString('base64'),
                        encoding: 'base64'
                    }),
                });
                return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
            })
        );
        console.log('✓ Semua blob berhasil dibuat.');
        
        console.log('Membuat tree...');
        const tree = await api(`/repos/${owner}/${repo}/git/trees`, githubToken, {
            method: 'POST',
            body: JSON.stringify({
                tree: blobs,
                ...(parentCommitSha && { base_tree: (await api(`/repos/${owner}/${repo}/git/commits/${parentCommitSha}`, githubToken)).tree.sha })
            }),
        });
        console.log(`✓ Tree dibuat: ${tree.sha}`);
        
        console.log('Membuat commit...');
        const commit = await api(`/repos/${owner}/${repo}/git/commits`, githubToken, {
            method: 'POST',
            body: JSON.stringify({
                message: commitMessage,
                tree: tree.sha,
                parents: parentCommitSha ? [parentCommitSha] : [],
            }),
        });
        console.log(`✓ Commit dibuat: ${commit.sha}`);

        const refPath = `heads/${targetBranch}`;
        
        if (isRepoEmpty || !parentCommitSha) {
            console.log(`Membuat branch baru '${targetBranch}'...`);
             await api(`/repos/${owner}/${repo}/git/refs`, githubToken, {
                method: 'POST',
                body: JSON.stringify({
                    ref: `refs/${refPath}`,
                    sha: commit.sha,
                }),
            });
        } else {
            console.log(`Memperbarui branch '${targetBranch}'...`);
            await api(`/repos/${owner}/${repo}/git/refs/${refPath}`, githubToken, {
                method: 'PATCH',
                body: JSON.stringify({ sha: commit.sha, force: false }),
            });
        }
        
        console.log('✓ Commit berhasil!');

        return { success: true, commitUrl: commit.html_url };

    } catch (error: any) {
        console.error('Gagal melakukan commit ke GitHub:', error);
        throw new Error(error.message || 'Gagal melakukan commit file ke repositori.');
    }
}

export async function fetchUserRepos(githubToken: string, page: number = 1, perPage: number = 100): Promise<Repo[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    
    const repos = await api(`/user/repos?type=owner&sort=updated&per_page=${perPage}&page=${page}`, githubToken);
    
    if (!Array.isArray(repos)) return [];

    return repos.map((repo: any): Repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        owner: { login: repo.owner.login },
        default_branch: repo.default_branch,
        topics: repo.topics || [],
        size: repo.size,
    }));
}

export async function fetchRepoBranches(githubToken: string, owner: string, repo: string): Promise<Branch[]> {
    if (!githubToken) throw new Error('Token GitHub diperlukan.');
    try {
        const branches = await api(`/repos/${owner}/${repo}/branches`, githubToken);
        return branches || [];
    } catch (error: any) {
        if (error.message && (error.message.includes('Git Repository is empty'))) {
            return [];
        }
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

    
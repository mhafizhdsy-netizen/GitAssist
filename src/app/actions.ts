
'use server';

import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';

export async function signOut() {
  // This server action is now only responsible for redirection.
  // The client will handle the actual Firebase sign-out.
  return redirect('/');
}

type GitHubFile = {
  path: string;
  content: string; // base64 encoded content
};

type CommitParams = {
  repoUrl: string;
  commitMessage: string;
  files: GitHubFile[];
  githubToken: string;
  destinationPath?: string;
  branchName?: string;
};

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


async function api(url: string, token: string, options: RequestInit = {}, raw: boolean = false) {
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
    const error = await response.json();
    console.error('GitHub API Error:', error);
    // Khusus untuk kasus get ref, error 404 berarti repo kosong
    if (response.status === 404 && url.includes('/git/ref/')) {
        return null;
    }
    throw new Error(error.message || `Permintaan GitHub API ke ${url} gagal`);
  }
  // Check if the response is empty
  if (response.headers.get('Content-Length') === '0' || response.status === 204) {
    return null;
  }
  if (raw) {
    return response.text();
  }
  return response.json();
}

export async function fetchUserRepos(githubToken: string, page: number = 1, perPage: number = 9): Promise<Repo[]> {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }
    // Fetch all repos user has owner access to
    const repos = await api(`/user/repos?type=owner&sort=updated&per_page=100`, githubToken);
    
    if (!repos) return [];

    const paginatedRepos = repos.slice((page - 1) * perPage, page * perPage);

    return paginatedRepos.map((repo: any) => ({
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
        // If the repo is empty, it will throw a 404, which api() will throw
        // We catch it and return an empty array.
        if (error.message.includes('Git Repository is empty')) {
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
    const contents = await api(`/repos/${owner}/${repo}/contents/${path}`, githubToken);
    
    if (typeof contents?.content === 'string' && contents.encoding === 'base64') {
        return Buffer.from(contents.content, 'base64').toString('utf-8');
    }

    if (!Array.isArray(contents)) return [];
    
    // Sort contents so directories come first
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

  try {
    // Branch name defaults to 'main' for initial commits or if not provided.
    const targetBranch = branchName || 'main';
    const refPath = `heads/${targetBranch}`;

    // Get the latest ref for the branch. This will return null (404) if the branch doesn't exist.
    const latestRef = await api(`/repos/${owner}/${repo}/git/ref/${refPath}`, githubToken).catch(err => {
        // If the error is "Not Found", it means the repo or branch is new.
        if (err.message === "Not Found" || err.message.includes("Git Repository is empty")) return null;
        throw err;
    });

    const fileBlobs = await Promise.all(
      files.map(async (file) => {
        const blob = await api(`/repos/${owner}/${repo}/git/blobs`, githubToken, {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: 'base64',
          }),
        });

        const finalPath = destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path;

        return {
          path: finalPath,
          sha: blob.sha,
          mode: '100644',
          type: 'blob',
        };
      })
    );

    let newCommit;

    if (latestRef && latestRef.object) {
      // Repositori/branch sudah ada isinya
      const latestCommitSha = latestRef.object.sha;
      const latestCommitData = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, githubToken);
      const baseTreeSha = latestCommitData.tree.sha;

      const newTree = await api(`/repos/${owner}/${repo}/git/trees`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: fileBlobs,
        }),
      });

      newCommit = await api(`/repos/${owner}/${repo}/git/commits`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
          message: commitMessage,
          tree: newTree.sha,
          parents: [latestCommitSha],
        }),
      });

      // Update existing branch ref
      await api(`/repos/${owner}/${repo}/git/refs/${refPath}`, githubToken, {
        method: 'PATCH',
        body: JSON.stringify({
          sha: newCommit.sha,
        }),
      });

    } else {
      // Repositori kosong atau branch baru (initial commit)
      const newTree = await api(`/repos/${owner}/${repo}/git/trees`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
          tree: fileBlobs,
        }),
      });

      newCommit = await api(`/repos/${owner}/${repo}/git/commits`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
          message: commitMessage,
          tree: newTree.sha,
          parents: [],
        }),
      });

      // Create new branch ref
      await api(`/repos/${owner}/${repo}/git/refs`, githubToken, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/${refPath}`,
          sha: newCommit.sha,
        }),
      });
    }

    return { success: true, commitUrl: newCommit.html_url };
  } catch (error: any) {
    console.error('Gagal melakukan commit ke GitHub:', error);
    throw new Error(error.message || 'Gagal melakukan commit file ke repositori.');
  }
}


'use server';

import { getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { redirect } from 'next/navigation';
import { firebaseConfig } from '@/firebase/config';
import { Buffer } from 'buffer';

function getFirebaseAuth() {
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return getAuth(app);
}

export async function signOut() {
  const auth = getFirebaseAuth();
  await auth.signOut();
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
    const repos = await api(`/user/repos?type=owner&sort=updated&per_page=${perPage}&page=${page}`, githubToken);
    
    if (!repos) return [];

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
        }
    }));
}


export async function fetchRepoContents(githubToken: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[] | string> {
    if (!githubToken) {
        throw new Error('Token GitHub diperlukan.');
    }
    const contents = await api(`/repos/${owner}/${repo}/contents/${path}`, githubToken);
    
    if (typeof contents.content === 'string' && contents.encoding === 'base64') {
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



export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath }: CommitParams) {
  if (!githubToken) {
    throw new Error('Token GitHub diperlukan.');
  }

  const urlParts = repoUrl.replace('https://github.com/', '').split('/');
  if (urlParts.length < 2) {
    throw new Error('Format URL repositori tidak valid. Diharapkan "owner/repo".');
  }
  const [owner, repo] = urlParts;

  try {
    const repoData = await api(`/repos/${owner}/${repo}`, githubToken);
    const defaultBranch = repoData.default_branch;

    const branchData = await api(`/repos/${owner}/${repo}/branches/${defaultBranch}`, githubToken);
    const latestCommitSha = branchData.commit.sha;

    const fileBlobs = await Promise.all(
      files.map(async (file) => {
        const blob = await api(`/repos/${owner}/${repo}/git/blobs`, githubToken, {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: 'base64',
          }),
        });

        // Prepend destination path if provided
        const finalPath = destinationPath ? `${destinationPath.replace(/^\/|\/$/g, '')}/${file.path}` : file.path;

        return {
          path: finalPath,
          sha: blob.sha,
          mode: '100644', // file mode
          type: 'blob',
        };
      })
    );

    const newTree = await api(`/repos/${owner}/${repo}/git/trees?recursive=1`, githubToken, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: fileBlobs,
      }),
    });

    const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, githubToken, {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await api(`/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`, githubToken, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    });

    return { success: true, commitUrl: newCommit.html_url };
  } catch (error: any) {
    console.error('Gagal melakukan commit ke GitHub:', error);
    throw new Error(error.message || 'Gagal melakukan commit file ke repositori.');
  }
}

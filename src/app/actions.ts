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

type Repo = {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
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
  if (!response.ok) {
    const error = await response.json();
    console.error('GitHub API Error:', error);
    throw new Error(error.message || `GitHub API request to ${url} failed`);
  }
  return response.json();
}

export async function fetchUserRepos(githubToken: string): Promise<Repo[]> {
    if (!githubToken) {
        throw new Error('GitHub token is required.');
    }
    // Fetch repos user has access to, including private ones
    const repos = await api('/user/repos?type=owner&sort=updated&per_page=100', githubToken);
    return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
    }));
}


export async function commitToRepo({ repoUrl, commitMessage, files, githubToken, destinationPath }: CommitParams) {
  if (!githubToken) {
    throw new Error('GitHub token is required.');
  }

  const urlParts = repoUrl.replace('https://github.com/', '').split('/');
  if (urlParts.length < 2) {
    throw new Error('Invalid repository URL format. Expected "owner/repo".');
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

    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, githubToken, {
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
    console.error('Failed to commit to GitHub:', error);
    throw new Error(error.message || 'Failed to commit files to the repository.');
  }
}

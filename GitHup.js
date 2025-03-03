import axios from "axios";

import fs from "fs";
import { execSync } from "child_process";



const GITHUB_API_URL = "https://api.github.com";

const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error(`
❌ GitHub token not found. Please set the GITHUB_TOKEN environment variable.

To set the token:
1. Generate a token from https://github.com/settings/tokens.
2. Set it as an environment variable:
   - On Linux/macOS: export GITHUB_TOKEN="your-token"
   - On Windows: set GITHUB_TOKEN="your-token"
`);
  process.exit(1);
}

const api = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});
export async function getGitHubUsername() {
  try {
    const response = await api.get("/user");
    return response.data.login; // GitHub username
  } catch (err) {
    console.error("❌ Error fetching GitHub username:", err.message);
    return null;
  }
}


export async function listRepos() {
  try {
    const response = await api.get("/user/repos");
    return response.data;
  } catch (err) {
    console.error("❌ Error fetching repositories:", err.response?.data || err.message);
    return [];
  }
}

export async function createRepo(repoName, description, isPrivate) {
  try {
    console.log("🚀 Creating repository on GitHub...");
    const response = await api.post("/user/repos", {
      name: repoName,
      description: description,
      private: isPrivate,
    });

    const repoUrl = response.data.clone_url;
    console.log(`🎉 Repository "${repoName}" created: ${repoUrl}`);

    // ✅ Ensure we are in the correct directory
    const currentDir = process.cwd();
    console.log(`📂 Current working directory: ${currentDir}`);

    // ✅ Initialize Git if not already initialized
    if (!fs.existsSync(".git")) {
      console.log("🔧 Initializing Git...");
      execSync("git init", { stdio: "inherit" });
    }

    // ✅ Setup .gitignore to exclude sensitive files
    const gitignoreContent = `.env\nnode_modules\n.DS_Store\n`;
    if (!fs.existsSync(".gitignore")) {
      fs.writeFileSync(".gitignore", gitignoreContent);
    }
    // ✅ Create README.md if not present
    if (!fs.existsSync("README.md")) {
      fs.writeFileSync(
        "README.md",
        `# ${repoName}\n\n${ "Created with GitHub CLI 🚀"}`
      );
    }

    // ✅ Fix line endings issue (force Git to use LF)
    execSync("git config core.autocrlf input", { stdio: "inherit" });

    // ✅ Set up remote origin (force update if already exists)
    console.log("🔗 Connecting to GitHub...");
    try {
      execSync("git remote remove origin", { stdio: "inherit" }); // Remove existing origin if any
    } catch (e) {}
    execSync(`git remote add origin ${repoUrl}`, { stdio: "inherit" });

    // ✅ Add all files and commit
    console.log("📂 Adding files to Git...");
    execSync("git add .", { stdio: "inherit" });

    console.log("📝 Committing files...");
    execSync('git commit -m "Initial commit from GitHub CLI"', {
      stdio: "inherit",
    });

    // ✅ Push to GitHub
    console.log("🚀 Pushing code to GitHub...");
    execSync("git branch -M main", { stdio: "inherit" });
    execSync("git push -u origin main", { stdio: "inherit" });

    console.log("✅ Successfully pushed all files to GitHub!");
    return response.data;
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);

    // Handle GitHub Push Protection errors
    if (err.message.includes("push declined due to repository rule violations")) {
      console.error(
        "🔒 GitHub Push Protection blocked the push because sensitive data was detected."
      );
      console.error(
        "👉 Remove the sensitive data (e.g., .env file) and try again."
      );
    }

    return null;
  }
}



export async function deleteRepo(repoName) {
  try {
    const username = await getGitHubUsername(); // Get the authenticated user’s GitHub username dynamically
    console.log(`🗑️ Attempting to delete repository: ${username}/${repoName.trim()}...`);

    const response = await api.delete(`/repos/${username}/${repoName.trim()}`);

    return response.data; // Return the response so it's not empty
  } catch (err) {
    console.error("❌ Error deleting repository:", err.response?.data || err.message);
    throw new Error("Repository deletion failed"); // Throw an error instead of returning null
  }
}


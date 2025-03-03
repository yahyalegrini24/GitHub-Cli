#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { listRepos, createRepo,deleteRepo} from "./GitHup.js";
import {generateAIReadme} from './aiUtils.js'


// Define color styles
const success = chalk.green.bold;
const error = chalk.red.bold;
const warning = chalk.yellow.bold;
const info = chalk.blue.bold;
const highlight = chalk.cyan.underline;

// CLI Header Function
function showHeader() {
  console.clear();
  console.log(
    chalk.blue.bold(`
    ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗      
   ██╔═══██╗██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗     
   ██║   ██║██║   ██║   ███████║██║   ██║██████╔╝     
   ██║   ██║██║   ██║   ██╔══██║██║   ██║██╔═══╝      
   ╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██║          
    ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝          
     ██████╗ ██████╗ ██╗     ██╗                      
     ██╔══██╗██╔══██╗██║     ██║                      
     ██████╔╝██████╔╝██║     ██║                      
     ██╔═══╝ ██╔═══╝ ██║     ██║                      
     ██║     ██║     ███████╗███████╗                 
     ╚═╝     ╚═╝     ╚══════╝╚══════╝                 
   `)
  );
  console.log(highlight("🚀 Welcome to GitHub CLI - Manage your repositories easily!\n"));
}

// Main Menu Function
async function mainMenu() {
  while (true) {
    showHeader();

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "📌 What do you want to do?",
        loop: false, // ❗ Prevents navigation beyond last option ❗
        choices: [
          "📜 List Repositories",
          "📂 Create a Repository and Push this Project",
          "🗑 Delete a Repository",
          "📝 Generate README with AI",
          "❌ Exit"
        ]
      }
    ]);

    showHeader();

    switch (action) {
      case "📜 List Repositories":
        const repos = await listRepos();
        if (repos.length > 0) {
          console.log(success("✔ Your Repositories:"));
          repos.forEach((repo, index) => {
          console.log(chalk.yellow(`${index + 1}. ${repo.name}`));
          console.log(chalk.cyan.bold(`📌 ${index + 1}. ${repo.name}`));
          console.log(chalk.gray(`   📝 Description: ${repo.description || "No description available"}`));
          console.log(chalk.magenta(`   🔒 Visibility: ${repo.private ? "Private" : "Public"}`));
          console.log(chalk.blue(`   🌿 Default Branch: ${repo.default_branch}`));
          console.log(chalk.yellow(`   📅 Last Updated: ${new Date(repo.updated_at).toLocaleString()}`));
          console.log(chalk.green(`   🔗 Clone URL: ${repo.clone_url}`));
          console.log(chalk.gray("--------------------------------------------------"));
          }
        );
        } else {
          console.log(error("❌ No repositories found."));
        }
        break;

      case "📂 Create a Repository and Push this Project":
       const repoInput = await inquirer.prompt([
           {
               type: "input",
               name: "repoName",
               message: "📛 Enter the repository name:",
               validate: (input) => input.trim() !== "" || "Repository name cannot be empty!",
           },
           {
               type: "input",
               name: "description",
               message: "📝 Enter a description (optional):",
           },
           {
               type: "confirm",
               name: "isPrivate",
               message: "🔒 Do you want this repository to be private?",
               default: false,
           },
       ]);
   
       const { repoName, description, isPrivate } = repoInput;
   
       console.log(success(`✔ Creating GitHub repository: ${chalk.yellow(repoName)}...`));
   
       const newRepo = await createRepo(repoName, description, isPrivate);
   
       if (newRepo) {
           console.log(success(`🎉 Repository "${newRepo.name}" created and pushed successfully!`));
           console.log(chalk.green(`🔗 URL: ${newRepo.html_url}`));
       } else {
           console.log(error("❌ Failed to create the repository."));
       }
   
       await inquirer.prompt([{ type: "input", name: "continue", message: "Press Enter to go back to the menu..." }]);
       break;


       case "🗑 Delete a Repository":
        const { repoNameToDelete } = await inquirer.prompt([
          {
            type: "input",
            name: "repoNameToDelete",
            message: "📛 Enter the repository name to delete:",
            validate: (input) => input.trim() !== "" || "Repository name cannot be empty!",
          },
        ]);
      
        const { confirmDelete } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmDelete",
            message: `⚠️ Are you sure you want to delete "${repoNameToDelete}"? This action is irreversible!`,
            default: false,
          },
        ]);
      
        if (!confirmDelete) {
          console.log(chalk.yellow("🚫 Deletion canceled."));
          break;
        }
      
        try {
          console.log(`🗑 Deleting repository "${repoNameToDelete}"...`);
          const result = await deleteRepo(repoNameToDelete); // Now properly returns or throws an error
          console.log(success(`✅ Repository "${repoNameToDelete}" deleted successfully!`));
        } catch (error) {
          console.log(error("❌ Failed to delete the repository."));
        }
        break;

      case "📝 Generate README with AI":
        await generateAIReadme();       
         break;

      case "❌ Exit":
        console.log(info("👋 Goodbye!"));
        process.exit(0);
    }

    // Wait for user to press Enter before returning to menu
    await inquirer.prompt([{ type: "input", name: "continue", message: "Press Enter to go back to the menu..." }]);
  }
}

// Start the interactive CLI
mainMenu();

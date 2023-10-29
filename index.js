const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('octokit');

try {
  const octokit = new Octokit({ 
    auth: process.env.token,
  });

  const imageName = core.getInput('image_name');
  console.log(`Image name is: ${imageName}`);

  const imageVersion = core.getInput('image_version');
  console.log(`Image version is: ${imageVersion}`);

  const artifactoryPath = core.getInput('artifactory_path');
  console.log(`Artifactory path is: ${artifactoryPath}`);
}catch{
    core.setFailed(error.message);
    octokit.setFailed(error.message);
}
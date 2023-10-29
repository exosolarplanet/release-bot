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

  const payloadJson = github.context.payload;
  const repoName = payloadJson.repository.name;

  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);

  const ref = octokit.rest.git.getRef({
    owner: 'exosolarplanet',
    repo: repoName,
    ref: 'heads/main'
  });

  console.log(ref);

//   octokit.rest.git.createRef({
//     owner: 'exosolarplanet',
//     repo: repoName,
//     ref: 'refs/heads/pr-branch',


//   })

}catch{
    core.setFailed(error.message);
    octokit.setFailed(error.message);
}
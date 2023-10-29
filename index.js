const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('octokit');

async function createPr() {
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
    //   console.log(`The event payload: ${payload}`);

    const response = octokit.request('GET /repos/{owner}/{repo}/git/refs/{ref}', {
        owner: 'exosolarplanet',
        repo: repoName,
        ref: 'heads/main'
    }).then()

    const sha = (await response).data.object.sha;
    console.log(`SHA is: ${sha}`);

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: 'exosolarplanet',
        repo: repoName,
        ref: 'refs/heads/pr-branch',
        sha: sha,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

    }catch{
        core.setFailed(error.message);
        octokit.setFailed(error.message);
    }
}

createPr();
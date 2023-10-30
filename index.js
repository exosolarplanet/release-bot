const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('octokit');
const YAML = require('yaml');

async function createBranch() {
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
    console.log(`Repository name is: ${repoName}`);

    const response = octokit.request('GET /repos/{owner}/{repo}/git/refs/{ref}', {
        owner: 'exosolarplanet',
        repo: repoName,
        ref: 'heads/main'
    });

    const sha = (await response).data.object.sha;
    console.log(`SHA is: ${sha}`);

    // const createBranch = octokit.request('POST /repos/{owner}/{repo}/git/refs', {
    //     owner: 'exosolarplanet',
    //     repo: repoName,
    //     ref: 'refs/heads/pr-branch',
    //     sha: sha,
    //     headers: {
    //       'X-GitHub-Api-Version': '2022-11-28'
    //     }
    // });

    // const newBranch = (await createBranch).data;
    // console.log(newBranch);
    let content = '';
    await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'exosolarplanet',
        repo: repoName,
        path: 'helm/Chart.yaml',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    .then(result => {
        content = Buffer.from(result.data.content, 'base64').toString()
      });

    const contentYaml = YAML.parse(content);
    const dependencies = contentYaml.dependencies;
    const dependenciesLength = dependencies.length;
    
    dependencies.forEach(iterate);

    function iterate(value){
        if(value.name == imageName){
        console.log(imageName);
        }
    }
    
}

createBranch();

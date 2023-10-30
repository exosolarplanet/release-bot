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
    let fileSHA = '';
    await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'exosolarplanet',
        repo: repoName,
        path: 'helm/Chart.yaml',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        ref: 'pr-branch'
      })
    .then(result => {
        content = Buffer.from(result.data.content, 'base64').toString()
        fileSHA = result.data.sha;
        console.log(`Chart file SHA: ${fileSHA}`);
      });

    const contentYaml = YAML.parse(content);
    const dependencies = contentYaml.dependencies;
    
    dependencies.forEach(iterate);

    function iterate(value){
        if(value.name == imageName){
            value.version = imageVersion;
            console.log(contentYaml);
        } // add else here to add a new entry to dependencies if the image doesn't exist
    }

    const updatedContent = Buffer.from(YAML.stringify(contentYaml)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: 'exosolarplanet',
        repo: repoName,
        path: 'helm/Chart.yaml',
        message: 'Update Chart dependencies',
        committer: {
          name: 'exosolarplanet',
          email: 'ecedenniz@gmail.com'
        },
        content: updatedContent, // need to convert to base64
        sha: fileSHA,
        branch: 'pr-branch',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner: 'exosolarplanet',
        repo: repoName,
        title: 'Amazing new feature',
        body: 'Please pull these awesome changes in!',
        head: 'exosolarplanet:pr-branch',
        base: 'main',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    
}

createBranch();

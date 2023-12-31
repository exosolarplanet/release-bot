const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('octokit');
const YAML = require('yaml');

async function main() {
    const octokit = new Octokit({ 
        auth: process.env.token,
    });

    const user = 'exosolarplanet';
    const branch = 'pr-branch';

    const imageName = core.getInput('image_name');
    console.log(`Image name is: ${imageName}`);

    const imageVersion = core.getInput('image_version');
    console.log(`Image version is: ${imageVersion}`);

    const artifactoryPath = core.getInput('artifactory_path');
    console.log(`Artifactory path is: ${artifactoryPath}`);

    const payloadJson = github.context.payload;
    const repoName = payloadJson.repository.name;
    console.log(`Repository name is: ${repoName}`);
    
    let sha = '';
    await octokit.request('GET /repos/{owner}/{repo}/git/refs/{ref}', {
        owner: user,
        repo: repoName,
        ref: 'heads/main'
    }).then(result => {
        sha = result.data.object.sha;
        console.log(`SHA is: ${sha}`);
    });

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: user,
        repo: repoName,
        ref: `refs/heads/${branch}`,
        sha: sha,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    }).then(
        console.log(`Created branch ${branch}`)
    ); 

    let content = '';
    let fileSHA = '';
    await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: user,
        repo: repoName,
        path: 'helm/Chart.yaml',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        ref: branch
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
    };

    const updatedContent = Buffer.from(YAML.stringify(contentYaml)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: user,
        repo: repoName,
        path: 'helm/Chart.yaml',
        message: 'Update Chart dependencies',
        committer: {
          name: user,
          email: 'ecedenniz@gmail.com'
        },
        content: updatedContent, // need to convert to base64
        sha: fileSHA,
        branch: branch,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

    let prNumber = '';
    await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner: user,
        repo: repoName,
        title: 'Amazing new feature',
        body: 'Please pull these awesome changes in!',
        head: 'exosolarplanet:pr-branch',
        base: 'main',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
        }).then(result => {
        prNumber = result.data.number;
        console.log(prNumber);
    });

    await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
        owner: user,
        repo: repoName,
        pull_number: prNumber,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

}

main();

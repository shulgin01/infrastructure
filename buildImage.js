const fetch = require("node-fetch");
const github = require('@actions/github');
const exec = require('@actions/exec');

require("dotenv").config();

const { ISSUE_ID, OAUTH_TOKEN, CLIENT_ID, TRACKER_HOST} = process.env;

const headers = {
    Authorization: `OAuth ${OAUTH_TOKEN}`,
    "X-Org-ID": CLIENT_ID,
}

const buildImage = async () => {
    const currentTag = github.context.payload.ref.replace("refs/tags/", "") ?? ""
    console.log(`Tag ${currentTag}`)

    await exec.exec('docker', ['build', '-t', `app:${currentTag}`, '.']);
    console.info("Image build");

    await fetch(`${TRACKER_HOST}/v2/issues/${ISSUE_ID}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            text: `Собрали образ с тегом ${currentTag}`
        })
    });
    console.info("Comment added");
}

buildImage().then(() => console.log("Success build image"))
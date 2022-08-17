const fetch = require("node-fetch");
const github = require('@actions/github');
const exec = require('@actions/exec');

require("dotenv").config();

const { ISSUE_ID, OAUTH_TOKEN, CLIENT_ID, TRACKER_HOST} = process.env;

const headers = {
    Authorization: `OAuth ${OAUTH_TOKEN}`,
    "X-Org-ID": CLIENT_ID,
}

const release = async () => {
    const currentTag = getTag()
    const commits = await getCommits('rc-0.0.1')
    const pusher = getPusher()
    const date = getDate()
    await fetch(`${TRACKER_HOST}/v2/issues/${ISSUE_ID}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            summary: "Тестирование summary",
            description: "Описание"
        })
    })
}

const getTag = () => github.context.payload.ref.replace("refs/tags/", "") ?? ""

const getPusher = () => github.context.payload.pusher?.name ?? ""

const getDate = () => new Date().toLocaleDateString()

const getCommits = async (tag) => {
    const tags = await getTags()
    const currentIndex = tags.indexOf(tag)
    const commitsFilter = tags.length === 1 ? tag : `${tag}...${tags[currentIndex - 1]}`;
    const releaseCommits = await execute('git', ['log', '--pretty=format:"%H %an %s"', commitsFilter]);
    return releaseCommits.replace(/"/g, "");
}

const getTags = async () => {
    return (await execute('git', ['tag'])).split("\n").filter(Boolean);
}

const execute = async (command, args) => {
    let output = ""
    let error = ""

    const options = {};
    options.listeners = {
        stdout: (data) => {
            output += data.toString();
        },
        stderr: (data) => {
            error += data.toString();
        }
    };

    await exec.exec(command, args, options)

    if (error){
        throw new Error(`Unable to execute ${command}`)
    }
    return output
}

release().then(() => console.log("Success"))
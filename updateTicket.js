const fetch = require("node-fetch");
const github = require('@actions/github');
const exec = require('@actions/exec');

require("dotenv").config();

const { ISSUE_ID, OAUTH_TOKEN, CLIENT_ID, TRACKER_HOST} = process.env;

const headers = {
    Authorization: `OAuth ${OAUTH_TOKEN}`,
    "X-Org-ID": CLIENT_ID,
}

const updateTicket = async () => {
    const currentTag = github.context.payload.ref.replace("refs/tags/", "") ?? ""
    const commits = await getCommits(currentTag)

    const pusher = github.context.payload.pusher?.name ?? ""
    const date = new Date().toLocaleDateString()

    const summary = `Релиз №${currentTag.replace("rc-", "")} от ${date}`;
    const description = `Ответственный за релиз: ${pusher}\n---\nКоммиты, попавшие в релиз:\n${commits}`;

    await fetch(`${TRACKER_HOST}/v2/issues/${ISSUE_ID}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            summary,
            description
        })
    })
}

const getCommits = async (tag) => {
    const tags = await getTags()
    const currentIndex = tags.indexOf(tag)
    const commitsFilter = tags.length === 1 ? tag : `${tags[currentIndex - 1]}...${tag}`;
    const releaseCommits = await execute('git', ['log', '--pretty=format:"%H %an %s"', commitsFilter]);
    return releaseCommits.replace(/"/g, "");
}

const getTags = async () => {
    return (await execute('git', ['tag'])).split("\n")
        .filter(Boolean)
        .sort((a, b) => {
            const aVal = parseInt(a.replace("rc-0.0.", ""), 10);
            const bVal = parseInt(b.replace("rc-0.0.", ""), 10);
            return aVal - bVal;
        });
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

updateTicket().then(() => console.log("Success update ticket"))
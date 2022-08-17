const github = require('@actions/github');
const exec = require('@actions/exec');

const release = async () => {
    const currentTag = getTag()
    console.log(currentTag)
    const commits = await getCommits('rc-0.0.1')
    console.log(commits)
}

const getTag = () => github.context.payload.ref.replace("refs/tags/", "") ?? ""

const getCommits = async (tag) => {
    const tags = await getTags()
    const currentIndex = tags.indexOf(tag)
    const commitsFilter = tags.length === 1 ? tag : `${tag}...${tags[currentIndex - 1]}`;
    const releaseCommits = await execute('git', ['log', '--pretty=format:"%H %an %s"', commitsFilter]);
    return releaseCommits.replace(/"/g, "");
}

const getTags = async () => {
    return (await execute('git', ['tag'])).split('\n').filter(Boolean)
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
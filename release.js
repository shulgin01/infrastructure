const github = require('@actions/github');

console.log('RELEASE')
const release = async () => {
    let currentTag = github.context.payload.ref
    console.info(currentTag)
}

release().then(() => "Success")
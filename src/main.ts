import * as ghCore from "@actions/core";
import {Octokit} from '@octokit/rest'

const filePath = ghCore.getInput("file-path");
const githubToken = ghCore.getInput("github-token");
const githubOwner = ghCore.getInput("github-owner");
const githubRepo = ghCore.getInput("github-repo");
const shaBase = ghCore.getInput("sha-base");
const shaHead = ghCore.getInput("sha-head");
const langs = ghCore.getInput("file-langs");

const LANG_ISO_PLACEHOLDER = "%LANG_ISO%";

function getPattern(format: string) {
    if (format === 'po') {
        return /msgid "(.*)".*\n\-msgstr ".*".*\n\+msgstr.""\n( |\+)\n/
    }
    return null
}

async function run() {
    try { 
        const gitHub = await new Octokit({
            auth: githubToken
        })

        const commitDiff = await gitHub.repos.compareCommits({
            owner: githubOwner,
            repo: githubRepo,
            base: shaBase,
            head: shaHead
        })

        const parsedLangs = JSON.parse(langs)
        const langFiles = parsedLangs.map((lang: string) => filePath.replace(LANG_ISO_PLACEHOLDER, lang))

        function getMessages(source: string): string[] {
            const pattern = getPattern(filePath?.split('.').reverse()[0])

            if (pattern) {
                console.log(source)
                const rex = pattern
                const re = new RegExp(rex, 'g')
                const extract = source.match(re)
                return extract
                    ?.map((text: string) => {
                        const matches = text.match(rex)
                        return matches ? matches[1] : ''
                    })
                    ?.filter((text: string) => Boolean(text)) || []
            }

            return []

        }
        if (commitDiff) {
            const listOfMessages = commitDiff?.data?.files
                ?.filter((fileData) => langFiles.includes(fileData.filename))
                ?.map((fileData) => getMessages(fileData?.patch || ''))
                
            const haveMessagesWithDeletedTranslations = listOfMessages?.some((messages) => messages?.length > 0)

            if (haveMessagesWithDeletedTranslations) {
                throw new Error('You have deleted translations for: ' + listOfMessages?.filter((messages) => messages?.length > 0)?.join(','))
            }
        }
        console.log('None of the translation have been removed') 
    } catch (e: any) {
        const errorMessage = `${e.name} ${e.message}`
        console.error(`${e.stack}`)
        ghCore.setFailed(errorMessage)
    } 
}

run()
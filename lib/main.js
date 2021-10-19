"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ghCore = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const filePath = ghCore.getInput("file-path");
const githubToken = ghCore.getInput("github-token");
const githubOwner = ghCore.getInput("github-owner");
const githubRepo = ghCore.getInput("github-repo");
const shaBase = ghCore.getInput("sha-base");
const shaHead = ghCore.getInput("sha-head");
const langs = ghCore.getInput("file-langs");
const LANG_ISO_PLACEHOLDER = "%LANG_ISO%";
function getPattern(format) {
    if (format === 'po') {
        return /msgid "([\w ]*)".*\n\-msgstr "[\w ]*".*\n\+msgstr.""/;
    }
    return null;
}
function run() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const gitHub = yield new rest_1.Octokit({
                auth: githubToken
            });
            const commitDiff = yield gitHub.repos.compareCommits({
                owner: githubOwner,
                repo: githubRepo,
                base: shaBase,
                head: shaHead
            });
            const parsedLangs = JSON.parse(langs);
            const langFiles = parsedLangs.map((lang) => filePath.replace(LANG_ISO_PLACEHOLDER, lang));
            function getMessages(source) {
                var _a;
                const pattern = getPattern(filePath === null || filePath === void 0 ? void 0 : filePath.split('.').reverse()[0]);
                if (pattern) {
                    const rex = pattern;
                    const re = new RegExp(rex, 'g');
                    const extract = source.match(re);
                    return ((_a = extract === null || extract === void 0 ? void 0 : extract.map((text) => {
                        const matches = text.match(rex);
                        return matches ? matches[0] : '';
                    })) === null || _a === void 0 ? void 0 : _a.filter((text) => Boolean(text))) || [];
                }
                return [];
            }
            if (commitDiff) {
                console.log(langFiles);
                const haveMessagesWithDeletedTranslations = (_b = (_a = commitDiff === null || commitDiff === void 0 ? void 0 : commitDiff.data) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b.filter((fileData) => langFiles.includes(fileData.filename));
                const haveMessagesWithDeletedTranslations1 = haveMessagesWithDeletedTranslations === null || haveMessagesWithDeletedTranslations === void 0 ? void 0 : haveMessagesWithDeletedTranslations.map((fileData) => getMessages((fileData === null || fileData === void 0 ? void 0 : fileData.patch) || ''));
                const haveMessagesWithDeletedTranslations2 = haveMessagesWithDeletedTranslations1 === null || haveMessagesWithDeletedTranslations1 === void 0 ? void 0 : haveMessagesWithDeletedTranslations1.some((messages) => (messages === null || messages === void 0 ? void 0 : messages.length) > 0);
                console.log('DATA');
                console.log(haveMessagesWithDeletedTranslations);
                console.log(haveMessagesWithDeletedTranslations1);
                console.log(haveMessagesWithDeletedTranslations2);
                if (haveMessagesWithDeletedTranslations2) {
                    throw new Error('You have deleted translations');
                }
            }
            console.log('None of the translation have been removed');
        }
        catch (e) {
            const errorMessage = `${e.name} ${e.message}`;
            console.error(`${errorMessage} ${e.stack}`);
            ghCore.setFailed(errorMessage);
        }
    });
}
run();

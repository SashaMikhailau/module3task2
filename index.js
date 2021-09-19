const {fromIni} = require("@aws-sdk/credential-provider-ini");
const {S3Client, GetObjectCommand, ListObjectVersionsCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');

const PROFILE = 'full-access-s3';
const BUCKET_NAME = 'aliaksandr-mikhailau-task2';
const REGION = 'us-east-1';

const s3Client = new S3Client({
  credentials: fromIni({profile: PROFILE}),
  region: REGION
});

const BUCKET_PARAMS = {
    Bucket: BUCKET_NAME,
};

const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      });

const getLatestVersion = async (fileName, date) => {
    const versionCommand = new ListObjectVersionsCommand({... BUCKET_PARAMS, Prefix: fileName})
    const versions = await s3Client.send(versionCommand);
    console.log(versions);
    const latestVersion = versions && versions.Versions 
        && versions.Versions.filter(version => version.LastModified < date)
        .sort((v1, v2) => v2.LastModified - v1.LastModified)[0];
    console.log(latestVersion);
    return latestVersion && latestVersion.VersionId;
}

const downloadFile = async (fileName, versionId) => {
    const getCommand = new GetObjectCommand(
        {
            ... BUCKET_PARAMS,
            Key: fileName,
            VersionId: versionId
    });
    const response = await s3Client.send(getCommand);

    const body = await streamToString(response.Body);
    fs.writeFileSync(fileName, body)
    console.log(`File ${fileName} downloaded successfully`)
}

const run = async (fileName, date) => {
    const latestVersion = await getLatestVersion(fileName, date);
    if(latestVersion){
        downloadFile(fileName, latestVersion);
    } else{
        console.log(`There is no version later then ${date} for file ${fileName}`);
    }
    
}

run('test1.txt', new Date('2021-09-19T15:51:00'));




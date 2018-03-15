/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const PATH_TO_KEY = process.env.PATH_TO_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME;
const COMMIT_HASH = process.env.COMMIT_HASH;
const DIR = './test/screenshot';

const Storage = require('@google-cloud/storage');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const storage = new Storage({
  keyFilename: PATH_TO_KEY,
});

const bucket = storage.bucket(BUCKET_NAME);

const screenshotFilenames = glob.sync(`${DIR}/**/*.png`);

const files = screenshotFilenames.map((fileName) => {
  return {
    originalName: path.resolve(fileName),
    targetName: fileName.replace(DIR, COMMIT_HASH),
  };
});

files.forEach((file) => {
  const bucketFile = bucket.file(file.targetName);
  bucketFile.makePublic().then(() => {
    console.log('→ Uploading', file.originalName);
    fs.createReadStream(file.originalName)
      .pipe(bucketFile.createWriteStream())
      .on('error', (err) => {
        console.error(err);
      }).on('finish', () => {
        console.log('✔︎ Done uploading', file.originalName);
      });
  }).catch((err) => {
    console.error(err);
  });
});

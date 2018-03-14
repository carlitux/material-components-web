import puppeteer from 'puppeteer';
import compareImages from 'resemblejs/compareImages';
import {promisify} from 'util';
import {readFile, writeFile} from 'fs';
import {assert} from 'chai';

const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

export default class Screenshot {
  constructor(urlPath, imagePath, diffPath) {
    this.urlPath_ = urlPath;
    this.imagePath_ = imagePath;
    this.diffPath_ = diffPath;
    // TODO allow clients to specify capture-chrome options, like viewport size
  }

  capture() {
    test(this.urlPath_, async() => {
      const url = `http://localhost:8080/${this.urlPath_}`;
      const imagePath = `./test/screenshot/${this.imagePath_}`;
      await this.createScreenshotTask_(url, imagePath);
      return;
    });
  }

  diff() {
    test(this.urlPath_, async() => {
      const url = `http://localhost:8080/${this.urlPath_}`;
      const imagePath = `./test/screenshot/${this.imagePath_}`;
      const diffPath = `./test/screenshot/${this.diffPath_}`;

      const [newScreenshot, oldScreenshot] = await Promise.all([
        this.createScreenshotTask_(url),
        readFilePromise(imagePath),
      ]);

      const options = {
        output: {
          errorColor: {
            red: 255,
            green: 0,
            blue: 255,
          },
          errorType: 'movement',
          transparency: 0.3,
        },
      };

      const data = await compareImages(newScreenshot, oldScreenshot, options);

      await writeFilePromise(diffPath, data.getBuffer());

      assert.isBelow(Number(data.misMatchPercentage), 0.01);
      return;
    });
  }

  async createScreenshotTask_(url, path) {
    let image;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url);
    if (path) {
      image = await page.screenshot({path});
    } else {
      image = await page.screenshot();
    }

    await browser.close();
    return image;
  }
}

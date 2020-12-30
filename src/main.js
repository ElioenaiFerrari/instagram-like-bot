require('dotenv/config');
const fs = require('fs');
const puppeteer = require('puppeteer');

const { URL, USERNAME, PASSWORD, COMMENT } = process.env;

const SLEEP_TIME = 5000;
const INSTAGRAM_LIMIT_TIME = 60000;

const signin = async (page, username, password) => {
  const usernameInput = await page.$('input[name=username]');
  const passwordInput = await page.$('input[name=password]');
  const signinButton = await page.$('button[type=submit]');

  await usernameInput.type(username, { delay: 100 });
  await passwordInput.type(password, { delay: 100 });

  await signinButton.click();
};

const hasCookies = () => fs.existsSync('./cookies.json');

const saveCookiesInMemory = async (page) => {
  const cookies = await page.cookies();
  fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
};

const setCookiesInBrowser = async (page) => {
  const cookiesString = fs.readFileSync('./cookies.json');
  const savedCookies = JSON.parse(cookiesString);
  await page.setCookie(...savedCookies);

  return;
};

const caseHasCookies = async (page, comment, instagramLimitTime) => {
  while (true) {
    const commentInput = await page.$('textarea.Ypffh');

    await commentInput.click({ clickCount: 3 });

    await commentInput.press('Backspace');

    await commentInput.type(comment, { delay: 100 });

    await commentInput.press('Enter');

    await page.waitForTimeout(instagramLimitTime);
  }
};

const caseNotHasCookies = async (page, comment, sleepTime, saveCookies) => {
  const noNowButton = await page.$('div.cmbtv button[type=button]');

  await noNowButton.click();

  await page.waitForTimeout(sleepTime);

  await saveCookies(page);

  while (true) {
    const commentInput = await page.$('textarea.Ypffh');

    await commentInput.click({ clickCount: 3 });

    await commentInput.press('Backspace');

    await commentInput.type(comment, { delay: 100 });

    await commentInput.press('Enter');

    await page.waitForTimeout(sleepTime);
  }
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
  });

  const page = await browser.newPage();

  if (hasCookies()) {
    await setCookiesInBrowser(page);

    await page.goto(URL);

    await page.waitForTimeout(SLEEP_TIME);

    await caseHasCookies(page, COMMENT, INSTAGRAM_LIMIT_TIME);
  } else {
    await page.goto(URL);
    await page.waitForTimeout(SLEEP_TIME);
    await signin(page, USERNAME, PASSWORD);
    await page.waitForTimeout(SLEEP_TIME);
    await caseNotHasCookies(page, COMMENT, SLEEP_TIME, saveCookiesInMemory);
  }
})();

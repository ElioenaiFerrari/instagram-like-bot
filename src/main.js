require('dotenv/config');
const fs = require('fs');
const puppeteer = require('puppeteer');

const { URL, USERNAME, PASSWORD, COMMENT, FACEBOOK } = process.env;

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

const signinWithFacebook = async (page, email, password) => {
  const facebookButton = await page.$('span.KPnG0');

  await facebookButton.click();

  await page.waitForTimeout(SLEEP_TIME);

  const emailInput = await page.$('input[name=email]');
  const passwordInput = await page.$('input[name=pass]');
  const signinButton = await page.$('button#loginbutton');

  await page.waitForTimeout(SLEEP_TIME);

  await emailInput.type(email, { delay: 100 });
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

const startComment = async (page, comment, instragramTime) => {
  let commentCount = 0;

  while (true) {
    const commentInput = await page.$('textarea.Ypffh');

    await commentInput.click({ clickCount: 3 });

    await commentInput.press('Backspace');

    await commentInput.type(comment, { delay: 100 });

    await commentInput.press('Enter');

    commentCount += 1;

    console.log(`Feito ${commentCount} comentários`);

    await page.waitForTimeout(instragramTime);
  }
};

const caseHasCookies = async (page, comment, instragramTime) => {
  return startComment(page, comment, instragramTime);
};

const caseNotHasCookies = async (
  page,
  comment,
  sleepTime,
  saveCookies,
  instragramTime,
  negateButton = false
) => {
  if (negateButton) {
    const noNowButton = await page.$('div.cmbtv button[type=button]');

    await noNowButton.click();
  }

  await page.waitForTimeout(sleepTime);

  await saveCookies(page);

  return startComment(page, comment, instragramTime);
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

    if (Boolean(FACEBOOK)) {
      await signinWithFacebook(page, USERNAME, PASSWORD);
      await page.waitForTimeout(SLEEP_TIME);
      await caseNotHasCookies(
        page,
        COMMENT,
        SLEEP_TIME,
        INSTAGRAM_LIMIT_TIME,
        saveCookiesInMemory
      );
    } else {
      await signin(page, USERNAME, PASSWORD);
      await page.waitForTimeout(SLEEP_TIME);
      await caseNotHasCookies(
        page,
        COMMENT,
        SLEEP_TIME,
        INSTAGRAM_LIMIT_TIME,
        saveCookiesInMemory,
        true
      );
    }
  }
})();

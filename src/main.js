require('dotenv/config');
const fs = require('fs');
const puppeteer = require('puppeteer');

const { URL, USERNAME, PASSWORD, COMMENT } = process.env;
const defaultTimeout = 5000;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
  });

  const page = await browser.newPage();

  if (fs.existsSync('./cookies.json')) {
    const cookiesString = fs.readFileSync('./cookies.json');
    const savedCookies = JSON.parse(cookiesString);
    await page.setCookie(...savedCookies);

    await page.goto(URL);

    let commentsCount = 0;

    while (true) {
      if (commentsCount === 5) {
        await page.waitForTimeout(120000);
        commentsCount = 0;
        continue;
      }

      const commentInput = await page.$('textarea.Ypffh');

      await commentInput.click({ clickCount: 3 });

      await commentInput.press('Backspace');

      await commentInput.type(COMMENT, { delay: 100 });

      await commentInput.press('Enter');

      await page.waitForTimeout(2000);
    }
  } else {
    await page.goto(URL);

    await page.waitForTimeout(defaultTimeout);

    const usernameInput = await page.$('input[name=username]');
    const passwordInput = await page.$('input[name=password]');
    const signinButton = await page.$('button[type=submit]');

    await usernameInput.type(USERNAME, { delay: 100 });
    await passwordInput.type(PASSWORD, { delay: 100 });

    await signinButton.click();

    await page.waitForTimeout(defaultTimeout);

    const noNowButton = await page.$('div.cmbtv button[type=button]');

    await noNowButton.click();

    await page.waitForTimeout(defaultTimeout);

    const commentInput = await page.$('textarea.Ypffh');

    await commentInput.type(COMMENT, { delay: 100 });

    await commentInput.press(String.fromCharCode(13));

    const cookies = await page.cookies();
    fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
  }
})();

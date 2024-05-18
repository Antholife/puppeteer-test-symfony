const puppeteer = require('puppeteer');
const {faker} = require('@faker-js/faker');
const assert = require('assert');
const chalk = require('chalk');

(async () => {
    console.log(chalk.yellow('**Test start**\n'));
    let browser = await puppeteer.launch({
        headless: false,
    });
    let page = await browser.newPage();

    // THIS TEST MUST BE RUN SEQUENTIALLY OTHERWISE IT WILL FAIL (Location URL)
    const {username, password} = await registrationTest(page);

    await logoutTest(page);

    await loginTest(page, username, password);

    await backToTask(page);

    await taskTest(page, false);

    await checkSecurityURL(page, browser);

    console.log(chalk.yellow('**Test end**\n'));

    await browser.close();
})();

const resetField = async (page, selector) => {
    await page.$eval(selector, (element) => {
        element.value = '';
    });
}

const dateField = (date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1 > 9 ? date.getUTCMonth() + 1 : '0' + (date.getUTCMonth() + 1);
    const day = date.getUTCDate() > 9 ? date.getUTCDate() : '0' + date.getUTCDate();
    const hours = date.getUTCHours() > 9 ? date.getUTCHours() : '0' + date.getUTCHours();
    const minutes = date.getUTCMinutes() > 9 ? date.getUTCMinutes() : '0' + date.getUTCMinutes();
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

const registrationTest = async (page) => {
    console.log(chalk.blue('-> Test Registration\n'));
    const username = faker.internet.userName();
    let password = faker.internet.password({length: 4});

    await page.goto('http://127.0.0.1:8000');
    await page.click('button[type="button"]');

    console.log(chalk.cyan('--> Password very short'));
    await page.type('input[id="registration_form_username"]', username);
    await page.type('input[id="registration_form_plainPassword"]', password);
    await page.click('input[id="registration_form_agreeTerms"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('ul li');
    let error = await page.$eval('ul li', element => element.textContent);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/register', chalk.red('---> Failed\n'));
    assert.strictEqual(error, 'Your password should be at least 6 characters', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Empty username'));
    const inputUsername = 'input[id="registration_form_username"]';
    const inputPassword = 'input[id="registration_form_plainPassword"]';
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    password = faker.internet.password({length: 10});
    await page.type('input[id="registration_form_plainPassword"]', password);
    await page.click('input[id="registration_form_agreeTerms"]');
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/register', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Empty password'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="registration_form_username"]', username);
    await page.click('input[id="registration_form_agreeTerms"]');
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/register', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Empty agree terms'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="registration_form_username"]', username);
    await page.type('input[id="registration_form_plainPassword"]', password);
    const checkAgreeTerms = 'input[id="registration_form_agreeTerms"]';
    await page.$eval(checkAgreeTerms, (element) => {
        element.checked = false;
    });
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/register', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Success registration'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="registration_form_username"]', username);
    await page.type('input[id="registration_form_plainPassword"]', password);
    await page.click('input[id="registration_form_agreeTerms"]');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
    ]);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    return {username, password};
}

const logoutTest = async (page) => {
    console.log(chalk.blue('-> Test Logout'));
    await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/logout"]')
    ]);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));
}

const loginTest = async (page, username, password) => {
    console.log(chalk.blue('-> Test Login\n'));
    console.log(chalk.cyan('--> Invalid password'));
    await page.type('input[id="username"]', username);
    await page.type('input[id="password"]', faker.internet.password());
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    await page.waitForSelector('div.alert');
    let error = await page.$eval('div.alert', element => element.textContent);
    assert.strictEqual(error, 'Invalid credentials.', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    const inputUsername = 'input[id="username"]';
    const inputPassword = 'input[id="password"]';

    console.log(chalk.cyan('--> Invalid username'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="username"]', faker.internet.userName());
    await page.type('input[id="password"]', password);
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    await page.waitForSelector('div.alert');
    error = await page.$eval('div.alert', element => element.textContent);
    assert.strictEqual(error, 'Invalid credentials.', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Empty username'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.evaluate(async () => {
        await new Promise(function (resolve) {
            setTimeout(resolve, 1000)
        });
    });
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Empty password'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="username"]', username);
    await page.click('button[type="submit"]');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Success login'));
    await resetField(page, inputUsername);
    await resetField(page, inputPassword);
    await page.type('input[id="username"]', username);
    await page.type('input[id="password"]', password);
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
    ]);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));
}

const backToTask = async (page) => {
    console.log(chalk.cyan('-> Back to task list'));
    await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/task/new"]'),
    ]);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/new', chalk.red('---> Failed\n'));
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="button"]'),
    ]);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));
}
const taskTest = async (page, onlyCreate) => {
    !onlyCreate && console.log(chalk.blue('-> Test Task\n'));
    let title = faker.lorem.words();
    let description = faker.lorem.sentence();
    let date = faker.date.anytime();
    let status = faker.lorem.word();

    let updateTitle = faker.lorem.words();
    let updateDescription = faker.lorem.sentence();
    let updateDate = faker.date.anytime();
    let updateStatus = faker.lorem.word();

    !onlyCreate && console.log(chalk.cyan('--> Create task'));
    await  Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/task/new"]'),
    ]);
    await page.type('input[name="task[title]"]', title);
    await page.type('input[name="task[description]"]', description);
    const inputDateSelector = 'input[name="task[date]"]';
    await page.$eval(inputDateSelector, (element, value) => {
        element.value = value;
    }, date.toISOString().slice(0, 16));
    await page.type('input[name="task[status]"]', status);

    await Promise.all([
        page.waitForNavigation(),
        page.click('button[class="btn btn-lg btn-primary primary"]')
    ]);

    let taskTitle = await page.$eval('table > tbody tr:last-child td:nth-child(2)', element => element.textContent);
    assert.strictEqual(taskTitle, title, chalk.red('---> Failed\n'));

    let taskDescription = await page.$eval('table > tbody tr:last-child td:nth-child(3)', element => element.textContent);
    assert.strictEqual(taskDescription, description, chalk.red('---> Failed\n'));

    let taskDate = await page.$eval('table > tbody tr:last-child td:nth-child(4)', element => element.textContent);

    assert.strictEqual(taskDate, dateField(date), chalk.red('---> Failed\n'));

    let taskStatus = await page.$eval('table > tbody tr:last-child td:nth-child(5)', element => element.textContent);
    assert.strictEqual(taskStatus, status, chalk.red('---> Failed\n'));
    !onlyCreate && console.log(chalk.green('---> Success\n'));

    if (!onlyCreate) {
        console.log(chalk.cyan('--> Show task'));

        let taskID = await page.$eval('table > tbody tr:last-child td:nth-child(1)', element => element.textContent);

        await Promise.all([
            page.waitForNavigation(),
            page.click('a[href="/task/' + taskID + '"]'),
        ]);

        let taskCID = await page.$eval('table > tbody tr:nth-child(1) td', element => element.textContent);
        assert.strictEqual(taskCID, taskID, chalk.red('---> Failed\n'));

        taskTitle = await page.$eval('table > tbody tr:nth-child(2) td', element => element.textContent);
        assert.strictEqual(taskTitle, title, chalk.red('---> Failed\n'));

        taskDescription = await page.$eval('table > tbody tr:nth-child(3) td', element => element.textContent);
        assert.strictEqual(taskDescription, description, chalk.red('---> Failed\n'));

        taskDate = await page.$eval('table > tbody tr:nth-child(4) td', element => element.textContent);

        assert.strictEqual(taskDate, dateField(date), chalk.red('---> Failed\n'));

        taskStatus = await page.$eval('table > tbody tr:nth-child(5) td', element => element.textContent);
        assert.strictEqual(taskStatus, status, '--> Failed\n');

        console.log(chalk.green('---> Success\n'));
        console.log(chalk.cyan('--> Edit update task'));

        await Promise.all([
            page.waitForNavigation(),
            page.click('button[class="btn secondary"]'),
        ]);
        await page.$eval('input[name="task[title]"]', (element, updateTitle) => {
            element.value = updateTitle
        }, updateTitle);

        await page.$eval('input[name="task[description]"]', (element, updateDescription) => {
            element.value = updateDescription;
        }, updateDescription);

        await page.$eval('input[name="task[date]"]', (element, value) => {
            element.value = value;
        }, updateDate.toISOString().slice(0, 16));

        await page.$eval('input[name="task[status]"]', (element, updateStatus) => {
            element.value = updateStatus;
        }, updateStatus);


        await Promise.all([
            page.waitForNavigation(),
            page.click('form[name="task"] button'),
        ]);
        taskTitle = await page.$eval('table > tbody tr:last-child td:nth-child(2)', element => element.textContent);
        assert.strictEqual(taskTitle, updateTitle, chalk.red('---> Failed\n'));

        taskDescription = await page.$eval('table > tbody tr:last-child td:nth-child(3)', element => element.textContent);
        assert.strictEqual(taskDescription, updateDescription, chalk.red('---> Failed\n'));

        taskDate = await page.$eval('table > tbody tr:last-child td:nth-child(4)', element => element.textContent);
        assert.strictEqual(taskDate, dateField(updateDate), chalk.red('---> Failed\n'));

        taskStatus = await page.$eval('table > tbody tr:last-child td:nth-child(5)', element => element.textContent);
        assert.strictEqual(taskStatus, updateStatus, chalk.red('---> Failed\n'));

        console.log(chalk.green('---> Success\n'));
        console.log(chalk.cyan('--> Delete task'));

        taskID = await page.$eval('table > tbody tr:last-child td:nth-child(1)', element => element.textContent);

        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                await dialog.accept();
            } else {
                await dialog.dismiss();
            }
        });

        await Promise.all([
            page.waitForNavigation(),
            page.click('form[action="/task/' + taskID + '"] button'),
        ]);

        taskCID = await page.$eval('table > tbody tr:last-child td:nth-child(1)', element => element.textContent);
        assert.notEqual(taskCID, taskID, chalk.red('---> Failed\n'));

        taskTitle = await page.$eval('table > tbody tr:last-child td:nth-child(2)', element => element.textContent);
        assert.notEqual(taskTitle, updateTitle, chalk.red('---> Failed\n'));

        taskDescription = await page.$eval('table > tbody tr:last-child td:nth-child(3)', element => element.textContent);
        assert.notEqual(taskDescription, updateDescription, chalk.red('---> Failed\n'));

        taskDate = await page.$eval('table > tbody tr:last-child td:nth-child(4)', element => element.textContent);
        assert.notEqual(taskDate, dateField(updateDate), chalk.red('---> Failed\n'));

        taskStatus = await page.$eval('table > tbody tr:last-child td:nth-child(5)', element => element.textContent);
        assert.notEqual(taskStatus, updateStatus, chalk.red('---> Failed\n'));

        console.log(chalk.green('---> Success\n'));
        return null;
    }
    else return await page.$eval('table > tbody tr:last-child td:nth-child(1)', element => element.textContent);
}

const checkSecurityURL = async (page, browser) => {
    console.log(chalk.blue('-> Test Security URL\n'));
    console.log(chalk.cyan('--> Access to login page with authenticated user'));
    await page.goto('http://127.0.0.1:8000/login');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Access to registration page with authenticated user'));
    await page.goto('http://127.0.0.1:8000/register');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Access to task page with authenticated user (PERSISTENT TAB)'));
    await page.close();
    page = await browser.newPage();
    await page.goto('http://127.0.0.1:8000/task');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/task/', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Access to task page with unauthenticated user'));
    const taskID = await taskTest(page, true);
    await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/logout"]'),
    ]);
    await page.goto('http://127.0.0.1:8000/task');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    await page.goto('http://127.0.0.1:8000/task/new');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    await page.goto('http://127.0.0.1:8000/task/' + taskID);
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    await page.goto('http://127.0.0.1:8000/task/' + taskID + '/edit');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));

    console.log(chalk.cyan('--> Redirect to login page for root URL'));
    await page.goto('http://127.0.0.1:8000/');
    assert.strictEqual(page.url(), 'http://127.0.0.1:8000/login', chalk.red('---> Failed\n'));
    console.log(chalk.green('---> Success\n'));
}

const puppeteer = require('puppeteer')
const prompt = require('prompt-sync')();

// add stealth plugin and use defaults (all evasion techniques)

async function giveBrowserAndPage(){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    return [browser, page];
}

async function login_brickseek(page){
    await page.goto('https://brickseek.com/login?redirect_to=https://brickseek.com/');
    await page.waitFor(1000);
    await page.evaluate(() => {
        document.getElementById('user-login').value = 'Esasalih1738@gmail.com';
        document.getElementById('user-password').value='Wooybi123';
        document.getElementsByClassName('bs-button')[0].click();
    });
    await page.waitForNavigation();
}

async function check_inventory(browser, page, zip, sku){
    await page.waitFor(2000);
    await page.goto('https://brickseek.com/walmart-inventory-checker/');
    await page.evaluate((z, s) => {
        document.getElementById('inventory-checker-form-sku').value = s;
        document.getElementById('inventory-checker-form-zip').value = z;
        document.getElementsByClassName('bs-button')[0].click();
    }, zip, sku);

    try {
        await page.waitForSelector("div[class='table__body']", {timeout: 80000});
    } catch (err){
        console.log('Error: ' + err);
        return false;
    }

    await page.waitFor(2000);
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));  // declare promise
    let res = await page.evaluate(() => {
                var rows = document.getElementsByClassName('table__row table__row--has-pickup');
                if (rows == null){
                    return false;
                } else {
                    var first_row = rows[0];
                    if(first_row == null){
                        return false;
                    }
                    first_row.childNodes[7].lastElementChild.lastElementChild.click();
                    return true;
                }
              });

    if(!res){
        return [page, res];
    }
    const page2 = await newPagePromise;                   
    await page2.bringToFront(); 
    return [page2,res];
}

async function super_click(page, className){
    try {
        page.click("button[class='" + className + "']", elem=>elem.click());
    } catch(err){
        try {
            page.$eval("button[class='" + className + "']", elem => elem.click());
        } catch(err2){
            page.evaluate(() => document.getElementsByClassName(className)[0].click());
        }
    }
}

async function addToCart(browser, page, quantity){
        
    await page.waitFor(2000);
    await page.select("select[class='field-input field-input--secondary']", quantity.toString());
    await page.waitForSelector("button[class='button spin-button prod-ProductCTA--primary button--primary']");
    await super_click(page, 'button spin-button prod-ProductCTA--primary button--primary');
    await page.waitFor(3000);
    await super_click(page, 'button ios-primary-btn-touch-fix hide-content-max-m checkoutBtn button--primary');
    await page.waitForNavigation()
    await page.waitFor(500);
    await page.evaluate(() => document.getElementsByClassName('button m-margin-top width-full button--primary')[0].click());
    await page.waitForNavigation();
    await page.waitFor(1000);
    await page.click('#pickup-button-0', elem => elem.click());
    await page.waitFor(1000);
    await page.evaluate(() => document.getElementsByClassName('button cxo-continue-btn button--primary')[0].click());
}

async function enterPickup(page){
    await page.waitFor(2000);
    await page.type("input[data-automation-id='primary-pickup-first-name'", 'Johnny');
    await page.type("input[data-automation-id='primary-pickup-last-name'", 'Hybrid');
    await page.type("input[data-automation-id='primary-pickup-email'", 'xrverma16@gmail.com');
    await page.type("input[data-automation-id='primary-pickup-phone'", '4437645725');
    await page.click("button[data-automation-id='pickup-submit'", elem => elem.click());
}


async function enterPayment(zip, page){
    await page.waitFor(1000);
    await page.type("input[id='addressLineOne']", '501 Frederick Road');
    await page.waitFor(2000);
    await page.type('#creditCard', '4024007103939509');
    await page.waitFor(100);
    await page.select('#month-chooser', '01');
    await page.waitFor(100);
    await page.select('#year-chooser', '2024');
    await page.waitFor(100);
    await page.type('#cvv', '251');
    await page.waitFor(100);
    const input2 = await page.$("input[id='postalCode']");
    await input2.click({clickCount: 3});
    await input2.type(zip.toString());
    await page.waitFor(1000);
    await page.click("button[class='button spin-button button--primary']", elem => elem.click());
}

async function submitOrder(page){
    await page.waitFor(2000);
    await page.evaluate(() => document.getElementsByClassName('button auto-submit-place-order no-margin set-full-width-button pull-right-m place-order-btn btn-block-s button--primary')[0].click());
}


async function checkout(){
    //User input
    let zip = prompt("Enter zip code for Brickseek: ");
    let walmart_zip = prompt("Enter zip code for Walmart: ");
    let sku = prompt('Enter sku of product: ');
    let quantity = prompt('Enter quantity: ');
    let monitor_delay = prompt('Enter # seconds you want inventory check to repeat after: ');

    //Get browser and page
    var bp_arr = await giveBrowserAndPage();
    var browser = bp_arr[0];
    var page = bp_arr[1];

    await login_brickseek(page);
    
    let arr = await check_inventory(browser, page, zip, sku);
    let res = arr[1];
    while(!res){
        console.log('Checking again...');
        await page.waitFor(monitor_delay * 1000); // delay in between monitoring
        arr = await check_inventory(browser, page, zip, sku);
        res = arr[1]
    }
    var url = await arr[0].url();
    while(true){
        await page.goto(url);
        await page.bringToFront();
        await page.waitFor(3000);
        await addToCart(browser, page, quantity);
        await enterPickup(page);
        await enterPayment(walmart_zip, page);
        await submitOrder(page);
        await page.waitFor(6000);   
    }

    //checkout()
    //return true
    
}

checkout(); // 10 -> 10 seconds refresh if product is out of stock

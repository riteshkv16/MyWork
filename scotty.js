const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();
const fetch = require('node-fetch');


const putters_url = "https://www.scottycameron.com/store/gallery-putters/";
const accessories_url = "https://www.scottycameron.com/store/accessories/";
const home_url = "https://www.scottycameron.com/";
const login_url = "https://www.scottycameron.com/store/user/login/";

//Launches puppeteer and returns you puppeteer page (browser).
async function givePage(){
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage();
    return page;
}


/* 
This method adds product to cart if the current page's url matches the putter page url (putters_url)
Example -> when you are on home page, the check_page_url() function will not fire since the page's url (denoted as
location.href) is not the same as the target product's url 
*/
async function monitor(page, monitor_url, product_num, selector){
    const script = `
        function fast_checkout(){
            var btn = document.getElementsByClassName('fastcheckout')[0];
            if(btn != null){
                btn.click();
            } else {
                setTimeout(fast_checkout,80);
            }
        }

        async function add_to_cart(){
            if(location.href == '${monitor_url}'){
                var product_atc = document.getElementsByClassName('${selector}')[${product_num}];
                if(product_atc != null){
                    console.log('found');
                    console.log(product_atc);
                    product_atc.lastElementChild.click();
                    fast_checkout()
                } else {
                    console.log('retrying...');
                    setTimeout(add_to_cart, 80);
                }
            }
        }
        
        add_to_cart();
    `

    await page.evaluateOnNewDocument(script); // This script runs everytime a new document is loaded
 
}

async function monitor_refresh(page, monitor_url, product_num, selector){
    
    const script = `
        var count = 0;
        function fast_checkout(){
            var btn = document.getElementsByClassName('fastcheckout')[0];
            if(btn != null){
                btn.click();
            } else {
                if(count >= 30){
                    count = 0;
                    location.reload();
                }
                count++;
                setTimeout(fast_checkout,100);
            }
        }

        async function add_to_cart(){
            if(location.href == '${monitor_url}'){
                var product_atc = document.getElementsByClassName('tocart')[0];
                if(product_atc != null){
                    console.log('found');
                    product_atc.lastElementChild.click();
                    fast_checkout()
                } else {
                    console.log('retrying...');
                    setTimeout(add_to_cart, 80);
                }
            }
        }
        
        add_to_cart();
    `

    await page.evaluateOnNewDocument(script); // This script runs everytime a new document is loaded
 
}

async function place_order_monitor(page){
    const script = `
        function submit_order(){
            if(location.href.includes('checkout')){
                console.log('Checking product out...');
                var cvv = document.getElementById('CredidCardCVCNumberSaved');
                if(cvv != null){
                    cvv.value = 2511;
                    document.getElementById('checkoutTermsAndConditions-Box').checked = true;
                    document.getElementById('btnCompleteCheckout').click();
                } else {
                    setTimeout(submit_order, 100);
                }
            } else {
                setTimeout(submit_order, 100);
            }
        }

        submit_order();
    
    `
    await page.evaluateOnNewDocument(script);
}

async function setup_monitoring(page, url, prod_num, do_refresh, selector){
    if(do_refresh == true){
        await monitor_refresh(page, url, prod_num - 1, selector);
    } else {
        await monitor(page, url, prod_num - 1, selector);
    }
    await place_order_monitor(page);
}

var checkout = async function(){
    console.log('Created by Ritesh Kumar Verma');

    //Prompt 
    var url = putters_url;
    let a_or_p = prompt('Monitor Accessories or Putters page? (a - accessories, p - putters): ');
    if(a_or_p.trim() == 'a'){
        console.log('accesory run');
        url = accessories_url;
    }

    let prod_num = prompt('Which number product on the page do you want to buy? (1 - first, 2 - second, etc.): ');
    let dual_run = prompt('Run 2 pages? (yes or no): ');
    console.log('Thank you. Now running ScottyBot...');
 
    //Puppeteer
    var page = await givePage();
    await setup_monitoring(page, url, prod_num, false, 'tocart');
    
    await page.goto(login_url); 
    if (dual_run == 'yes'){
        var page2 = await givePage();
        await setup_monitoring(page2, url, prod_num + 1, true, 'tocart');
        await page2.goto(login_url);
    }
}();



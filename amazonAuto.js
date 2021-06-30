const puppeteer = require('puppeteer');
const fs = require('fs');

let dataObj = {};
const jsonFilepath = './amazonData.json';

(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: null,
        slowMo: 100,
        args: ['--start-maximized'],
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/');
    await page.waitForSelector('.a-cardui-footer a[aria-label="Shop by Category - Shop now"]');

    // go to shop by category and fetch the link 
    let shopByCategoryAnchorLink = await page.evaluate(function () {
        let shopByCategoryAnchor = document.querySelector('.a-cardui-footer a[aria-label="Shop by Category - Shop now"]');

        let shopByCategoryAnchorLink = "https://www.amazon.com/" + shopByCategoryAnchor.getAttribute('href');

        return shopByCategoryAnchorLink;
    })

    await page.goto(shopByCategoryAnchorLink);

    // go to computer department .fetch the department link and store the link in intermediatedata 
    let intermediateData = await page.evaluate(function () {
        let computerAnchorLink = document.querySelectorAll('.left_nav.browseBox ul li a');

        let computerLink = [];

        computerLink.push("https://www.amazon.com/" + computerAnchorLink[7].getAttribute('href'));

        return { computerLink };
    })

    //create function and send the intermediate data link.
    let computerDetails = await fetchDataForGivenDepartment(intermediateData.computerLink[0]);

    for (let i = 0; i < computerDetails.computerItemTypeLinkArr.length; i++) {
        let itemTypeLink = await goToComputerItemTypeAndFetchItem(computerDetails.computerItemTypeLinkArr[i]); //create an array with name of department and store all products in the form of objects . 
        dataObj[computerDetails.computerItemTypeNameArr[i]] = [];

        let productType = computerDetails.computerItemTypeNameArr[i];

        for (let j = 0; j < itemTypeLink.productLinkArr.length; j++) {
            let product = {
                image: itemTypeLink.imageLinkArr[j],
                name: itemTypeLink.productNameArr[j],
                link: itemTypeLink.productLinkArr[j],
                rating: itemTypeLink.productRatingArr[j],
                price: itemTypeLink.priceArr[j],
            };
            dataObj[productType].push(product); // and add all products in the dataObj for a given department.
        }
    }

    //function to get product details for a particular type in computer department.
    function goToComputerItemTypeAndFetchItem(itemLink) {
        return new Promise(function (resolve, reject) {
            page.goto(itemLink).then(function () {
                return page.evaluate(function () {
                    let productName = document.querySelectorAll(".a-section.a-spacing-medium .a-section.a-spacing-none.a-spacing-top-small h2 a span");
                    let productNameArr = []; // add all the products name
                    for (let i = 0; i < productName.length; i++) {
                        productNameArr.push(productName[i].innerText.trim());
                    }

                    let productLink = document.querySelectorAll(".a-section.a-spacing-medium .a-section.a-spacing-none.a-spacing-top-small h2 a");
                    let productLinkArr = [];  // add all the product links
                    for (let i = 0; i < productLink.length; i++) {
                        productLinkArr.push("https://www.amazon.com/" + productLink[i].getAttribute('href'));
                    }

                    let imgIndex = document.querySelectorAll(".rush-component .a-link-normal.s-no-outline .a-section.aok-relative.s-image-square-aspect img");
                    let imgIdx = [];   
                    for (let i = 0; i < imgIndex.length; i++) {
                        imgIdx.push(imgIndex[i].getAttribute("data-image-index"));
                    }
                    let imgsLink = document.querySelectorAll(".rush-component .a-link-normal.s-no-outline .a-section.aok-relative.s-image-square-aspect img");
                    let images = [];
                    for (let i = 0; i < imgsLink.length; i++) {
                        images.push(imgsLink[i].getAttribute("src"));
                    }
                    let imageLinkArr = []; //store all image for the products
                    for (let i = 0; i < imgIdx.length; i++) {
                        if (imgIdx[i] != "0") {
                            imageLinkArr.push(images[i]);
                        }
                    }

                    let product = document.querySelectorAll(".a-section.a-spacing-medium");
                    let priceArr = [];   // store price of product .if price not avaliable provide the link to that product.
                    for (let i = 0; i < product.length - 1; i++) {
                        if (product[i].querySelector('.a-offscreen') !== null) {
                            let productPrice = product[i].querySelector(".a-offscreen").innerText;
                            priceArr.push(productPrice);
                        } else {
                            priceArr.push(`Price not avaiable. !! please visit ${productLinkArr[i]}`);
                        }
                    }

                    let productRating = document.querySelectorAll(".a-section.a-spacing-medium ");
                    let productRatingArr = []; // store rating of the given product . if rating not avaliable provide he product link  
                    for (let i = 0; i < productRating.length - 1; i++) {
                        if (productRating[i].querySelector(".a-icon-alt") != null) {
                            productRatingArr.push(productRating[i].querySelector(".a-icon-alt").innerText);
                        } else {
                            productRatingArr.push(`Product rating not avaliable . please visit ${productLinkArr[i]}`);
                        }
                    }

                    return { productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr };
                }).then(function (productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr) {
                    resolve(productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr);
                })
            })
        })
    }

//for computer department fetch the relate product link and name.
    function fetchDataForGivenDepartment(Link) {
        return new Promise(function (resolve, reject) {
            page.goto(Link).then(function () {
                return page.evaluate(function () {
                    let computerItemTypeLink = document.querySelectorAll('.a-spacing-micro.apb-browse-refinements-indent-2 a');

                    let computerItemTypeLinkArr = [];  //computer department all links 

                    for (let i = 0; i < computerItemTypeLink.length; i++) {
                        computerItemTypeLinkArr.push("https://www.amazon.com/" + computerItemTypeLink[i].getAttribute('href'));
                    }

                    let computerItemTypeName = document.querySelectorAll('.a-spacing-micro.apb-browse-refinements-indent-2 span[dir="auto"]');

                    let computerItemTypeNameArr = []; // computer department  all names. 

                    for (let i = 0; i < computerItemTypeName.length; i++) {
                        computerItemTypeNameArr.push(computerItemTypeName[i].innerText.trim());
                    }

                    return { computerItemTypeLinkArr, computerItemTypeNameArr };

                }).then(function (computerItemTypeLinkArr, computerItemTypeNameArr) {
                    resolve(computerItemTypeLinkArr, computerItemTypeNameArr);
                })
            })
        })
    }

    //create json file if not exist to store data in json file.
    jsonExist(jsonFilepath);

    function jsonExist(filepath) {  //function to create json file 
        try {
            if (fs.existsSync(filepath)) {
                //file exists
            } else {
                let json = JSON.stringify(dataObj);
                fs.writeFileSync("amazonData.json", json);
            }
        } catch (err) {
            console.error(err)
        }
    }

})();
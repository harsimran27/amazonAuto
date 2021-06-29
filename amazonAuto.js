const puppeteer = require('puppeteer');
// const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: null,
        slowMo: 50,
        args: ['--start-maximized'],
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/');
    await page.waitForSelector('.a-cardui-footer a[aria-label="Shop by Category - Shop now"]');
    let shopByCategoryAnchorLink = await page.evaluate(function () {
        let shopByCategoryAnchor = document.querySelector('.a-cardui-footer a[aria-label="Shop by Category - Shop now"]');

        let shopByCategoryAnchorLink = "https://www.amazon.com/" + shopByCategoryAnchor.getAttribute('href');
        // console.log(shopByCategoryAnchorLink);
        return shopByCategoryAnchorLink;
    })
    // console.log(shopByCategoryAnchorLink);
    await page.goto(shopByCategoryAnchorLink);

    let intermediateData = await page.evaluate(function () {
        let apartmentsDetails = document.querySelectorAll('.left_nav.browseBox ul li a');

        // let apartmentsName = [];
        let apartmentsLink = [];

        // apartmentsName.push(apartmentsDetails[7].innerText.trim());

        apartmentsLink.push("https://www.amazon.com/" + apartmentsDetails[7].getAttribute('href'));

        return { apartmentsLink };
    })

    let departments = {};

    // let departmentComp = departments[intermediateData.apartmentsName] = [];

    let computerDataDetails = await fetchDataForGivenDepartment(intermediateData.apartmentsLink[0]);

    for (let i = 0; i < computerDataDetails.computerItemTypeLinkArr.length; i++) {
        let itemTypeLink = await goToComputerItemTypeAndFetchItem(computerDataDetails.computerItemTypeLinkArr[i]);
        departments[computerDataDetails.computerItemTypeNameArr[i]] = [];

        let productType = computerDataDetails.computerItemTypeNameArr[i];

        for (let j = 0; j < itemTypeLink.productLinkArr.length; j++) {
            let product = {
                image: itemTypeLink.imageLinkArr[j],
                name: itemTypeLink.productNameArr[j],
                link: itemTypeLink.productLinkArr[j],
                rating: itemTypeLink.productRatingArr[j],
                price: itemTypeLink.priceArr[j],
            };
            departments[productType].push(product);
        }
    }

    function goToComputerItemTypeAndFetchItem(itemLink) {
        return new Promise(function (resolve, reject) {
            page.goto(itemLink).then(function () {
                return page.evaluate(function () {
                    let productName = document.querySelectorAll(".a-section.a-spacing-medium .a-section.a-spacing-none.a-spacing-top-small h2 a span");
                    let productNameArr = [];
                    for (let i = 0; i < productName.length; i++) {
                        productNameArr.push(productName[i].innerText.trim());
                    }

                    // console.log(productNameArr);

                    let productLink = document.querySelectorAll(".a-section.a-spacing-medium .a-section.a-spacing-none.a-spacing-top-small h2 a");
                    let productLinkArr = [];
                    for (let i = 0; i < productLink.length; i++) {
                        productLinkArr.push("https://www.amazon.com/" + productLink[i].getAttribute('href'));
                    }

                    // console.log(productLinkArr);

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
                    let imageLinkArr = [];
                    for (let i = 0; i < imgIdx.length; i++) {
                        if (imgIdx[i] != "0") {
                            imageLinkArr.push(images[i]);
                        }
                    }
                    // console.log(imageLinkArr);

                    let product = document.querySelectorAll(".a-section.a-spacing-medium");
                    let priceArr = [];
                    for (let i = 0; i < product.length - 1; i++) {
                        if (product[i].querySelector('.a-offscreen') !== null) {
                            let productPrice = product[i].querySelector(".a-offscreen").innerText;
                            priceArr.push(productPrice);
                        } else {
                            priceArr.push(`Price not avaiable. !! please visit ${productLinkArr[i]}`);
                        }
                    }
                    // console.log(priceArr);

                    let productRating = document.querySelectorAll(".a-section.a-spacing-medium ");
                    let productRatingArr = [];
                    for (let i = 0; i < productRating.length - 1; i++) {
                        if (productRating[i].querySelector(".a-icon-alt") != null) {
                            productRatingArr.push(productRating[i].querySelector(".a-icon-alt").innerText);
                        } else {
                            productRatingArr.push("Product rating not avaliable");
                        }
                    }
                    // console.log(productRatingArr);

                    return { productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr };
                }).then(function (productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr) {
                    resolve(productNameArr, productLinkArr, imageLinkArr, priceArr, productRatingArr);
                })
            })
        })
    }


    function fetchDataForGivenDepartment(departmentLink) {
        return new Promise(function (resolve, reject) {
            page.goto(departmentLink).then(function () {
                return page.evaluate(function () {
                    let computerItemTypeLink = document.querySelectorAll('.a-spacing-micro.apb-browse-refinements-indent-2 a');

                    let computerItemTypeLinkArr = [];

                    for (let i = 0; i < computerItemTypeLink.length; i++) {
                        computerItemTypeLinkArr.push("https://www.amazon.com/" + computerItemTypeLink[i].getAttribute('href'));
                    }

                    let computerItemTypeName = document.querySelectorAll('.a-spacing-micro.apb-browse-refinements-indent-2 span[dir="auto"]');

                    let computerItemTypeNameArr = [];

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

    // let json = JSON.stringify(departments);
    // fs.writeFileSync("amazonData.json", json);

})();
var touchStartX = -1;
var touchStartY = -1;

$(document).ready(function() {
    const statusElem = document.getElementById('status');
    function showStatus(stat) {
        statusElem.innerHTML += "<br>" + stat;
    }

    showStatus("checking Web API availability...");

    if ('BarcodeDetector' in window ) {
        showStatus("Barcode Detection Web API is supported by this browser!");
    } else {
        showStatus("BarcodeDetector API isn't supported by this browser, exiting...");
    }

    showStatus("setting up constraints for camera stream...");
    var front = false;
    var video = document.getElementById('cameraStream');

    var constraints = 
    { 
        video: { 
            facingMode: (front? "user" : "environment"), 
            width: 1080, 
            height: 1080 
        } 
    };

    showStatus("setting up event handlers...");

    const _orderPage = document.getElementById('_orderPage');
    const _barcodeNotification = document.getElementById('_barcodeNotification');
    const _barcodeDataContainer = document.getElementById('_barcodeDataContainer');

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    document.addEventListener('touchend', e => {
        if ( Math.abs(touchStartX - e.changedTouches[0].screenX) > Math.abs(touchStartY - e.changedTouches[0].screenY) && (Math.abs(touchStartX - e.changedTouches[0].screenX) > 100 || Math.abs(touchStartY - e.changedTouches[0].screenY) > 100)) {
            // swiped along the X axis
            if (touchStartX - e.changedTouches[0].screenX > 0) {
                // swiped along the X+ axis
                _orderPage.style.left = "30px";
            } else {
                // swiped along the X- axis

                _orderPage.style.zIndex = 2;
                _barcodeNotification.style.zIndex = 1;
                _barcodeDataContainer.style.zIndex = 1;

                _barcodeNotification.style.bottom = "0";
                _barcodeDataContainer.style.top = "100%";
                _orderPage.style.left = "80%";
            }
        } else if (Math.abs(touchStartX - e.changedTouches[0].screenX) > 100 || Math.abs(touchStartY - e.changedTouches[0].screenY) > 100) {
            if (touchStartY - e.changedTouches[0].screenY > 0) {
                // swiped along the Y+ axis

                _orderPage.style.zIndex = 1;
                _barcodeNotification.style.zIndex = 2;
                _barcodeDataContainer.style.zIndex = 2;

                _orderPage.style.left = "30px";
                _barcodeNotification.style.bottom = "40%";
                _barcodeDataContainer.style.top = "60%";
            } else {
                // swiped along the Y- axis
                _barcodeNotification.style.bottom = "0";
                _barcodeDataContainer.style.top = "100%";
            }
        }
    }, false);

    showStatus("getting inital stock database...");

    getStockArray()

    showStatus("starting the Barcode Detector...");

    startScanner();

    showStatus("starting the camera stream...");

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e) {
        video.play();
        document.getElementsByClassName('loadingScreen')[0].style.display = 'none';
    };
    })
    .catch(function(err) { console.log(err.name + ": " + err.message); })
});

// function startBarcodeDetector(video) {
//     alert("awaiting barcode")
//     const detector = new BarcodeDetector({formats: ['qr_code']});
//     window.setInterval(async () => {
//         const barcodes = await detector.detect(video);
//         if (barcodes.length <= 0) alert(barcodes.map(barcode => barcode.rawValue));
//     }, 1000)
// }

var previousFormat = "unknown";
var useScanner = true;

function startScanner() {
    var barcodeDetector = new BarcodeDetector(BarcodeDetector.getSupportedFormats());

    video = document.getElementById('cameraStream')
    var statusBar = document.getElementById('statusBar');

    window.setInterval(async () => {
        barcodeDetector
        .detect(video)
        .then((barcodes) => {
            if(barcodes[0] && useScanner) {
                statusBar.style.backgroundColor = "orange";
                barcodeName = document.getElementById('barcodeName');
                barcodeName.innerHTML = "unknown";
                document.getElementById('barcodeRawValue').innerHTML = barcodes[0].rawValue.substr(0, 32);
                document.getElementById('barcodeDataRaw').value = barcodes[0].rawValue.substr(0, 32);

                StockArr.forEach((curValue) => {
                    if (curValue["barcode-data"] == barcodes[0].rawValue){
                        barcodeName.innerHTML = curValue["name"];
                        document.getElementById('barcodeDataName').placeholder = curValue["name"];
                        document.getElementById('barcodeDataPrice').placeholder = curValue["price"];
                    }
                });

                document.getElementById(previousFormat).style.display = "none";
                document.getElementById(barcodes[0].format).style.display = "block";
                previousFormat = barcodes[0].format;
            } else {
                if (statusBar.style.backgroundColor == "gray" || statusBar.style.backgroundColor == "orange"){
                    statusBar.style.backgroundColor = "white";
                } else {
                    statusBar.style.backgroundColor = "gray";
                }
            }
        })
        .catch((err) => { 
            alert(err); 
        });
    }, 1000);
}

var AccessToken = "";
var StockArr;

function getStockArray() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "https://raw.githubusercontent.com/ure-shi/santoshi-stocker/main/stock.json", false);
    xmlHttp.send(null);
    StockArr = JSON.parse(xmlHttp.responseText);
}

function updateStockArray(pName, pPrice, pBarcodeData) {
    var check = false;
    StockArr.forEach((stockItem) => {
        if (stockItem["barcode-data"] == pBarcodeData) {
            check = true;
            stockItem["name"] = pName;
            stockItem["price"] = parseFloat(pPrice);
        }
    });
    if (!check) {
        StockArr.push({"barcode-data":pBarcodeData, ["name"]:pName, ["price"]:parseFloat(pPrice)});
    }
    document.getElementById('barcodeName').innerHTML = pName;
}

function cancelDatabaseAT() {
    document.getElementById('_accessTokenForm').style.display = "none";
}

function submitAccessToken() {
    showLoading();
    var stringToSubmit = document.getElementById("accessToken").value;
    if (!stringToSubmit) {
        alert("Please enter a valid access token.");
        hideLoading();
        return;
    }
    if (stringToSubmit.substring(0, 4) != "ghp_") {
        alert("Please enter a valid access token.");
        hideLoading();
        return;
    }
    AccessToken = stringToSubmit;
    hideLoading();
    putStockArray();
}

function putStockArray() {
    if (AccessToken == "") {
        //access token is required
        document.getElementById('_accessTokenForm').style.display = "flex";
        return;
    }

    showLoading();
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "https://api.github.com/repos/ure-shi/santoshi-stocker/contents/stock.json", false);
    xmlHttp.send(null);

    var sha = JSON.parse(xmlHttp.responseText)["sha"];
    alert("sha: " + sha);
    var content = btoa(JSON.stringify(StockArr));
    alert("content: " + content);
    var message = "Updated stock.json via stocker";
    alert("message: " + message);

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
        "PUT",
        "https://api.github.com/repos/ure-shi/santoshi-stocker/contents/stock.json"
    )

    xmlHttp.setRequestHeader("Authorization", "Bearer " + AccessToken);
    xmlHttp.setRequestHeader("Content-Type", "application/json");

    xmlHttp.send(JSON.stringify({"message": message, "sha": sha, "content": content}));
    
    var waitForStatus = window.setInterval(() => {
        if (xmlHttp.status >= 100 && xmlHttp.status < 300) {
            alert("Successful Status: " + xmlHttp.status);
            hideLoading();
            document.getElementById('_accessTokenForm').style.display = "none";
            clearInterval(waitForStatus);
        }
        else if (xmlHttp.status >= 400 && xmlHttp.status < 500){
            alert("Please enter a valid access token.");
            hideLoading();
            clearInterval(waitForStatus);
        }
        else if (xmlHttp.status != 0) {
            alert("Server Error: " + xmlHttp.status);
            clearInterval(waitForStatus);
        }
    }, 100);
}

function showLoading() {
    document.getElementById('_loading').style.display = "block";
}

function hideLoading() {
    document.getElementById('_loading').style.display = "none";
}

var orderList;
var orderNumber = 0;

const template1 = "<li><div class='liFlex'><div class='orderProductName'><label for='orderProductName'>Product Name</label><h1 id='orderProductName'>"
const template3 = "</h1></div><div class='orderProductQuantity'><label for='orderProductQuantity'>Quantity</label><h1 id='orderProductQuantity'>"
const template4 = "</h1></div></div><svg onclick='deleteOrderItem("
const template5 = ")' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'viewBox='0 0 10 10' style='enable-background:new 0 0 10 10;' xml:space='preserve'><style type='text/css'>.ost0{fill:#AA003AAA;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.ost1{fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}</style><g id='background'><path class='ost0' d='M8,9.5H2C1.17,9.5,0.5,8.83,0.5,8V2c0-0.83,0.67-1.5,1.5-1.5h6c0.83,0,1.5,0.67,1.5,1.5v6C9.5,8.83,8.83,9.5,8,9.5z'/></g><g id='cross'><line class='ost1' x1='3.23' y1='3.23' x2='6.77' y2='6.77'/><line class='ost1' x1='3.23' y1='6.77' x2='6.77' y2='3.23'/></g></svg></li>";

function addItemToOrder() {
    const productName = document.getElementById("barcodeName").innerHTML;
    const productQuantity = document.getElementById("inQuantity").value;
    
    orderNumber++;

    const orderItem = {"product-name":productName, "product-quantity":productQuantity, "id":orderNumber};

    document.getElementById("_orderList").innerHTML += template1 + productName + template3 + productQuantity + template4 + orderNumber + template5;

    orderList.push(orderItem);
}

function deleteOrderItem(number) {
    alert(orderList);
    document.getElementById("_orderList").innerHTML = "";
    orderList.forEach((ele, index) => {
        if (ele.id == number) {
            orderList.splice(index, 1);
        } else {
            document.getElementById("_orderList").innerHTML += template1 + ele["product-name"] + template3 + ele["product-quantity"] + template4 + ele["id"] + template5;
        }
    });
}
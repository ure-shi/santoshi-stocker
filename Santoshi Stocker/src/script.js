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

    window.addEventListener("beforeunload", (event) => {
        event.returnValue = null;
    }, {capture: true});

    const _orderPage = document.getElementById('_orderPage');
    const _barcodeNotification = document.getElementById('_barcodeNotification');
    const _barcodeDataContainer = document.getElementById('_barcodeDataContainer');

    var WOrderOpen = false;
    var WTrayOpen = false;

    var Editmenu = true;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    document.addEventListener('touchend', e => {
        if ( Math.abs(touchStartX - e.changedTouches[0].screenX) > Math.abs(touchStartY - e.changedTouches[0].screenY) && (Math.abs(touchStartX - e.changedTouches[0].screenX) > 100 || Math.abs(touchStartY - e.changedTouches[0].screenY) > 100)) {
            // swiped along the X axis
            if (touchStartX - e.changedTouches[0].screenX > 0) {
                // swiped along the X+ axis
                if (WTrayOpen == false) {
                    _orderPage.style.left = "30px";
                    WOrderOpen = false;
                } else {
                    if (Editmenu){
                        document.getElementById('_editMenu').style.display = "block";
                        document.getElementById('_orderMenu').style.display = "none";
                    } else {
                        document.getElementById('_editMenu').style.display = "none";
                        document.getElementById('_orderMenu').style.display = "block";
                    }
                    Editmenu = !Editmenu;
                }
            } else if (WTrayOpen == false) {
                // swiped along the X- axis

                _orderPage.style.zIndex = 2;
                _barcodeNotification.style.zIndex = 1;
                _barcodeDataContainer.style.zIndex = 1;

                _orderPage.style.left = "80%";
                WOrderOpen = true;
            } else if (WTrayOpen == true) {
                if (Editmenu){
                    document.getElementById('_editMenu').style.display = "block";
                    document.getElementById('_orderMenu').style.display = "none";
                } else {
                    document.getElementById('_editMenu').style.display = "none";
                    document.getElementById('_orderMenu').style.display = "block";
                }
                Editmenu = !Editmenu;
            }
        } else if (Math.abs(touchStartX - e.changedTouches[0].screenX) > 100 || Math.abs(touchStartY - e.changedTouches[0].screenY) > 100) {
            if (touchStartY - e.changedTouches[0].screenY > 0 && WOrderOpen == false) {
                // swiped along the Y+ axis
                WTrayOpen = true;

                _orderPage.style.zIndex = 1;
                _barcodeNotification.style.zIndex = 2;
                _barcodeDataContainer.style.zIndex = 2;

                _barcodeNotification.style.bottom = "40%";
                _barcodeDataContainer.style.top = "60%";
            } else {
                // swiped along the Y- axis
                WTrayOpen = false;
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

function addItemToOrder(quantity) {
    document.getElementById("_orderList").innerHTML += "\r\n" + document.getElementById("barcodeName").innerHTML + " ×" + quantity.toString();
}
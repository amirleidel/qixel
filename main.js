const canvas = document.getElementById('canvas');
const canvas2 = document.getElementById('canvas2');
const drawCanvas = document.getElementById('draw_canvas');

// Canvas default size
const canvasWidth = 123;
const canvasHeight = 123;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

drawCanvas.width = canvasWidth;
drawCanvas.height = canvasHeight;

const ctx = drawCanvas.getContext('2d'); // get 2D context

/*********** handle mouse events on canvas **************/
var mousedown = false;

drawCanvas.onmousedown = function(e) {
    var pos = fixPosition(e, drawCanvas);
    mousedown = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#0a7';
    ctx.lineWidth = 3;

    return false;
};

drawCanvas.onmousemove = function(e) {
    var pos = fixPosition(e, drawCanvas);
    //coord.innerHTML = '(' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + ')';
    if (mousedown) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
};

drawCanvas.onmouseup = function(e) {
    mousedown = false;
};

const delButton = document.getElementById("del_button");
delButton.addEventListener("click", () => { 
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
       
});

/********** handle touch too *******/

// Set up touch events for mobile, etc
drawCanvas.addEventListener("touchstart", function (e) {
  var mousePos = getTouchPos(drawCanvas, e);
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  drawCanvas.dispatchEvent(mouseEvent);
}, false);
drawCanvas.addEventListener("touchend", function (e) {
  var mouseEvent = new MouseEvent("mouseup", {});
  drawCanvas.dispatchEvent(mouseEvent);
}, false);
drawCanvas.addEventListener("touchmove", function (e) {
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  drawCanvas.dispatchEvent(mouseEvent);
}, false);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top
  };
}

document.body.addEventListener("touchstart", function (e) {
  if (e.target == drawCanvas) {
    e.preventDefault();
  }
},  { passive: false });
document.body.addEventListener("touchend", function (e) {
  if (e.target == drawCanvas) {
    e.preventDefault();
  }
},  { passive: false });
document.body.addEventListener("touchmove", function (e) {
  if (e.target == drawCanvas) {
    e.preventDefault();
  }
},  { passive: false });


/********** utils ******************/
// Thanks to https://stackoverflow.com/a/18053642
function fixPosition(e, gCanvasElement) {
    const rect = gCanvasElement.getBoundingClientRect()
    const x = (e.clientX - rect.left)/rect.width * gCanvasElement.width
    const y = (e.clientY - rect.top)/rect.height * gCanvasElement.height
    
    return {x: x, y:y};
};

// now edit images and make qr

const textInput = document.getElementById("textInput");

const btn = document.getElementById("btn");
const fileInput = document.getElementById("fileInput");
//const canvas = document.getElementById("canvas");



let imageFilename = "";
const fileNameDisplay = document.getElementById("fileNameDisplay");

btn.addEventListener("click", () => {
    
    if (imageFilename != "") {
        window.location.reload();
    };
    
    fileInput.click();
    
});

document.getElementById("fileInput").addEventListener("change", function(event) {
    if (event.target.files.length > 0) {
        imageFilename = event.target.files[0].name;   
        
        fileNameDisplay.innerText = imageFilename;
    }
});


// size of ver6 H lvl qr code 41x41 * 3 = 123x123
// capacity : 84 alphanum symbols

// Checkerboard parameters
const cellSize = 3; // size of each square

var runIndex = 0; // temporary fix 

function listenChanges(e) {
    
    const img = new Image();
        
    // load variable controls
    const pad_radios  = document.getElementsByName("pad");
    const dit_radios  = document.getElementsByName("dit");
    const gamma_slider = document.getElementById("gamma");
    const gamma_output = document.getElementById("gammaValue");
    const downloadBtn = document.getElementById("downloadBtn"); 
    
    // --- checkerboard Mat ---
      const checkerMat = new cv.Mat(canvasHeight, canvasWidth, cv.CV_8UC4);

      for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
          const cellX = Math.floor(x / cellSize);
          const cellY = Math.floor(y / cellSize);
          const isWhite = (cellX + cellY) % 2 === 0;

          const color = isWhite ? [255, 255, 255, 120] : [200, 200, 200, 120];
          checkerMat.ucharPtr(y, x)[0] = color[0]; // R
          checkerMat.ucharPtr(y, x)[1] = color[1]; // G
          checkerMat.ucharPtr(y, x)[2] = color[2]; // B
          checkerMat.ucharPtr(y, x)[3] = color[3]; // A
        }
      };
    
    
    function makeImage() {
        // Load image into OpenCV Mat
        
        let src = cv.imread(img);  // read from the offscreen canvas

        
        const maxSize = Math.max(src.rows, src.cols); // make empty square image
        // Compute padding amounts
        const top = Math.floor((maxSize - src.rows) / 2);
        const bottom = maxSize - src.rows - top;
        const left = Math.floor((maxSize - src.cols) / 2);
        const right = maxSize - src.cols - left;

        // Create the square Mat by extending edges
        let squareSrc = new cv.Mat();
        
        let border = "extend";
        
        for (let r of pad_radios) {
            if (r.checked) {
                border = r.value;
            }
        };
        switch (border) {
            case "extend" : {
            cv.copyMakeBorder(
              src,            // source Mat
              squareSrc,      // destination Mat
              top, bottom,    // top, bottom padding
              left, right,    // left, right padding
              cv.BORDER_REPLICATE // pad by repeating edge pixels 
              ); } break;
            case "black" : {
            cv.copyMakeBorder(
              src,            // source Mat
              squareSrc,      // destination Mat
              top, bottom,    // top, bottom padding
              left, right,    // left, right padding
              cv.BORDER_CONSTANT, // pad by repeating edge pixels 
              new cv.Scalar(0, 0, 0, 255) ); } break;
            case "white" : {
            cv.copyMakeBorder(
              src,            // source Mat
              squareSrc,      // destination Mat
              top, bottom,    // top, bottom padding
              left, right,    // left, right padding
              cv.BORDER_CONSTANT, // pad by repeating edge pixels 
              new cv.Scalar(255, 255, 255, 255) ); } break;
        };
        
        // rescale into qr size
        let displayMat = new cv.Mat();
        cv.resize(
            squareSrc,                      // source Mat
            displayMat,                      // destination Mat
            new cv.Size(canvasWidth, canvasHeight), // target size
            0, 0,                            // fx, fy (ignored because size is given)
            cv.INTER_NEAREST     // interpolation mode
        );
        
        let displayMatbgr = new cv.Mat();
        if (displayMat.type() !== cv.CV_8UC3) {
          cv.cvtColor(displayMat, displayMatbgr, cv.COLOR_RGBA2BGR, 0);
        };
        // TODO : cv.INTER_NEAREST, other interpolation mode like bilinear and lanczos ?
        
        // get qr code
        let qrcode = QRCode.generate(textInput.value,{
          ecclevel: "H",        // error correction level: "L", "M", "Q", "H"
          mode: "alphanumeric",  // "numeric", "alphanumeric", "octet"
          version : 6,
          mode : "octet" // has to be atm because of lowercase 58 chars max
        });
        
        
        // reserved mask
        
        let res_mask = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        
        
        function scaleArray(arr, factor) {
          let scaled = [];

          for (let y = 0; y < arr.length; y++) {
            // Each row is repeated `factor` times
            for (let fy = 0; fy < factor; fy++) {
              let newRow = [];
              for (let x = 0; x < arr[0].length; x++) {
                // Each element is repeated `factor` times
                for (let fx = 0; fx < factor; fx++) {
                  newRow.push(arr[y][x]);
                }
              }
              scaled.push(newRow);
            }
          }

          return scaled;
        };
        
        let scaled_qrcode = scaleArray(qrcode, 3);
        let scaled_res_mask = scaleArray(res_mask, 3);
        
        let corr_function255 = (val) => 255*(1-val);
        
        function arrayToMat(arr,corr_function= (val) => val) {
          let rows = arr.length;
          let cols = arr[0].length;
          let mat = new cv.Mat(rows, cols, cv.CV_8UC1); // 1-channel grayscale

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              mat.ucharPtr(y, x)[0] = corr_function(arr[y][x]); // grayscale, so only [0]
            }
          }
          return mat;
        };
        
        let qr_mat = arrayToMat(scaled_qrcode,corr_function255);
        let scaled_res_mat = arrayToMat(scaled_res_mask);
        
        // get cut out image (grab cut)
        
        let drawn_mask = cv.imread("draw_canvas"); 
        
        let binary_drawn_mask = new cv.Mat();
        cv.cvtColor(drawn_mask, binary_drawn_mask, cv.COLOR_RGBA2GRAY); // force to 1 channel
        
        
        function toMask(src) {
          let bin = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);

          for (let y = 0; y < src.rows; y++) {
            for (let x = 0; x < src.cols; x++) {
            
              let v = src.ucharPtr(y, x)[0];  // 0..255 gray
              let binVal;
              if (v < 64) {
                binVal = cv.GC_PR_BGD;      // probable background
              } else {
                binVal = cv.GC_FGD;      // sure foreground from user
              };
              bin.ucharPtr(y, x)[0] = binVal;
            }
          }
          
          // add initial guess for probable foreground
          bin.ucharPtr(Math.floor(src.rows/2)-10, Math.floor(src.cols/2))[0] = cv.GC_PR_FGD;
          return bin;
        };
        
        let cut_drawn_mask = toMask(binary_drawn_mask);
        
        //console.log(drawn_mask);
        //console.log([drawn_mask.rows,drawn_mask.cols]);
        
        let bgdModel = new cv.Mat();
        let fgdModel = new cv.Mat();
       
        cv.grabCut(displayMatbgr, cut_drawn_mask, new cv.Rect(), bgdModel, fgdModel, 10, cv.GC_INIT_WITH_MASK);
        // extract new mask
        let resultMask = new cv.Mat();
        let probableFg = new cv.Mat(cut_drawn_mask.rows, cut_drawn_mask.cols, cut_drawn_mask.type(), new cv.Scalar(cv.GC_PR_FGD));
        let sureFg = new cv.Mat(cut_drawn_mask.rows, cut_drawn_mask.cols, cut_drawn_mask.type(), new cv.Scalar(cv.GC_FGD));
        
        let tmp1 = new cv.Mat();
        let tmp2 = new cv.Mat();
        cv.compare(cut_drawn_mask, probableFg, tmp1, cv.CMP_EQ);
        cv.compare(cut_drawn_mask, sureFg, tmp2, cv.CMP_EQ);
        cv.bitwise_or(tmp1, tmp2, resultMask);
        
        // turn resultMask into binary_resultMask (0/1 instead of 0/255) for use in composition
        let binary_resultMask = new cv.Mat();
        cv.threshold(resultMask, binary_resultMask, 128, 1, cv.THRESH_BINARY);
        
        // make checkerboard overlay in draw canvas
        
        let resultMaskOverlay = new cv.Mat(resultMask.rows, resultMask.cols, cv.CV_8UC4);
        let resultMaskOverlayColor = [0,0,0,0];
        
        for (let y = 0; y < resultMaskOverlay.rows; y++) {
            for (let x = 0; x < resultMaskOverlay.cols; x++) {
                
                resultMaskOverlay.ucharPtr(y, x)[0] = resultMaskOverlayColor[0]*(binary_resultMask.ucharPtr(y, x)[0]) + checkerMat.ucharPtr(y, x)[0]*(1-binary_resultMask.ucharPtr(y, x)[0]);
                resultMaskOverlay.ucharPtr(y, x)[1] = resultMaskOverlayColor[1]*(binary_resultMask.ucharPtr(y, x)[0]) + checkerMat.ucharPtr(y, x)[1]*(1-binary_resultMask.ucharPtr(y, x)[0]);
                resultMaskOverlay.ucharPtr(y, x)[2] = resultMaskOverlayColor[2]*(binary_resultMask.ucharPtr(y, x)[0]) + checkerMat.ucharPtr(y, x)[2]*(1-binary_resultMask.ucharPtr(y, x)[0]);
                resultMaskOverlay.ucharPtr(y, x)[3] = resultMaskOverlayColor[3]*(binary_resultMask.ucharPtr(y, x)[0]) + checkerMat.ucharPtr(y, x)[3]*(1-binary_resultMask.ucharPtr(y, x)[0]);
            }
        };
                    
        
        cv.imshow("mask_canvas", resultMaskOverlay);
        
        
        // dither image
        const KERNELS = {
          atkinson: [
                                       [1, 0, 1/8],  [2, 0, 1/8],
            [-1, 1, 1/8], [0, 1, 1/8], [1, 1, 1/8],
                          [0, 2, 1/8]
          ],
          floydSteinberg: [
                                                 [1, 0, 0.8*7/16],
            [-1, 1, 0.8*3/16], [0, 1, 0.8*5/16], [1, 1, 0.8*1/16]
          ],
          sierra: [
                                                        [1, 0, 5/32], [2, 0, 3/32],
            [-2, 1, 2/32], [-1, 1, 4/32], [0, 1, 5/32], [1, 1, 4/32], [2, 1, 2/32],
                           [-1, 2, 2/32], [0, 2, 3/32], [1, 2, 2/32]
          ],
          leidel: [
                                                       [1, 0, 5/36], [2, 0, 2/36],
            [-2, 1, 2/36],[-1, 1, 3/36], [0, 1, 5/36], [1, 1, 3/36], [2, 1, 2/36],
            [-2, 2, 1/36],[-1, 2, 2/36], [0, 2, 1/36], [1, 2, 2/36], [2, 2, 1/36]
          ],
          none: [] // no diffusion
        };
        
        
        function dither(gray, qr_mat, kernel) {
          let out = gray.clone();

          for (let y = 0; y < out.rows; y++) {
            for (let x = 0; x < out.cols; x++) {
              let oldVal = out.ucharPtr(y, x)[0];
              let qrVal = qr_mat.ucharPtr(y, x)[0];
              let newVal;
              
              if (y%3 === 1 && x%3 === 1) { 
                newVal = qrVal; // get from qr
              }
              else {
                newVal = oldVal < 128 ? 0 : 255; // get from old
              };
              
              out.ucharPtr(y, x)[0] = newVal;

              let error = oldVal - newVal;

              // Spread error according to kernel
              for (let [dx, dy, frac] of kernel) {
                let nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < out.cols && ny >= 0 && ny < out.rows) {
                  let p = out.ucharPtr(ny, nx);
                  p[0] = Math.min(255, Math.max(0, p[0] + error * frac));
                }
              }
            }
          }
          return out;
        };
        
        function toGrayscale(src,gamma) {
          let gray = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);

          for (let y = 0; y < src.rows; y++) {
            for (let x = 0; x < src.cols; x++) {
              let b = src.ucharPtr(y, x)[0];
              let g = src.ucharPtr(y, x)[1];
              let r = src.ucharPtr(y, x)[2];

              let grayVal = (Math.round((299 * r + 587 * g + 114 * b) / 1000)/255)**gamma * 255;
              gray.ucharPtr(y, x)[0] = grayVal;
            }
          }
          
          return gray;
        };
        
        let gammaValue = parseFloat(gamma_slider.value);
        console.log(gammaValue);
        gamma_output.textContent = gammaValue.toFixed(1); // display with slider
        
        let gray = toGrayscale(displayMat, gammaValue); //parseFloat(gamma_slider.value));
        
        // pick a kernel dynamically
        let kernelName = "leidel";
        
        for (let q of dit_radios) {
            if (q.checked) {
                kernelName = q.value;
            }
        };
        
        let kernel = KERNELS[kernelName];  // or "floydSteinberg", "none"
        
        let dithered = dither(gray, qr_mat, kernel);
        
        
        // now compose dither with qr
        function compose(dithered, qr_mat, scaled_res_mat) {
            
            let result = new cv.Mat(qr_mat.rows, qr_mat.cols, cv.CV_8UC1);
            
            for (let y = 0; y < result.rows; y++) {
                for (let x = 0; x < result.cols; x++) {
                    
                    let ditheredMask = (1-scaled_res_mat.ucharPtr(y, x)[0])*(binary_resultMask.ucharPtr(y, x)[0]);
                    result.ucharPtr(y, x)[0] = qr_mat.ucharPtr(y, x)[0]*(1-ditheredMask) + dithered.ucharPtr(y, x)[0]*ditheredMask;
                    
            }};
            
            return result;
            };
                
        let composed = compose(dithered, qr_mat, scaled_res_mat);
        
        cv.imshow("canvas", displayMat);
        cv.imshow("canvas2", composed);          // show on actual canvas
        
        
        
        // cleanup
        gray.delete();
        dithered.delete();

        src.delete(); 
        squareSrc.delete(); 
        displayMat.delete();
    };
    
    // listen
    img.onload = function() {
        
        makeImage(); // first time with defaults
        

        downloadBtn.addEventListener("mouseup", () => { 
            console.log("downloading...");
            let dataURL = canvas2.toDataURL("image/png");
            
            // Create a temporary link to trigger download
            let link = document.createElement("a");
            link.href = dataURL;
            
            let dotIndex = imageFilename.indexOf(".");
            let beforeDot = (dotIndex !== -1) ? imageFilename.substring(0, dotIndex) : imageFilename;
            link.download = beforeDot+"-qrcode.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Disable the button
            btn.disabled = true;
            
            // Re-enable after 1 second (1000 ms)
            setTimeout(() => {
                btn.disabled = false;
            }, 1000);
            
        });
        
        pad_radios.forEach(r => {
            r.addEventListener("change", () => { // listen to rescale change 
                
                makeImage();
                
                });
                });
                
        dit_radios.forEach(q => {
                q.addEventListener("change", () => { // listen to dither change 
                
                makeImage();
                
                    });
                    });
                    
        textInput.addEventListener("input", () => { 
        
            makeImage();
            
        });
        
        delButton.addEventListener("click", () => { 
            
            // delete drawing happens in the ctx def
            //ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            
            makeImage();
            
        });
        
        drawCanvas.addEventListener("mouseup", () => {
            makeImage();
        });
        
        console.log(gamma_slider);
        console.log(gamma_slider.addEventListener);
        gamma_slider.addEventListener("mouseup", () => { 
        
            makeImage();
            
        });
        
        
      
    };
      
    runIndex = runIndex + 1;
    img.src = e.target.result;
};

function runOpenCV() {
  // console.log("OpenCV.js is ready!");
  
  // --- Create default checkerboard Mat ---
  const checkerMat = new cv.Mat(canvasHeight, canvasWidth, cv.CV_8UC3);

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const isWhite = (cellX + cellY) % 2 === 0;

      const color = isWhite ? [255, 255, 255] : [200, 200, 200];
      checkerMat.ucharPtr(y, x)[0] = color[0]; // R
      checkerMat.ucharPtr(y, x)[1] = color[1]; // G
      checkerMat.ucharPtr(y, x)[2] = color[2]; // B
    }
  };

  // Display the checkerboard in the canvas
  cv.imshow("canvas", checkerMat);
  
  // wait for file upload to display
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
    
    listenChanges(e);
    
    };
    reader.readAsDataURL(file);
  });
};

// wait until opencv is loaded
cv['onRuntimeInitialized'] = runOpenCV;
const video = document.getElementById("video");
const openCameraBtn = document.getElementById("openCamera");
const captureBtn = document.getElementById("capture");
const capturedImg = document.getElementById("capturedImage");
const usernameInp = document.getElementById("username");
const emailInp = document.getElementById("email");
const phoneInp = document.getElementById("phone");
const canvas = document.getElementById("canvas");
let faceDetectionActive = false;
let detectionInterval;

function addToInput(username, email, phone) {
  usernameInp.value = username;
  emailInp.value = email;
  phoneInp.value = phone;
}

function loadModels() {
  return Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.ageGenderNet.loadFromUri("./models"),
  ]);
}

window.addEventListener("load", function () {
  loadModels()
    .then(() => {
      console.log("All models loaded");
    })
    .catch((error) => {
      console.error("Error loading models:", error);
    });
});

// Sử dụng API navigator để truy cập camera
navigator.mediaDevices
  .getUserMedia({ video: {} })
  .then(function (stream) {
    // Gán stream của camera vào video element
    video.srcObject = stream;
  })
  .catch(function (err) {
    console.log("Lỗi: " + err);
  });

// Sau khi video được load, chạy hàm startFaceDetection
openCameraBtn.addEventListener("click", () => {
  console.log("Video play");
  video.classList.remove("hidden");
  capturedImg.classList.add("hidden");
  canvas.classList.remove("hidden");
  addToInput("", "", "");

  video.play();
  // Start face detection when the video starts playing
  startFaceDetection();
});

async function startFaceDetection() {
  faceDetectionActive = true;
  detectionInterval = setInterval(async () => {
    if (!faceDetectionActive) {
      clearInterval(detectionInterval);
      console.log("Co Dung", faceDetectionActive);

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.08,
    });
    const detections = await faceapi
      .detectSingleFace(video, faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withAgeAndGender();

    // Lấy ra canvas element từ HTML

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const videoRect = video.getBoundingClientRect();
    canvas.style.left = videoRect.left - 100 + "px";
    canvas.style.top = videoRect.top - 60 + "px";
    // Xóa canvas
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Nếu nhận diện được khuôn mặt, vẽ kết quả lên canvas
    if (detections) {
      console.log("Hello Detections");
      const resizedDetections = faceapi.resizeResults(detections, {
        width: canvas.width,
        height: canvas.height,
      });
      faceapi.draw.drawDetections(canvas, resizedDetections);
    }
  }, 100);
}

function stopFaceDetection() {
  faceDetectionActive = false;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  canvas.classList.add("hidden");
}

captureBtn.addEventListener("click", captureImage);

function captureImage() {
  stopFaceDetection();
  const canvasImg = document.createElement("canvas");
  const ctx = canvasImg.getContext("2d");
  canvasImg.width = video.videoWidth;
  canvasImg.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvasImg.width, canvasImg.height);
  capturedImg.src = canvasImg.toDataURL();

  console.log(faceDetectionActive);
  video.classList.add("hidden");
  video.pause();

  capturedImg.classList.remove("hidden");
  const imageData = canvasImg.toDataURL("image/jpeg");

  // let data = { image: imageData };
  // let url = "http://127.0.0.1:5000/processImg";

  // postData(url, data).then((data) => {
  //   console.log(data);
  //   capturedImg.src = "data:image/jpeg;base64," + data.image;
  //   addToInput(data.username, data.email, data.phone);
  // });
}

async function postData(url, data) {
  const formData = new FormData();
  formData.append("image", data);

  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
  return response.json();
}

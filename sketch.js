// ==========================================
// p5.js 響應式測驗 - sketch.js
// ==========================================

// 宣告目前顯示的題目索引，索引從零開始。
let currentQuestionIndex = 0;
// 宣告使用者答對的題數。
let score = 0;
// 宣告使用者目前選取的選項索引，負一代表尚未作答。
let selectedAnswerIndex = -1;
// 宣告目前題目是否已經完成作答。
let answerSubmitted = false;
// 宣告測驗是否已經完成。
let quizFinished = false;
// 宣告回饋動畫的開始時間。
let feedbackStartTime = 0;
// 宣告上一次有效點擊的時間，避免滑鼠與觸控重複觸發。
let lastActionTime = -1000;

// 宣告全域題目資料，讓題目與答案集中管理。
const questions = [
  { question: "在 p5.js 中，哪一個函式通常用來建立畫布？", options: ["createCanvas()", "makeCanvas()", "drawCanvas()", "newCanvas()"], correctIndex: 0 },
  { question: "p5.js 中，哪一個函式會在程式開始時執行一次？", options: ["start()", "setup()", "begin()", "init()"], correctIndex: 1 },
  { question: "若要在畫布上繪製圓形，p5.js 常用的函式是哪一個？", options: ["circle()", "round()", "ellipse()", "drawCircle()"], correctIndex: 2 },
  { question: "p5.js 中，哪一個函式會持續重複執行來更新畫面？", options: ["repeat()", "loopDraw()", "update()", "draw()"], correctIndex: 3 },
  { question: "下列哪一個函式可以設定圖形的填滿顏色？", options: ["fill()", "colorFill()", "paint()", "insideColor()"], correctIndex: 0 }
];

// 在 p5.js 初始化時建立全螢幕畫布與相關設定。
function setup() {
  // 建立符合視窗寬高的畫布。
  createCanvas(windowWidth, windowHeight);
  // 設定預設矩形對齊模式。
  rectMode(CORNER);
  // 將文字對齊方式設定為水平與垂直置中。
  textAlign(CENTER, CENTER);
  // 設定適合繁體中文的字型。
  textFont("Noto Sans TC, sans-serif");
  
  // 嘗試設定畫布的觸控行為，避免行動裝置捲動畫面。
  try {
    const canvasElement = document.querySelector("canvas");
    if (canvasElement) {
      canvasElement.style.touchAction = "none";
    }
  } catch (error) {
    console.warn("無法設定觸控樣式，但測驗仍可使用。", error);
  }
}

// 在每一幀重新繪製測驗介面。
function draw() {
  // 填滿柔和的淺色背景。
  background("#f8f9fa");
  
  // 判斷測驗是否已經完成。
  if (quizFinished) {
    drawFinishedScreen();
    return;
  }
  
  // 取得目前正在顯示的題目資料。
  const currentQuestion = questions[currentQuestionIndex];
  // 取得目前動態計算的版面佈局資訊。
  const layout = getLayoutConfig();

  // 繪製標題、進度與正中央題目。
  drawQuestionHeader(currentQuestion, layout);
  // 繪製四個選項按鈕。
  drawOptions(currentQuestion, layout);
  // 繪製下一題按鈕。
  drawNextButton(layout);
}

// 根據視窗寬高與旋轉方向動態計算版面配置資訊。
function getLayoutConfig() {
  // 判斷是否為手機橫向（極低高度畫面）
  const isLandscape = width > height && height < 500;
  
  // 計算選項卡片與按鈕尺寸
  const optionWidth = min(width * 0.88, 720);
  const optionHeight = constrain(height * (isLandscape ? 0.09 : 0.075), 40, 64);
  const optionGap = constrain(height * (isLandscape ? 0.012 : 0.016), 6, 14);
  
  // 計算垂直位置發散點
  const headerY = height * (isLandscape ? 0.06 : 0.07);
  const progressY = height * (isLandscape ? 0.12 : 0.13);
  const questionY = height * (isLandscape ? 0.23 : 0.26);
  const firstOptionY = height * (isLandscape ? 0.38 : 0.42);
  
  // 下一題按鈕資訊
  const nextBtnWidth = min(width * 0.5, 300);
  const nextBtnHeight = constrain(height * 0.07, 44, 56);
  const nextBtnY = height - nextBtnHeight - constrain(height * 0.03, 10, 24);

  return {
    isLandscape,
    optionWidth,
    optionHeight,
    optionGap,
    headerY,
    progressY,
    questionY,
    firstOptionY,
    nextBtnWidth,
    nextBtnHeight,
    nextBtnY
  };
}

// 繪製標題、進度與放置於正中央的題目文字。
function drawQuestionHeader(currentQuestion, layout) {
  fill("#023047");
  noStroke();
  
  // 測驗主標題
  textSize(getResponsiveTextSize(28));
  text("p5.js 簡易指令練習測驗", width / 2, layout.headerY);
  
  // 答題進度
  textSize(getResponsiveTextSize(17));
  fill("#457b9d");
  const questionNumber = currentQuestionIndex + 1;
  text(`第 ${questionNumber} 題／共 ${questions.length} 題`, width / 2, layout.progressY);
  
  // 題目內容（透過 CENTER 模式讓文字框中心精準置中）
  textSize(getResponsiveTextSize(layout.isLandscape ? 20 : 24));
  fill("#1d3557");
  rectMode(CENTER);
  text(
    currentQuestion.question, 
    width / 2, 
    layout.questionY, 
    width * 0.88, 
    height * (layout.isLandscape ? 0.12 : 0.15)
  );
  rectMode(CORNER);
}

// 繪製目前題目的四個選項。
function drawOptions(currentQuestion, layout) {
  for (let optionIndex = 0; optionIndex < currentQuestion.options.length; optionIndex += 1) {
    let optionX = width / 2;
    let optionY = layout.firstOptionY + optionIndex * (layout.optionHeight + layout.optionGap);

    // 動畫回饋效果
    if (answerSubmitted && selectedAnswerIndex !== currentQuestion.correctIndex) {
      if (optionIndex === currentQuestion.correctIndex) {
        optionY += getBounceOffset();
      }
      if (optionIndex === selectedAnswerIndex) {
        optionX += getShakeOffset();
      }
    }

    // 取得背景顏色與繪製圓角矩形
    const optionColor = getOptionColor(optionIndex, currentQuestion);
    fill(optionColor);
    noStroke();
    rectMode(CENTER);
    rect(optionX, optionY, layout.optionWidth, layout.optionHeight, 12);
    
    // 繪製選項文字
    fill("#17202a");
    textSize(getResponsiveTextSize(layout.isLandscape ? 16 : 18));
    text(
      `${String.fromCharCode(65 + optionIndex)}. ${currentQuestion.options[optionIndex]}`, 
      optionX, 
      optionY, 
      layout.optionWidth * 0.92, 
      layout.optionHeight * 0.9
    );
  }
  rectMode(CORNER);
}

// 依照作答狀態回傳選項背景色。
function getOptionColor(optionIndex, currentQuestion) {
  if (answerSubmitted && selectedAnswerIndex !== currentQuestion.correctIndex) {
    if (optionIndex === currentQuestion.correctIndex) return "#caf0f8";
    if (optionIndex === selectedAnswerIndex) return "#cdb4db";
  }
  if (answerSubmitted && optionIndex === selectedAnswerIndex) {
    return "#b7e4c7";
  }
  return "#ffffff";
}

// 繪製下一題或查看結果按鈕。
function drawNextButton(layout) {
  const buttonX = (width - layout.nextBtnWidth) / 2;
  const buttonEnabled = answerSubmitted;

  fill(buttonEnabled ? "#219ebc" : "#b8c4ce");
  noStroke();
  rect(buttonX, layout.nextBtnY, layout.nextBtnWidth, layout.nextBtnHeight, 12);
  
  fill(buttonEnabled ? "#ffffff" : "#6c757d");
  textSize(getResponsiveTextSize(19));
  const buttonText = currentQuestionIndex === questions.length - 1 ? "查看測驗結果" : "下一題";
  text(buttonText, width / 2, layout.nextBtnY + layout.nextBtnHeight / 2);
}

// 依據螢幕短邊動態算字型大小，確保在不同解析度下視覺比例一致。
function getResponsiveTextSize(baseSize) {
  const shortSide = min(width, height);
  return constrain(baseSize * (shortSide / 680), 13, baseSize);
}

// 動畫邏輯：答對向上跳動
function getBounceOffset() {
  const elapsedSeconds = (millis() - feedbackStartTime) / 1000;
  return -abs(sin(elapsedSeconds * 7)) * 10;
}

// 動畫邏輯：答錯左右震動
function getShakeOffset() {
  const elapsedSeconds = (millis() - feedbackStartTime) / 1000;
  return sin(elapsedSeconds * 28) * 12;
}

// 統一處理滑鼠與觸控事件的邏輯與防重複觸發機制。
function handlePointer(pointerX, pointerY) {
  const currentTime = millis();
  if (currentTime - lastActionTime < 350) return false;
  lastActionTime = currentTime;

  if (quizFinished) return false;

  const currentQuestion = questions[currentQuestionIndex];
  const layout = getLayoutConfig();

  // 進行作答判定
  if (!answerSubmitted) {
    const clickedOptionIndex = getClickedOptionIndex(pointerX, pointerY, currentQuestion, layout);
    if (clickedOptionIndex !== -1) {
      selectedAnswerIndex = clickedOptionIndex;
      answerSubmitted = true;
      feedbackStartTime = currentTime;
      if (selectedAnswerIndex === currentQuestion.correctIndex) {
        score += 1;
      }
      return false;
    }
  }

  // 下一題按鈕點擊判定
  if (answerSubmitted && isNextButtonPressed(pointerX, pointerY, layout)) {
    goToNextQuestion();
    return false;
  }
  return false;
}

// 檢查點擊座標是否落在選項範圍內。
function getClickedOptionIndex(pointerX, pointerY, currentQuestion, layout) {
  for (let optionIndex = 0; optionIndex < currentQuestion.options.length; optionIndex += 1) {
    const optionY = layout.firstOptionY + optionIndex * (layout.optionHeight + layout.optionGap);
    const leftEdge = width / 2 - layout.optionWidth / 2;
    const rightEdge = width / 2 + layout.optionWidth / 2;
    const topEdge = optionY - layout.optionHeight / 2;
    const bottomEdge = optionY + layout.optionHeight / 2;

    if (pointerX >= leftEdge && pointerX <= rightEdge && pointerY >= topEdge && pointerY <= bottomEdge) {
      return optionIndex;
    }
  }
  return -1;
}

// 檢查點擊座標是否落在下一題按鈕內。
function isNextButtonPressed(pointerX, pointerY, layout) {
  const buttonX = (width - layout.nextBtnWidth) / 2;
  return pointerX >= buttonX && 
         pointerX <= buttonX + layout.nextBtnWidth && 
         pointerY >= layout.nextBtnY && 
         pointerY <= layout.nextBtnY + layout.nextBtnHeight;
}

// 前往下一題或切換至結果畫面。
function goToNextQuestion() {
  if (currentQuestionIndex === questions.length - 1) {
    quizFinished = true;
    return;
  }
  currentQuestionIndex += 1;
  selectedAnswerIndex = -1;
  answerSubmitted = false;
  feedbackStartTime = 0;
}

// 繪製測驗完成後的結果畫面。
function drawFinishedScreen() {
  fill("#023047");
  noStroke();
  textSize(getResponsiveTextSize(34));
  text("測驗完成！", width / 2, height * 0.30);
  
  fill("#219ebc");
  textSize(getResponsiveTextSize(28));
  text(`你答對 ${score}／${questions.length} 題`, width / 2, height * 0.44);
  
  fill("#457b9d");
  textSize(getResponsiveTextSize(19));
  text("繼續練習 p5.js，讓創意動起來！", width / 2, height * 0.56);
  
  const restartWidth = min(width * 0.5, 300);
  const restartHeight = constrain(height * 0.07, 46, 56);
  const restartX = (width - restartWidth) / 2;
  const restartY = height * 0.68;
  
  fill("#219ebc");
  rect(restartX, restartY, restartWidth, restartHeight, 12);
  
  fill("#ffffff");
  textSize(getResponsiveTextSize(19));
  text("重新測驗", width / 2, restartY + restartHeight / 2);
}

// 檢查點擊是否落在重新測驗按鈕內。
function isRestartButtonPressed(pointerX, pointerY) {
  const restartWidth = min(width * 0.5, 300);
  const restartHeight = constrain(height * 0.07, 46, 56);
  const restartX = (width - restartWidth) / 2;
  const restartY = height * 0.68;
  return pointerX >= restartX && pointerX <= restartX + restartWidth && pointerY >= restartY && pointerY <= restartY + restartHeight;
}

// 重設所有測驗狀態。
function restartQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  selectedAnswerIndex = -1;
  answerSubmitted = false;
  quizFinished = false;
  feedbackStartTime = 0;
}

// 處理滑鼠按下事件。
function mousePressed() {
  if (quizFinished) {
    if (isRestartButtonPressed(mouseX, mouseY)) restartQuiz();
    return false;
  }
  return handlePointer(mouseX, mouseY);
}

// 處理觸控開始事件。
function touchStarted() {
  const pointerX = touches.length > 0 ? touches[0].x : mouseX;
  const pointerY = touches.length > 0 ? touches[0].y : mouseY;
  if (quizFinished) {
    if (isRestartButtonPressed(pointerX, pointerY)) restartQuiz();
    return false;
  }
  return handlePointer(pointerX, pointerY);
}

// 在視窗尺寸改變或螢幕旋轉時自動調校畫布大小與版面。
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
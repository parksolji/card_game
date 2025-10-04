// script.js (최종 버전)
// cards 폴더에 1.jpg~45.jpg 있어야 합니다.
// 1~30 : students (뒷면), 31~45 : bible (앞면)

document.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById("board");
  const startBtn = document.getElementById("startBtn");
  const rankBtn = document.getElementById("rankBtn");
  const cardCountInput = document.getElementById("cardCount");
  const status = document.getElementById("status");
  const timer = document.getElementById("timer");
  const header = document.querySelector("header");
  
  const completeModal = document.getElementById("completeModal");
  const completeTime = document.getElementById("completeTime");
  const playerName = document.getElementById("playerName");
  const saveRankBtn = document.getElementById("saveRankBtn");
  const restartBtn = document.getElementById("restartBtn");
  
  const rankModal = document.getElementById("rankModal");
  const rankList = document.getElementById("rankList");
  const closeRankBtn = document.getElementById("closeRankBtn");
  const clearRankBtn = document.getElementById("clearRankBtn");

  let startTime;
  let timerInterval;
  let currentCardCount;

  // 초기 화면은 중앙 배치
  header.classList.add("centered");

  startBtn.addEventListener("click", startGame);
  rankBtn.addEventListener("click", showRankings);
  saveRankBtn.addEventListener("click", saveRanking);
  restartBtn.addEventListener("click", restart);
  closeRankBtn.addEventListener("click", () => rankModal.classList.remove("show"));
  clearRankBtn.addEventListener("click", clearRankings);

  function startGame() {
    let count = parseInt(cardCountInput.value, 10);
    if (isNaN(count) || count < 2 || count % 2 !== 0) {
      alert("짝수의 카드 수를 입력하세요.");
      return;
    }
    if (count > 30) {
      alert("최대 30장까지 가능합니다.");
      return;
    }

    const pairs = count / 2;
    if (pairs > 15) {
      alert("성경 인물 수의 한계로 최대 30장(15쌍)까지만 가능합니다.");
      return;
    }

    currentCardCount = count;
    
    // 헤더를 원래 위치로
    header.classList.remove("centered");
    rankBtn.style.display = "inline-block";
    
    // 타이머 시작
    startTime = Date.now();
    timer.style.display = "block";
    updateTimer();
    timerInterval = setInterval(updateTimer, 100);
    
    buildDeck(count);
  }

  function updateTimer() {
    const elapsed = Date.now() - startTime;
    const seconds = (elapsed / 1000).toFixed(1);
    timer.textContent = `시간: ${seconds}초`;
  }

  function stopTimer() {
    clearInterval(timerInterval);
    const elapsed = Date.now() - startTime;
    return (elapsed / 1000).toFixed(1);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function range(a, bInclusive) {
    const r = [];
    for (let i = a; i <= bInclusive; i++) r.push(i);
    return r;
  }

  function buildDeck(count) {
    board.innerHTML = "";
    status.textContent = "";

    const pairs = count / 2;
    const studentPool = shuffle(range(1, 30)); // 1..30
    const biblePool = shuffle(range(31, 45)); // 31..45

    const backs = studentPool.slice(0, count); // 학생 이미지들 (중복 없음)
    const frontsPicked = biblePool.slice(0, pairs); // 성경 이미지들 (pairs)
    const frontCards = shuffle([...frontsPicked, ...frontsPicked]); // 각 이미지 2장씩, 섞기

    // 카드 객체 배열
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push({
        id: i,
        backImg: `cards/${backs[i]}.jpg`,
        frontImg: `cards/${frontCards[i]}.jpg`,
        matched: false,
        flipped: false
      });
    }

    // 최적의 열 개수 계산 (가로 최대 8, 딱 떨어지는 배치 우선)
    let cols;
    if (count <= 8) {
      cols = count; // 8장 이하는 한 줄
    } else {
      // 8부터 역순으로 확인하여 딱 떨어지는 배치 찾기
      for (let c = 8; c >= 4; c--) {
        if (count % c === 0) {
          cols = c;
          break;
        }
      }
      // 딱 떨어지지 않으면 가로를 길게
      if (!cols) {
        cols = Math.min(8, Math.ceil(count / 3));
      }
    }

    board.style.gridTemplateColumns = `repeat(${cols}, var(--card-width))`;

    renderBoard(cards);
    
    // 보드 표시
    board.classList.add("visible");
  }

  let lock = false; // 비교중일 때 클릭 잠금

  function renderBoard(cards) {
    board.innerHTML = "";
    cards.forEach((card, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.dataset.index = card.id; // 안전하게 id 매핑

      const inner = document.createElement("div");
      inner.className = "card-inner";

      const faceBack = document.createElement("div");
      faceBack.className = "face back";
      faceBack.style.backgroundImage = `url('${card.backImg}')`;

      const faceFront = document.createElement("div");
      faceFront.className = "face front";
      faceFront.style.backgroundImage = `url('${card.frontImg}')`;

      inner.appendChild(faceBack);
      inner.appendChild(faceFront);
      cardEl.appendChild(inner);
      board.appendChild(cardEl);

      // 클릭 이벤트
      cardEl.addEventListener("click", () => {
        if (lock) return;
        if (card.matched || card.flipped) return;

        flip(cardEl, card, cards);
      });
    });

    status.textContent = "카드를 뒤집어 짝을 맞춰보세요.";
  }

  function flip(cardEl, cardObj, cards) {
    cardObj.flipped = true;
    cardEl.classList.add("is-flipped");

    const flipped = cards.filter(c => c.flipped && !c.matched);
    if (flipped.length === 2) {
      lock = true;
      setTimeout(() => {
        checkMatch(cards);
        lock = false;
      }, 800);
    }
  }

  function checkMatch(cards) {
    const flipped = cards.filter(c => c.flipped && !c.matched);
    if (flipped.length < 2) return;

    const a = flipped[0], b = flipped[1];

    // 실제 DOM 요소 선택은 data-index로 안전하게 찾음
    const aEl = document.querySelector(`.card[data-index="${a.id}"]`);
    const bEl = document.querySelector(`.card[data-index="${b.id}"]`);

    if (a.frontImg === b.frontImg) {
      // 맞음: matched 상태로 고정 (flipped 유지)
      a.matched = true;
      b.matched = true;
      a.flipped = true;
      b.flipped = true;

      if (aEl) {
        aEl.classList.add("matched", "is-flipped");
        aEl.style.pointerEvents = "none"; // 클릭 불가로 고정
      }
      if (bEl) {
        bEl.classList.add("matched", "is-flipped");
        bEl.style.pointerEvents = "none";
      }

      status.textContent = "맞았습니다!";
    } else {
      // 틀림: 뒤로 덮기
      a.flipped = false;
      b.flipped = false;
      if (aEl) aEl.classList.remove("is-flipped");
      if (bEl) bEl.classList.remove("is-flipped");
      status.textContent = "틀렸습니다. 다시 시도하세요.";
    }

    // 게임 종료 체크
    if (cards.every(c => c.matched)) {
      const finalTime = stopTimer();
      status.textContent = "축하합니다! 모든 짝을 맞췄습니다 🎉";
      
      // 완료 모달 표시
      setTimeout(() => {
        completeTime.textContent = `완료 시간: ${finalTime}초`;
        completeModal.classList.add("show");
        playerName.value = "";
        playerName.focus();
      }, 500);
    }
  }

  function saveRanking() {
    const name = playerName.value.trim();
    if (!name) {
      alert("이름을 입력하세요!");
      return;
    }

    const finalTime = parseFloat(completeTime.textContent.match(/[\d.]+/)[0]);
    
    // 로컬 스토리지에서 순위 가져오기
    let rankings = JSON.parse(localStorage.getItem("rankings") || "[]");
    
    rankings.push({
      name: name,
      time: finalTime,
      cards: currentCardCount,
      date: new Date().toISOString()
    });
    
    // 시간 순으로 정렬
    rankings.sort((a, b) => a.time - b.time);
    
    // 상위 50개만 저장
    rankings = rankings.slice(0, 50);
    
    localStorage.setItem("rankings", JSON.stringify(rankings));
    
    completeModal.classList.remove("show");
    alert("순위가 등록되었습니다!");
    showRankings();
  }

  function showRankings() {
    const rankings = JSON.parse(localStorage.getItem("rankings") || "[]");
    
    if (rankings.length === 0) {
      rankList.innerHTML = "<p style='color:#999; padding:40px;'>아직 등록된 순위가 없습니다.</p>";
    } else {
      rankList.innerHTML = rankings.map((rank, index) => `
        <div class="rank-item ${index < 3 ? 'top3' : ''}">
          <span class="rank-number">${index + 1}</span>
          <span class="rank-name">${rank.name}</span>
          <span class="rank-time">${rank.time}초 (${rank.cards}장)</span>
        </div>
      `).join('');
    }
    
    rankModal.classList.add("show");
  }

  function clearRankings() {
    if (confirm("정말 모든 순위를 삭제하시겠습니까?")) {
      localStorage.removeItem("rankings");
      showRankings();
    }
  }

  function restart() {
    completeModal.classList.remove("show");
    header.classList.add("centered");
    rankBtn.style.display = "none";
    board.innerHTML = "";
    board.classList.remove("visible");
    timer.style.display = "none";
    status.textContent = "";
  }
});
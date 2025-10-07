// script.js

const analyzeButton = document.getElementById('analyze-button');
const fileInput = document.getElementById('timetable-files');
const resultArea = document.getElementById('result-area');
const loadingIndicator = document.getElementById('loading');
const loadingText = loadingIndicator.querySelector('p'); // 로딩 텍스트 요소

// '분석 시작!' 버튼 클릭 이벤트
analyzeButton.addEventListener('click', async () => {
    if (fileInput.files.length === 0) {
        alert('시간표 사진을 선택해주세요!');
        return;
    }

    // 로딩 시작
    loadingIndicator.classList.remove('hidden');
    resultArea.innerHTML = '';
    
    try {
        let allText = '';
        const files = Array.from(fileInput.files);

        // Tesseract.js로 각 이미지를 순서대로 텍스트로 변환
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            loadingText.textContent = `이미지 분석 중 (${i + 1}/${files.length})... 잠시만 기다려주세요.`;
            
            const worker = await Tesseract.createWorker('kor'); // 한국어 모델 사용
            const ret = await worker.recognize(file);
            allText += ret.data.text + '\n';
            await worker.terminate(); // 작업 완료 후 worker 종료
        }

        loadingText.textContent = '분석 결과를 서버에서 받아오는 중...';

        // 추출된 전체 텍스트를 백엔드(Netlify 함수)로 전송
        const response = await fetch('/.netlify/functions/analyze', {
            method: 'POST',
            body: JSON.stringify({ text: allText }), // 이미지가 아닌 텍스트를 보냄
        });

        if (!response.ok) {
            throw new Error('서버에서 오류가 발생했습니다.');
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        console.error('분석 중 오류 발생:', error);
        resultArea.innerHTML = `<p style="color: red;">분석에 실패했습니다. 다시 시도해주세요.</p>`;
    } finally {
        loadingIndicator.classList.add('hidden');
        loadingText.textContent = '분석 중입니다... 잠시만 기다려주세요.'; // 기본 텍스트로 복구
    }
});

// 분석 결과를 HTML로 만들어 화면에 표시하는 함수 (이전과 동일)
function displayResults(data) {
    // ... (이전 코드와 동일하게 유지)
    let html = '<h2>🔍 분석 결과</h2>';
    for (const category in data) {
        const { description, completed, remaining } = data[category];
        html += `
            <div class="category-result">
                <h3>${category}</h3>
                <p>${description}</p>
                <p><strong>이수한 과목 ✅:</strong> ${completed.length > 0 ? completed.join(', ') : '없음'}</p>
                <p><strong>남은 과목 📝:</strong> ${remaining.length > 0 ? remaining.join(', ') : '없음'}</p>
            </div>
        `;
    }
    resultArea.innerHTML = html;
}

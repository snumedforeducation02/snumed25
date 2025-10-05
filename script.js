// 버튼과 파일 입력, 결과 영역을 가져옵니다.
const analyzeButton = document.getElementById('analyze-button');
const fileInput = document.getElementById('timetable-files');
const resultArea = document.getElementById('result-area');
const loadingIndicator = document.getElementById('loading');

// '분석 시작!' 버튼을 클릭했을 때의 동작
analyzeButton.addEventListener('click', async () => {
    // 선택된 파일이 없으면 함수 종료
    if (fileInput.files.length === 0) {
        alert('시간표 사진을 선택해주세요!');
        return;
    }

    // 로딩 표시를 보여주고, 이전 결과는 지웁니다.
    loadingIndicator.classList.remove('hidden');
    resultArea.innerHTML = '';

    // 'setTimeout' 부분을 아래 코드로 교체합니다.
try {
    // FormData는 파일 같은 복잡한 데이터를 보내기 위한 양식입니다.
    const formData = new FormData();
    for (const file of fileInput.files) {
        formData.append('images', file);
    }

    // 우리 백엔드 함수(/netlify/functions/analyze)에 요청을 보냅니다.
    const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        body: formData, // 이미지는 FormData로 보내야 합니다. (실제 구현 시 약간의 추가 처리 필요)
        // **주의**: 실제 파일 전송은 더 복잡합니다.
        // 우선은 파일 이름만 보내는 식으로 단순화해서 테스트해봅시다.
    });

    // 백엔드에서 보낸 결과를 JSON 형태로 변환합니다.
    const data = await response.json();

    // 받은 데이터를 화면에 예쁘게 표시합니다.
    let html = '<h3>분석 결과</h3>';
    html += '<h4>이수한 과목 ✅</h4>';
    html += `<ul>${data.completed.map(subject => `<li>${subject}</li>`).join('')}</ul>`;
    html += '<h4>남은 과목 📝</h4>';
    html += `<ul>${data.remaining.map(subject => `<li>${subject}</li>`).join('')}</ul>`;
    
    resultArea.innerHTML = html;

} catch (error) {
    console.error('분석 중 오류 발생:', error);
    resultArea.innerHTML = '<p>분석에 실패했습니다. 다시 시도해주세요.</p>';
} finally {
    // 에러가 나든 성공하든 로딩 표시는 숨깁니다.
    loadingIndicator.classList.add('hidden');
}
});



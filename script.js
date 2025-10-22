// HTML 요소들을 가져옵니다.
const analyzeButton = document.getElementById('analyze-button');
const resultArea = document.getElementById('result-area');
const loadingIndicator = document.getElementById('loading');

// '분석 시작!' 버튼 클릭 이벤트
analyzeButton.addEventListener('click', async () => {
    // 월 1회 사용 제한 로직 (기존과 동일)

    // 로딩 UI를 보여줍니다.
    loadingIndicator.classList.remove('hidden');
    resultArea.innerHTML = '';
    
    try {
        // --- 1. OCR 대신, 사용자가 선택한 과목 데이터를 수집합니다 ---
        const completedCourses = [];

        // 1-1. 체크된 '전공 필수' 과목들의 목록을 가져옵니다.
        document.querySelectorAll('#required-courses-list input[type="checkbox"]:checked').forEach(checkbox => {
            completedCourses.push(checkbox.value);
        });

        // 1-2. 선택된 '전공 선택' 과목들의 목록을 가져옵니다.
        document.querySelectorAll('#elective-courses-select option:checked').forEach(option => {
            completedCourses.push(option.value);
        });
        
        // 1-3. 수집된 모든 과목 이름을 공백으로 구분된 하나의 텍스트로 만듭니다.
        const allText = completedCourses.join(' ');

        // --- 2. 기존 비교과 체크리스트 데이터 수집 로직은 그대로 유지합니다 ---
        const checklistData = {
            'volunteer': document.getElementById('volunteer').checked,
            'cpr': document.getElementById('cpr').checked,
            'leadership': document.getElementById('leadership').checked,
            'reading': document.getElementById('reading').checked,
            'human': document.getElementById('human').checked,
            'study': document.getElementById('study').checked,
            'cpm': document.getElementById('cpm').checked,
            'teps': document.getElementById('teps').checked,
        };

        // --- 3. 백엔드로 교과목 텍스트와 비교과 데이터를 함께 전송합니다 ---
        const response = await fetch('/.netlify/functions/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: allText, checklist: checklistData }), 
        });

        if (!response.ok) {
            throw new Error('서버에서 오류가 발생했습니다.');
        }

        const data = await response.json();
        displayResults(data); // 결과를 화면에 표시

        // 분석 성공 시, 마지막 사용 시간을 저장합니다.
        localStorage.setItem('lastAnalysisTime', now.getTime());

    } catch (error) {
        console.error('분석 중 오류 발생:', error);
        resultArea.innerHTML = `<p class="error">분석에 실패했습니다: ${error.message}</p>`;
    } finally {
        // 로딩 UI를 숨깁니다.
        loadingIndicator.classList.add('hidden');
    }
});

// 분석 결과를 HTML로 만들어 화면에 표시하는 함수 (기존 코드와 동일)
function displayResults(data) {
    let html = '<h2>🔍 분석 결과</h2>';
    const categoryOrder = ["전공 필수", "전공 선택", "필수 교양", "학문의 세계", "예체능", "기타 이수 과목", "비교과"];
    const checklistLabels = {
        'volunteer': '60시간 이상의 봉사활동 (보라매병원 포함)', 'cpr': 'CPR 교육 이수',
        'leadership': '인성·리더십 교육 모듈1, 모듈2 이수', 'reading': '독서 일기 20편 이상 제출',
        'human': '인문사회계열 과목 20학점 이상 이수', 'study': '의학 연구의 실제(전선, 3학점) 수강',
        'cpm': 'CPM(맞춤형 교육과정) 이수', 'teps': 'TEPS 453점, IBT TOEFL 114점 이상'
    };
    
    for (const category of categoryOrder) {
        if (!data[category]) continue;
        const details = data[category];
        
        html += `<div class="category-result"><h3>${category}</h3>`;
        if (details.description) {
            html += `<p class="description">${details.description}</p>`;
        }
        html += `<div class="result-content">`;

        switch (details.displayType) {
            case 'list_all':
                html += `<p><strong>✅ 이수한 과목:</strong> ${details.completed.length > 0 ? details.completed.join(', ') : '없음'}</p>`;
                html += `<p><strong>📝 미이수 과목:</strong> ${details.remaining.length > 0 ? details.remaining.join(', ') : '없음'}</p>`;
                break;

            case 'list_remaining_custom':
                const remainingItems = details.remaining.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return "외국어 (택1)";
                    }
                    return item;
                });
                const uniqueRemainingItems = [...new Set(remainingItems)];
                html += `<p><strong>📝 미이수 항목:</strong> ${uniqueRemainingItems.length > 0 ? uniqueRemainingItems.join(', ') : '모두 이수 완료'}</p>`;
                break;

          case 'count':
    const completedCount = details.completed.length;
    const requiredCount = details.requiredCount;
    const isCompleted = completedCount >= requiredCount;
    // 남은 과목 개수를 계산합니다. (0보다 작아지지 않도록)
    const neededCount = Math.max(0, requiredCount - completedCount);

    // 상태 메시지에 "남은 개수"를 추가합니다.
    html += `<p class="summary ${isCompleted ? 'completed' : 'in-progress'}">
                <strong>상태: ${requiredCount}개 중 ${completedCount}개 이수 (${neededCount}개 남음) ${isCompleted ? '✔️' : ''}</strong>
             </p>`;

    // 이수한 과목 목록은 그대로 표시합니다.
    if (completedCount > 0) {
        html += `<p><strong>✅ 이수한 과목:</strong> ${details.completed.join(', ')}</p>`;
    }
    break;

            case 'group_count':
                const isGroupCompleted = details.completedCount >= details.requiredCount;
                html += `<p class="summary ${isGroupCompleted ? 'completed' : 'in-progress'}">
                            <strong>상태: 5개 영역 중 ${details.completedCount}개 영역 이수 (3개 이상 필요) ${isGroupCompleted ? '✔️' : ''}</strong>
                         </p>`;
                if (details.completed.length > 0) {
                    const completedCoursesWithGroup = details.completed.map(c => `${c.name} (${c.group})`);
                    html += `<p><strong>✅ 이수한 과목 (영역):</strong> ${completedCoursesWithGroup.join(', ')}</p>`;
                }
                if (details.remaining.length > 0) {
                    html += `<p><strong>📝 남은 영역:</strong> ${details.remaining.join(', ')}</p>`;
                }
                break;
            
            case 'list_completed_only':
                if (details.completed.length > 0) {
                  html += `<p><strong>✅ 이수한 과목:</strong> ${details.completed.join(', ')}</p>`;
                } else {
                  html += `<p>이수한 과목이 없습니다.</p>`;
                }
                break;
                
            case 'checklist':
                const requiredKeys = ['volunteer', 'cpr', 'leadership', 'reading'];
                const reqCompleted = [];
                const reqIncomplete = [];
                const elecCompleted = [];
                const requiredElecCount = 2;

                for (const key in details.data) {
                    const label = checklistLabels[key];
                    if (requiredKeys.includes(key)) {
                        if (details.data[key]) {
                            reqCompleted.push(label);
                        } else {
                            reqIncomplete.push(label);
                        }
                    } else {
                        if (details.data[key]) {
                            elecCompleted.push(label);
                        }
                    }
                }
                
                html += `<p><strong>✅ 완료한 필수 요건:</strong> ${reqCompleted.length > 0 ? reqCompleted.join(', ') : '없음'}</p>`;
                html += `<p><strong>📝 남은 필수 요건:</strong> ${reqIncomplete.length > 0 ? reqIncomplete.join(', ') : '모두 완료'}</p>`;
                
                const neededElecCount = Math.max(0, requiredElecCount - elecCompleted.length);
                const isElecCompleted = neededElecCount === 0;

                html += `<p class="summary ${isElecCompleted ? 'completed' : 'in-progress'}">
                            <strong>선택 요건 상태: ${requiredElecCount}개 이상 중 ${elecCompleted.length}개 완료 (${neededElecCount}개 더 필요) ${isElecCompleted ? '✔️' : ''}</strong>
                         </p>`;
                if (elecCompleted.length > 0) {
                    html += `<p><strong>✅ 완료한 선택 요건:</strong> ${elecCompleted.join(', ')}</p>`;
                }
                break;
        }
        html += `</div></div>`;
    }
    resultArea.innerHTML = html;
}

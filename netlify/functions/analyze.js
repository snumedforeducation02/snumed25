// Netlify 함수의 기본 형식
exports.handler = async (event, context) => {
    // event.body에 프론트엔드에서 보낸 데이터가 들어옵니다.
    const requestBody = JSON.parse(event.body);
    const images = requestBody.images; // 이미지 데이터 배열

    // TODO:
    // 1. 받은 이미지 데이터를 이용해 OCR API 호출하기
    // 2. OCR 결과로 받은 텍스트에서 과목명 추출하기
    // 3. 수료 기준 데이터와 비교하기
    // 4. 분석 결과 만들기

    // 임시 결과 데이터
    const analysisResult = {
        completed: ['자료구조', '알고리즘'],
        remaining: ['운영체제', '네트워크']
    };

    return {
        statusCode: 200, // 성공했다는 의미
        body: JSON.stringify(analysisResult), // 프론트엔드로 보낼 결과 데이터
    };
};
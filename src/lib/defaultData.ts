import { Flashcard } from '../types';
import { createInitialCard } from './srs';

const defaultWords = [
  // Level 1: 기초 (Beginner)
  { level: 1, word: 'Xin chào', meaning: '안녕하세요', hanja: '', example: 'Xin chào, tôi là người Hàn Quốc.', translation: '안녕하세요, 저는 한국인입니다.' },
  { level: 1, word: 'Cảm ơn', meaning: '감사합니다', hanja: '感恩', example: 'Cảm ơn bạn rất nhiều.', translation: '정말 감사합니다.' },
  { level: 1, word: 'Ăn', meaning: '먹다', hanja: '', example: 'Tôi đang ăn phở.', translation: '저는 쌀국수를 먹고 있습니다.' },
  { level: 1, word: 'Uống', meaning: '마시다', hanja: '', example: 'Tôi muốn uống cà phê đá.', translation: '저는 아이스 커피를 마시고 싶습니다.' },
  { level: 1, word: 'Gia đình', meaning: '가족', hanja: '家庭', example: 'Gia đình tôi có 4 người.', translation: '우리 가족은 4명입니다.' },
  
  // Level 2: 초급 (Elementary)
  { level: 2, word: 'Công việc', meaning: '일, 직업', hanja: '工作', example: 'Công việc của bạn dạo này thế nào?', translation: '요즘 당신의 일은 어떻습니까?' },
  { level: 2, word: 'Du lịch', meaning: '여행하다', hanja: '遊歷', example: 'Năm sau tôi sẽ đi du lịch Việt Nam.', translation: '내년에 저는 베트남으로 여행을 갈 것입니다.' },
  { level: 2, word: 'Học tập', meaning: '학습하다, 공부하다', hanja: '學習', example: 'Việc học tập ngoại ngữ rất quan trọng.', translation: '외국어 학습은 매우 중요합니다.' },
  { level: 2, word: 'Sức khỏe', meaning: '건강', hanja: '', example: 'Sức khỏe là vàng.', translation: '건강이 금(최고)입니다.' },
  { level: 2, word: 'Thời tiết', meaning: '날씨', hanja: '時節', example: 'Thời tiết hôm nay rất đẹp.', translation: '오늘 날씨가 매우 좋습니다.' },

  // Level 3: 중급 (Intermediate)
  { level: 3, word: 'Kinh nghiệm', meaning: '경험', hanja: '經驗', example: 'Anh ấy có nhiều kinh nghiệm trong lĩnh vực IT.', translation: '그는 IT 분야에 많은 경험이 있습니다.' },
  { level: 3, word: 'Phát triển', meaning: '발전하다, 개발하다', hanja: '發展', example: 'Kinh tế Việt Nam đang phát triển nhanh chóng.', translation: '베트남 경제는 빠르게 발전하고 있습니다.' },
  { level: 3, word: 'Môi trường', meaning: '환경', hanja: '環境', example: 'Chúng ta cần bảo vệ môi trường sống.', translation: '우리는 생활 환경을 보호해야 합니다.' },
  { level: 3, word: 'Quyết định', meaning: '결정하다', hanja: '決定', example: 'Tôi đã quyết định học tiếng Việt mỗi ngày.', translation: '나는 매일 베트남어를 공부하기로 결정했습니다.' },
  { level: 3, word: 'Trách nhiệm', meaning: '책임', hanja: '責任', example: 'Mỗi người đều có trách nhiệm với công việc của mình.', translation: '모든 사람은 자신의 일에 책임이 있습니다.' },

  // Level 4: 고급 (Upper Intermediate)
  { level: 4, word: 'Khủng hoảng', meaning: '위기', hanja: '恐慌', example: 'Công ty đang đối mặt với khủng hoảng tài chính.', translation: '회사는 재정 위기에 직면해 있습니다.' },
  { level: 4, word: 'Đàm phán', meaning: '협상하다', hanja: '談判', example: 'Cuộc đàm phán giữa hai công ty đã thành công.', translation: '두 회사 간의 협상이 성공했습니다.' },
  { level: 4, word: 'Chiến lược', meaning: '전략', hanja: '戰略', example: 'Chúng ta cần một chiến lược tiếp thị mới.', translation: '우리는 새로운 마케팅 전략이 필요합니다.' },
  { level: 4, word: 'Đầu tư', meaning: '투자하다', hanja: '投資', example: 'Nhiều công ty nước ngoài đang đầu tư vào Việt Nam.', translation: '많은 외국 기업들이 베트남에 투자하고 있습니다.' },
  { level: 4, word: 'Thỏa hiệp', meaning: '타협하다', hanja: '妥協', example: 'Hai bên đã đạt được một thỏa hiệp quan trọng.', translation: '양측은 중요한 타협에 도달했습니다.' },

  // Level 5: 최고급 (Advanced)
  { level: 5, word: 'Toàn cầu hóa', meaning: '세계화', hanja: '全球化', example: 'Toàn cầu hóa mang lại cả cơ hội và thách thức.', translation: '세계화는 기회와 도전을 동시에 가져옵니다.' },
  { level: 5, word: 'Bền vững', meaning: '지속 가능한', hanja: '', example: 'Phát triển bền vững là mục tiêu của nhiều quốc gia.', translation: '지속 가능한 발전은 nhiều 국가의 목표입니다.' },
  { level: 5, word: 'Triết lý', meaning: '철학', hanja: '哲理', example: 'Triết lý kinh doanh của họ rất độc đáo.', translation: '그들의 경영 철학은 매우 독특합니다.' },
  { level: 5, word: 'Đa dạng sinh học', meaning: '생물 다양성', hanja: '多樣生物學', example: 'Bảo tồn đa dạng sinh học là vấn đề cấp bách.', translation: '생물 다양성 보존은 시급한 문제입니다.' },
  { level: 5, word: 'Định kiến', meaning: '편견', hanja: '定見', example: 'Chúng ta cần xóa bỏ những định kiến trong xã hội.', translation: '우리는 사회의 편견들을 없애야 합니다.' }
];

export const getDefaultCards = (): Flashcard[] => {
  return defaultWords.map((w, i) => createInitialCard({
    id: `default_${i}`,
    ...w
  }));
};

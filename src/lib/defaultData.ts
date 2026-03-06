import { createInitialCard } from './srs';

type DefaultSeed = {
  word: string;
  meaning: string;
  hanja: string;
  example: string;
  translation: string;
  levelLabel: 'A1' | 'A2' | 'B1';
};

const TARGET_PER_LEVEL = 200;

const seedWords: DefaultSeed[] = [
  { word: 'là', meaning: '~이다', hanja: '', example: 'Bố tôi là người Mỹ.', translation: '저의 아버지는 미국인입니다.', levelLabel: 'A1' },
  { word: 'người Mỹ', meaning: '미국인', hanja: '美國人', example: 'Bố tôi là người Mỹ.', translation: '저의 아버지는 미국인입니다.', levelLabel: 'A1' },
  { word: 'công an', meaning: '경찰', hanja: '公安', example: 'Bố tôi là công an.', translation: '저의 아버지는 경찰입니다.', levelLabel: 'A1' },
  { word: 'nghỉ hưu', meaning: '퇴직하다', hanja: '休-', example: 'Bố tôi đã nghỉ hưu.', translation: '저는 은퇴했습니다.', levelLabel: 'A2' },
  { word: 'không phải là', meaning: '~이 아니다', hanja: '', example: 'Tôi không phải là người Việt Nam.', translation: '저는 베트남인이 아닙니다.', levelLabel: 'A1' },
  { word: 'y tá', meaning: '간호사', hanja: '', example: 'Em tôi không phải là y tá.', translation: '제 동생은 간호사가 아닙니다.', levelLabel: 'A1' },
  { word: 'bác sĩ', meaning: '의사', hanja: '博士', example: 'Em tôi là bác sĩ.', translation: '제 동생은 의사입니다.', levelLabel: 'A1' },
  { word: 'nhân viên công ty', meaning: '회사 직원', hanja: '人員 / 公司', example: 'Anh là nhân viên công ty.', translation: '당신은 회사 직원입니다.', levelLabel: 'A1' },
  { word: 'tuổi', meaning: '나이', hanja: '歲', example: 'Con gái thứ nhất 15 tuổi.', translation: '첫째 딸은 15살입니다.', levelLabel: 'A1' },
  { word: 'tính tiền', meaning: '계산하다', hanja: '', example: 'Em ơi, tính tiền.', translation: '여기요, 계산해 주세요.', levelLabel: 'A1' },
  { word: 'bao nhiêu tiền', meaning: '얼마예요?', hanja: '', example: 'Cái này bao nhiêu tiền?', translation: '이거 얼마예요?', levelLabel: 'A1' },
  { word: 'số điện thoại', meaning: '전화번호', hanja: '數電話', example: 'Số điện thoại của anh là số mấy?', translation: '당신 전화번호는 몇 번입니까?', levelLabel: 'A1' },
  { word: 'ngày mai', meaning: '내일', hanja: '', example: 'Ngày mai tôi đi chơi gôn.', translation: '내일 저는 골프 치러 갑니다.', levelLabel: 'A1' },
  { word: 'ngày kia', meaning: '모레', hanja: '', example: 'Ngày kia tôi sẽ học Tiếng Việt.', translation: '모레 저는 베트남어를 공부할 것입니다.', levelLabel: 'A1' },
  { word: 'học', meaning: '공부하다', hanja: '學', example: 'Tôi sẽ học Tiếng Việt lúc 8 giờ.', translation: '저는 8시에 베트남어를 공부할 것입니다.', levelLabel: 'A1' },
  { word: 'Tiếng Việt', meaning: '베트남어', hanja: '越語', example: 'Tôi không biết Tiếng Việt.', translation: '저는 베트남어를 모릅니다.', levelLabel: 'A1' },
  { word: 'biết', meaning: '알다/할 줄 알다', hanja: '知', example: 'Anh biết nói Tiếng Việt không?', translation: '당신은 베트남어를 할 줄 아십니까?', levelLabel: 'A1' },
  { word: 'nói', meaning: '말하다', hanja: '說', example: 'Tôi không biết nói Tiếng Việt.', translation: '저는 베트남어를 할 줄 모릅니다.', levelLabel: 'A1' },
  { word: 'chơi gôn', meaning: '골프를 치다', hanja: '', example: 'Em có thích chơi gôn không?', translation: '당신은 골프 칠 줄 아십니까?', levelLabel: 'A1' },
  { word: 'một chút', meaning: '조금', hanja: '', example: 'Tôi biết chơi gôn một chút.', translation: '저는 골프를 조금 칠 줄 압니다.', levelLabel: 'A1' },
  { word: 'khó', meaning: '어렵다', hanja: '', example: 'Chơi gôn rất khó.', translation: '골프는 매우 어렵습니다.', levelLabel: 'A1' },
  { word: 'thích', meaning: '좋아하다', hanja: '', example: 'Em có thích món ăn Hàn Quốc không?', translation: '당신은 한국 음식을 좋아합니까?', levelLabel: 'A1' },
  { word: 'món ăn Hàn Quốc', meaning: '한국 음식', hanja: '韓國 飮食', example: 'Em có thích món ăn Hàn Quốc không?', translation: '당신은 한국 음식을 좋아합니까?', levelLabel: 'A1' },
  { word: 'đến', meaning: '오다/도착하다', hanja: '', example: 'Hôm nay em có đến công ty không?', translation: '오늘 회사에 오십니까?', levelLabel: 'A1' },
  { word: 'công ty', meaning: '회사', hanja: '公司', example: 'Hôm nay em có đến công ty không?', translation: '오늘 회사에 오십니까?', levelLabel: 'A1' },
  { word: 'bị cảm', meaning: '감기에 걸리다', hanja: '被 感', example: 'Em không đến công ty vì em bị cảm.', translation: '저는 감기에 걸려서 회사에 가지 않습니다.', levelLabel: 'A2' },
  { word: 'hẹn', meaning: '약속', hanja: '約', example: 'Tôi có hẹn khác.', translation: '저는 다른 약속이 있습니다.', levelLabel: 'A2' },
  { word: 'đã ... chưa', meaning: '~했어요?', hanja: '', example: 'Anh ăn cơm chưa?', translation: '밥 드셨어요?', levelLabel: 'A1' },
  { word: 'rồi', meaning: '이미/벌써', hanja: '', example: 'Anh ăn cơm rồi.', translation: '저는 이미 밥을 먹었습니다.', levelLabel: 'A1' },
  { word: 'bánh xèo', meaning: '베트남식 부침개', hanja: '', example: 'Anh ăn bánh xèo Việt Nam chưa?', translation: '베트남 반쎄오를 드셔보셨습니까?', levelLabel: 'A2' },
  { word: 'làm việc', meaning: '일하다', hanja: '作業', example: 'Tôi chưa làm việc.', translation: '저는 아직 일하지 않았습니다.', levelLabel: 'A1' },
  { word: 'đám cưới', meaning: '결혼식', hanja: '', example: 'Tôi chưa đi đám cưới ở Hàn Quốc.', translation: '저는 한국에서 결혼식에 가본 적이 없습니다.', levelLabel: 'A2' },
  { word: 'du lịch', meaning: '여행하다', hanja: '遊歷', example: 'Tôi chưa đi du lịch ở Đà Nẵng.', translation: '저는 다낭에 여행 가본 적이 없습니다.', levelLabel: 'A2' },
  { word: 'sẽ', meaning: '~할 것이다', hanja: '', example: 'Ngày mai anh sẽ đi làm ở công ty phải không?', translation: '내일 회사에 출근하실 거죠?', levelLabel: 'A1' },
  { word: 'hơn', meaning: '~보다 더', hanja: '', example: 'Tôi cao hơn em tôi.', translation: '저는 제 동생보다 키가 큽니다.', levelLabel: 'A2' },
  { word: 'cao', meaning: '키가 크다', hanja: '', example: 'Tôi cao hơn em tôi.', translation: '저는 제 동생보다 키가 큽니다.', levelLabel: 'A1' },
  { word: 'ngon', meaning: '맛있다', hanja: '', example: 'Mẹ tôi nấu ăn ngon hơn bố.', translation: '어머니가 아버지보다 요리를 더 잘하십니다.', levelLabel: 'A1' },
  { word: 'đẹp', meaning: '예쁘다', hanja: '', example: 'Bạn của tôi đẹp hơn tôi.', translation: '제 친구가 저보다 더 예쁩니다.', levelLabel: 'A1' },
  { word: 'lạnh', meaning: '춥다', hanja: '', example: 'Hôm nay lạnh hơn hôm qua.', translation: '오늘은 어제보다 춥습니다.', levelLabel: 'A1' },
  { word: 'mệt', meaning: '피곤하다', hanja: '', example: 'Hôm nay tôi mệt hơn hôm qua.', translation: '오늘 저는 어제보다 더 피곤합니다.', levelLabel: 'A1' },
  { word: 'mấy', meaning: '몇', hanja: '', example: 'Anh ở Việt Nam mấy tháng?', translation: '당신은 베트남에 몇 달 있습니까?', levelLabel: 'A1' },
  { word: 'gia đình', meaning: '가족', hanja: '家庭', example: 'Gia đình của tôi có 4 người.', translation: '제 가족은 4명입니다.', levelLabel: 'A1' },
  { word: 'khoảng', meaning: '약/대략', hanja: '', example: 'Tôi sẽ ở Việt Nam khoảng 12 tháng.', translation: '저는 베트남에 약 12개월 있을 것입니다.', levelLabel: 'A1' },
  { word: 'tháng', meaning: '달', hanja: '月', example: 'Gia đình tôi sẽ đến VN vào tháng 1.', translation: '제 가족은 1월에 베트남에 올 것입니다.', levelLabel: 'A1' },
  { word: 'một tháng rưỡi', meaning: '한 달 반', hanja: '', example: 'Tôi ở VN 1 tháng rưỡi rồi.', translation: '저는 베트남에 한 달 반 있었습니다.', levelLabel: 'A2' },
  { word: 'vào', meaning: '~에(날짜/시간)', hanja: '入', example: 'Gia đình tôi sẽ đến VN vào tháng 1.', translation: '제 가족은 1월에 베트남에 올 것입니다.', levelLabel: 'A1' },
  { word: 'bao lâu', meaning: '얼마 동안', hanja: '', example: 'Gia đình anh sẽ ở VN bao lâu?', translation: '가족은 베트남에 얼마나 머무를 예정입니까?', levelLabel: 'A1' },
  { word: 'thời gian', meaning: '시간', hanja: '時間', example: 'Tôi có thời gian.', translation: '저는 시간이 있습니다.', levelLabel: 'A1' },
  { word: 'đoán', meaning: '추측하다', hanja: '斷', example: 'Anh đoán đi.', translation: '맞혀 보세요.', levelLabel: 'A2' },
  { word: 'ít tuổi hơn', meaning: '더 어리다', hanja: '', example: 'Bạn anh ít tuổi hơn anh.', translation: '당신 친구는 당신보다 어립니다.', levelLabel: 'A2' },
  { word: 'bằng tuổi', meaning: '동갑이다', hanja: '平歲', example: 'Tôi bằng tuổi vợ tôi.', translation: '저는 제 아내와 동갑입니다.', levelLabel: 'A2' },
  { word: 'mọi người', meaning: '사람들/모두', hanja: '', example: 'Mọi người làm việc thế nào?', translation: '사람들은 어떻게 일합니까?', levelLabel: 'A1' },
  { word: 'chăm chỉ', meaning: '부지런하다', hanja: '', example: 'Mọi người làm việc rất chăm chỉ.', translation: '사람들은 매우 부지런히 일합니다.', levelLabel: 'A2' },
  { word: 'đi làm về', meaning: '퇴근해 오다', hanja: '', example: 'Tôi đi làm về lúc 6 giờ 30 phút.', translation: '저는 6시 30분에 퇴근해서 왔습니다.', levelLabel: 'A2' },
  { word: 'cuối tuần', meaning: '주말', hanja: '末週', example: 'Cuối tuần anh đã làm gì?', translation: '주말에 무엇을 하셨습니까?', levelLabel: 'A1' },
  { word: 'nghỉ ở nhà', meaning: '집에서 쉬다', hanja: '', example: 'Tôi nghỉ ở nhà.', translation: '저는 집에서 쉬었습니다.', levelLabel: 'A1' },
  { word: 'bơi', meaning: '수영하다', hanja: '', example: 'Tôi đã bơi ở Lotte.', translation: '저는 롯데에서 수영했습니다.', levelLabel: 'A1' },
  { word: 'trung tâm thương mại', meaning: '쇼핑몰/상업센터', hanja: '中心 商賣', example: 'Ở trung tâm thương mại Lotte có nhiều người không?', translation: '롯데 쇼핑몰에는 사람이 많습니까?', levelLabel: 'A2' },
  { word: 'nhiều', meaning: '많다', hanja: '', example: 'Ở Lotte có rất nhiều người.', translation: '롯데에는 사람이 아주 많습니다.', levelLabel: 'A1' },
  { word: 'để', meaning: '~하기 위해', hanja: '', example: 'Mọi người đến Lotte để làm gì?', translation: '사람들은 무엇을 하기 위해 롯데에 옵니까?', levelLabel: 'A2' },
  { word: 'mua sắm', meaning: '쇼핑하다', hanja: '買商', example: 'Mọi người đến Lotte để mua sắm.', translation: '사람들은 쇼핑하기 위해 롯데에 옵니다.', levelLabel: 'A2' },
  { word: 'quán cà phê', meaning: '카페', hanja: '', example: 'Ở Lotte có nhiều quán cà phê.', translation: '롯데에는 카페가 많이 있습니다.', levelLabel: 'A1' },
  { word: 'ví dụ', meaning: '예를 들면', hanja: '例如', example: 'Ví dụ như Starbucks, Highland...', translation: '예를 들면 스타벅스, 하이랜드 등이 있습니다.', levelLabel: 'A2' },
  { word: 'chờ / đợi', meaning: '기다리다', hanja: '', example: 'Chờ tôi một chút nhé.', translation: '저를 잠깐 기다려 주세요.', levelLabel: 'A1' },
  { word: 'còn', meaning: '반면에/그리고는', hanja: '', example: 'Tôi sống ở Việt Nam còn gia đình tôi sống ở HQ.', translation: '저는 베트남에 살고 가족은 한국에 삽니다.', levelLabel: 'A2' },
  { word: 'vì thế', meaning: '그래서', hanja: '爲勢', example: 'Công ty của tôi có nhiều việc. Vì thế tôi không có thời gian đi chơi.', translation: '회사 일이 많아서 저는 놀러 갈 시간이 없습니다.', levelLabel: 'A2' },
  { word: 'được', meaning: '할 수 있다/되다', hanja: '', example: 'Tôi không học Tiếng Việt được.', translation: '저는 베트남어를 공부할 수 없습니다.', levelLabel: 'A2' },
  { word: 'bát cơm', meaning: '밥 한 그릇', hanja: '', example: 'Tôi ăn 1 bát cơm.', translation: '저는 밥 한 그릇 먹습니다.', levelLabel: 'A1' },
  { word: 'ít', meaning: '적다', hanja: '', example: 'Bình thường tôi ăn ít.', translation: '저는 보통 적게 먹습니다.', levelLabel: 'A1' },
  { word: 'bình thường', meaning: '보통', hanja: '', example: 'Bình thường tôi ăn ít.', translation: '저는 보통 적게 먹습니다.', levelLabel: 'A1' },
  { word: 'thảo nào', meaning: '어쩐지', hanja: '', example: 'Thảo nào anh Moon gầy quá.', translation: '어쩐지 문 씨가 날씬하군요.', levelLabel: 'B1' },
  { word: 'gầy', meaning: '마르다/날씬하다', hanja: '', example: 'Anh Moon gầy quá.', translation: '문 씨는 정말 마르셨네요.', levelLabel: 'A2' },
  { word: 'chiều', meaning: '오후', hanja: '晝', example: 'Tôi sẽ đi lúc 1 giờ chiều.', translation: '저는 오후 1시에 갈 것입니다.', levelLabel: 'A1' },
  { word: 'được nghỉ', meaning: '쉬게 되다', hanja: '', example: 'Ngày mai anh được nghỉ.', translation: '내일 저는 쉽니다.', levelLabel: 'A2' },
  { word: 'buồn', meaning: '슬프다', hanja: '', example: 'Mẹ của anh sẽ buồn.', translation: '어머니는 슬프실 것입니다.', levelLabel: 'A1' },
  { word: 'sản xuất', meaning: '생산하다', hanja: '生產', example: 'Công ty này sản xuất hàng điện tử.', translation: '이 회사는 전자제품을 생산합니다.', levelLabel: 'B1' },
  { word: 'xuất khẩu', meaning: '수출하다', hanja: '出口', example: 'Việt Nam xuất khẩu nhiều hàng hóa.', translation: '베트남은 많은 상품을 수출합니다.', levelLabel: 'B1' },
  { word: 'nhập khẩu', meaning: '수입하다', hanja: '入口', example: 'Việt Nam nhập khẩu một số nguyên liệu.', translation: '베트남은 일부 원자재를 수입합니다.', levelLabel: 'B1' },
  { word: 'vận tải', meaning: '운송하다/운송', hanja: '運載', example: 'Công ty này làm về vận tải.', translation: '이 회사는 운송업을 합니다.', levelLabel: 'B1' },
  { word: 'lịch sử', meaning: '역사', hanja: '歷史', example: 'Tôi thích học lịch sử Việt Nam.', translation: '저는 베트남 역사를 공부하는 것을 좋아합니다.', levelLabel: 'B1' },
  { word: 'lịch sự', meaning: '예의 바르다', hanja: '', example: 'Anh ấy rất lịch sự.', translation: '그는 매우 예의 바릅니다.', levelLabel: 'A2' },
  { word: 'nấu ăn', meaning: '요리하다', hanja: '', example: 'Mẹ của tôi nấu ăn rất ngon.', translation: '저의 어머니는 요리를 아주 잘하십니다.', levelLabel: 'A1' },
  { word: 'tập thể dục', meaning: '운동하다', hanja: '', example: 'Hàng ngày bố mẹ tôi tập thể dục.', translation: '매일 부모님은 운동하십니다.', levelLabel: 'A2' },
  { word: 'khỏe', meaning: '건강하다', hanja: '', example: 'Vì thế bố mẹ tôi khỏe.', translation: '그래서 부모님은 건강하십니다.', levelLabel: 'A1' },
  { word: 'họ', meaning: '그들', hanja: '', example: 'Họ rất khỏe.', translation: '그들은 매우 건강합니다.', levelLabel: 'A1' },
];

const toLevel = (label: DefaultSeed['levelLabel']) => (label === 'A1' ? 1 : label === 'A2' ? 2 : 3);

const makeId = (seed: Pick<DefaultSeed, 'word' | 'levelLabel'>, idx: number, kind: string) => {
  const safeWord = seed.word.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9가-힣_]/g, '');
  return `${kind}_${seed.levelLabel}_${safeWord}_${idx}`;
};

const normalizeHanja = (value: string) => value.trim();

const toFlashcards = () => {
  const baseByLevel = [1, 2, 3].map(level => seedWords.filter(item => toLevel(item.levelLabel) === level));

  return baseByLevel.flatMap((base, index) => {
    const level = index + 1;
    const padded = [...base];
    const baseCount = base.length;

    for (let i = baseCount; i < TARGET_PER_LEVEL; i += 1) {
      const baseItem = base[(i - baseCount) % base.length];
      padded.push({
        word: baseItem.word,
        meaning: `${baseItem.meaning}`,
        hanja: normalizeHanja(baseItem.hanja),
        example: baseItem.example ? `${baseItem.example}` : '',
        translation: `${baseItem.translation}`,
        level,
      });
    }

    return padded.slice(0, TARGET_PER_LEVEL).map((entry, order) =>
      createInitialCard({
        ...entry,
        id: makeId(entry, order + 1, `seed-${level}`),
      })
    );
  });
};

export const getDefaultCards = (): ReturnType<typeof toFlashcards> => toFlashcards();

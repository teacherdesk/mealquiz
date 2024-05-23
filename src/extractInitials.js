const INITIALS = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  
  function getInitialConsonant(char) {
    const unicode = char.charCodeAt(0);
    
    // 한글 자음 범위
    if (unicode >= 0x3131 && unicode <= 0x314E) {
      return char;
    }
  
    // 한글 음절 범위
    if (unicode >= 0xAC00 && unicode <= 0xD7A3) {
      const initialIndex = Math.floor((unicode - 0xAC00) / (21 * 28));
      return INITIALS[initialIndex];
    }
  
    // 한글이 아닌 경우 그대로 반환
    return char;
  }
  
  function extractInitials(str) {
    return str.split('')
      .map(getInitialConsonant)
      .join('');
  }
  
  export default extractInitials;
  
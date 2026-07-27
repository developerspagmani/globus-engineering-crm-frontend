/**
 * Converts a number to words in Indian numbering system.
 * (e.g., 1,00,000 -> One Lakh)
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    return '';
  };

  const integerPart = Math.floor(num);
  const paise = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && paise > 0) {
    return `${convert(paise)} Paise Only`;
  }

  let n = integerPart;
  let result = '';

  const crore = Math.floor(n / 10000000);
  if (crore > 0) {
    result += convert(crore) + ' Crore ';
    n %= 10000000;
  }
  
  const currentLakh = Math.floor(n / 100000);
  if (currentLakh > 0) {
    result += convert(currentLakh) + ' Lakh ';
    n %= 100000;
  }
  
  const currentThousand = Math.floor(n / 1000);
  if (currentThousand > 0) {
    result += convert(currentThousand) + ' Thousand ';
    n %= 1000;
  }
  
  const currentRemainder = Math.floor(n);
  if (currentRemainder > 0) {
    result += convert(currentRemainder);
  }

  let words = result.trim();
  if (paise > 0) {
    words += ` and ${convert(paise)} Paise`;
  }

  return words + ' Only';
};

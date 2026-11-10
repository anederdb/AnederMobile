/** wa.me link for a phone number as members type it (Turkish national format by default); null if it cannot be dialed. */
export function whatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

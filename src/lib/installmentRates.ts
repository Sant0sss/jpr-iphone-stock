// Taxas oficiais de parcelamento
export const INSTALLMENT_RATES: Record<number, number> = {
  1: 0,
  2: 4.7,
  3: 5.55,
  4: 6.4,
  5: 7.25,
  6: 8.1,
  7: 8.54,
  8: 9.39,
  9: 10.24,
  10: 11.09,
  11: 11.94,
  12: 12.79,
  13: 13.94,
  14: 14.79,
  15: 15.64,
  16: 16.49,
  17: 17.34,
  18: 18.19,
};

export const calculateInstallment = (baseValue: number, installments: number) => {
  const rate = INSTALLMENT_RATES[installments] || 0;
  const finalValue = baseValue * (1 + rate / 100);
  const installmentValue = finalValue / installments;
  
  return {
    finalValue,
    installmentValue,
    rate,
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

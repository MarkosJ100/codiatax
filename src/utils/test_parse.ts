function parseSpanishNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    try {
        const numStr = String(val).replace(/[^\d,.-]/g, '');
        return parseFloat(numStr.replace(',', '.'));
    } catch (e) {
        return 0;
    }
}

console.log('10,50 =>', parseSpanishNumber('10,50'));
console.log('10.50 =>', parseSpanishNumber('10.50'));
console.log('"10,50" =>', parseSpanishNumber('"10,50"'));
console.log('1.050,55 =>', parseSpanishNumber('1.050,55'));
console.log('1,050.55 =>', parseSpanishNumber('1,050.55'));

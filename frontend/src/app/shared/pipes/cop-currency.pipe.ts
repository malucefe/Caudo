import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'copCurrency' })
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$ 0';
    return `$ ${num.toLocaleString('es-CO')}`;
  }
}

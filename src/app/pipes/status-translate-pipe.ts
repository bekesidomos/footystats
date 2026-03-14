import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusTranslate',
  standalone: true
})
export class StatusTranslatePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'FINISHED': return 'Match finished';
      case 'SCHEDULED': return 'Match scheduled';
      case 'TIMED': return 'Match timed';
      case 'IN_PLAY': return 'Match Live';
      case 'PAUSED': return 'Match paused';
      default: return value;
    }
  }

}

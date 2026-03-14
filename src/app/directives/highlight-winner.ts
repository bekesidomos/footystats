import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightWinner]',
  standalone: true
})
export class HighlightWinnerDirective implements OnChanges {
  @Input() scoreHome: number = 0;
  @Input() scoreAway: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    if (this.scoreHome > this.scoreAway) {
      this.renderer.setStyle(this.el.nativeElement, 'color', 'green');
    } else if (this.scoreHome < this.scoreAway) {
      this.renderer.setStyle(this.el.nativeElement, 'color', 'red'); 
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'color', 'black');
    }
  }
}
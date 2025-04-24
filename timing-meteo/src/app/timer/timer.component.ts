import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timer-container">
      <div class="time-display">
        <div class="current-time">{{ currentTime }}</div>
        <div class="target-time">{{ targetTime }}</div>
      </div>
      
      <div class="dial-container">
        <div class="dial" 
             [style.transform]="'rotate(' + rotation + 'deg)'"
             (mousedown)="startRotating($event)"
             (touchstart)="startRotating($event, true)"
             #dial>
          <div class="dial-marker"></div>
        </div>
        <div class="dial-center"></div>
        <div class="dial-background">
          @for(hour of hourMarkers; track hour) {
            <span class="dial-number" 
                  [style.transform]="'rotate(' + (hour * 15) + 'deg) translateY(-95px) rotate(' + (-hour * 15) + 'deg)'">
              {{ hour }}
            </span>
          }
        </div>
      </div>

      <div class="time-adjustment">+{{ hoursAdded }}h {{ minutesAdded }}m</div>
    </div>
  `,
  styles: [`
    .timer-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: #fef6e4;
      border: 2px solid #001858;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 400px;
    }

    .time-display {
      text-align: center;
      margin-bottom: 1.5rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .current-time {
      font-size: 1.25rem;
      color: #172c66;
      margin-bottom: 0.5rem;
    }

    .target-time {
      font-size: 2rem;
      color: #001858;
      font-weight: bold;
    }

    .dial-container {
      position: relative;
      width: 250px;
      height: 250px;
      margin: 1.5rem 0;
      touch-action: none;
    }

    .dial {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #f3d2c1;
      border: 2px solid #001858;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      user-select: none;
      touch-action: none;
      will-change: transform;
      transition: transform 0.2s ease;
    }

    .dial:hover {
      background: #fcd5ce;
    }

    .dial:active {
      transform: scale(0.98);
    }

    .dial-marker {
      position: absolute;
      top: 6px;
      left: 50%;
      width: 3px;
      height: 16px;
      background-color: #001858;
      transform: translateX(-50%);
      border-radius: 1.5px;
    }

    .dial-center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      background: #8bd3dd;
      border: 2px solid #001858;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      pointer-events: none;
    }

    .dial-background {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .dial-number {
      position: absolute;
      left: 50%;
      top: 50%;
      transform-origin: center;
      font-size: 0.875rem;
      color: #001858;
      font-weight: 600;
      transform: translate(-50%, -50%) !important;
    }

    .time-adjustment {
      margin-top: 1rem;
      font-size: 1.125rem;
      color: #001858;
      font-weight: 500;
    }

    @media (max-width: 640px) {
      .timer-container {
        padding: 1rem;
      }

      .dial-container {
        width: 200px;
        height: 200px;
        margin: 1rem 0;
      }

      .dial-number {
        font-size: 0.75rem;
      }

      @for $hour from 0 through 23 {
        .dial-number:nth-child(#{$hour + 1}) {
          transform: rotate(#{$hour * 15}deg) translateY(-70px) rotate(#{-$hour * 15}deg) !important;
        }
      }

      .current-time {
        font-size: 1rem;
      }

      .target-time {
        font-size: 1.5rem;
      }

      .time-adjustment {
        font-size: 1rem;
      }

      .dial-marker {
        height: 12px;
      }

      .dial-center {
        width: 12px;
        height: 12px;
      }
    }
  `]
})
export class TimerComponent implements OnInit, OnDestroy {
  @ViewChild('dial') dialElement!: ElementRef;
  @Output() timeRangeChange = new EventEmitter<{ startTime: Date; endTime: Date }>();
  
  currentTime = '';
  targetTime = '';
  rotation = 0;
  hoursAdded = 0;
  minutesAdded = 0;
  private isDragging = false;
  private startAngle = 0;
  private currentAngle = 0;
  hourMarkers = Array.from({ length: 24 }, (_, i) => i);
  private timerInterval: any;
  private lastRotation = 0;

  ngOnInit() {
    this.updateCurrentTime();
    this.timerInterval = setInterval(() => this.updateCurrentTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.cleanupEventListeners();
  }

  private updateCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    this.updateTargetTime(false);
  }

  private updateTargetTime(emitChange: boolean = true) {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(now.getHours() + this.hoursAdded);
    endTime.setMinutes(now.getMinutes() + this.minutesAdded);
    this.targetTime = endTime.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (emitChange) {
      this.timeRangeChange.emit({
        startTime: now,
        endTime: endTime
      });
    }
  }

  startRotating(event: MouseEvent | TouchEvent, isTouch = false) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.dialElement) return;
    
    this.isDragging = true;
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = isTouch ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
    
    const rect = this.dialElement.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    this.startAngle = Math.atan2(clientY - centerY, clientX - centerX);

    if (isTouch) {
      document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd);
      document.addEventListener('touchcancel', this.handleTouchEnd);
    } else {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    }
  }

  private handleMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    this.rotate(event.clientX, event.clientY);
  }

  private handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    this.rotate(touch.clientX, touch.clientY);
  }

  private handleMouseUp = () => {
    this.stopRotating();
  }

  private handleTouchEnd = () => {
    this.stopRotating();
  }

  private rotate(clientX: number, clientY: number) {
    if (!this.isDragging || !this.dialElement) return;

    const rect = this.dialElement.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let delta = (angle - this.startAngle) * 180 / Math.PI;
    let newRotation = this.currentAngle + delta;

    // Prevent sudden jumps
    if (Math.abs(newRotation - this.lastRotation) > 180) {
      return;
    }

    // Normalize rotation to be between 0 and 360
    newRotation = ((newRotation % 360) + 360) % 360;
    
    // Snap to 15-minute intervals (15 degrees = 1 hour)
    this.rotation = Math.round(newRotation / 3.75) * 3.75;
    this.lastRotation = this.rotation;
    
    // Calculate hours and minutes (360 degrees = 24 hours)
    const totalMinutes = Math.round((this.rotation / 360) * 24 * 60);
    this.hoursAdded = Math.floor(totalMinutes / 60);
    this.minutesAdded = totalMinutes % 60;
    this.updateTargetTime(false); // Non emettere durante il trascinamento
  }

  private stopRotating() {
    this.isDragging = false;
    this.currentAngle = this.rotation;
    this.updateTargetTime(true); // Emetti solo quando l'utente rilascia
    this.cleanupEventListeners();
  }

  private cleanupEventListeners() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
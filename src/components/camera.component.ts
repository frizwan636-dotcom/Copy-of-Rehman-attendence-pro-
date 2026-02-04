import { Component, ViewChild, ElementRef, OnInit, OnDestroy, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      <video #videoElement autoplay playsinline class="w-full h-full object-cover"></video>
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        <button (click)="capturePhoto()" class="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-slate-300">
          <div class="w-12 h-12 bg-white rounded-full border-2 border-slate-800"></div>
        </button>
      </div>
       <button (click)="close.emit()" class="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center text-2xl font-bold">
          &times;
       </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  
  photoCaptured = output<string>();
  close = output<void>();

  private stream: MediaStream | null = null;

  async ngOnInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  private async startCamera() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access the camera. Please ensure you have granted permission.');
      this.close.emit();
    }
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  capturePhoto() {
    if (!this.videoElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      this.photoCaptured.emit(dataUrl);
    }
    this.stopCamera();
  }
}

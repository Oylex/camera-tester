import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {interval, timer} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private mediaStream: MediaStream;

  readonly minDelay = 200; // 100
  readonly maxDelay = 2000; // 2000
  readonly delayIncrement = 200; // 100
  readonly attemptsForSuccess = 100; // 100

  delay = this.minDelay;
  attempt = 0;
  success = false;
  failure = false;
  startTime;
  endTime;

  @ViewChild('cameraFeed')
  cameraFeed: ElementRef<HTMLVideoElement>;

  ngOnInit(): void {
    this.startTime = Date();
    this.startCamera();

    let lastDelay = 0;
    let lastAttempt = 0;

    const failureinterval = interval(5000)
      .subscribe(() => {
        if (this.failure || this.success) {
          if (failureinterval) {
            failureinterval.unsubscribe();
          }

          return;
        }

        if (this.attempt > lastAttempt || this.delay > lastDelay) {
          lastAttempt = this.attempt;
          lastDelay = this.delay;
        } else {
          this.failure = true;

          this.endTime = Date();
        }
      });
  }

  startCamera() {
    if (this.attempt >= this.attemptsForSuccess) {
      if (this.delay < this.maxDelay) {
        this.attempt = 0;
        this.delay += this.delayIncrement;
      } else {
        this.success = true;
        this.endTime = Date();
      }
    }

    if (this.failure || this.success) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({video: {width: {ideal: 1920}, height: {ideal: 1080}}})
      .then((mediaStream) => {
        // console.log('MediaStream received successfully.');
        this.mediaStream = mediaStream;
        this.cameraFeed.nativeElement.srcObject = mediaStream;

        this.cameraFeed.nativeElement.onloadedmetadata = () => {
          this.cameraFeed.nativeElement.play().then();

          this.attempt++;

          timer(this.delay)
            .subscribe(() => {
              this.stopCamera();
            });
        };
      })
      .catch((reason) => {
        console.error('MediaStream:', reason);
      });
  }

  stopCamera() {
    if (!this.mediaStream) {
      return;
    }

    this.mediaStream
      .getTracks()
      .forEach((mediaStreamTrack) => {
        if (mediaStreamTrack === null) {
          return;
        }

        mediaStreamTrack.stop();
      });

    this.mediaStream = null;

    this.cameraFeed.nativeElement.srcObject = null;

    this.startCamera();
  }
}

import { Component } from '@angular/core';
import { AppService } from './app.services';

@Component({
  selector: 'app-root',
  template:`<router-outlet></router-outlet><fai-dialog></fai-dialog>`,
  providers: [AppService]
})
export class AppComponent {
  title = 'app works!';
}


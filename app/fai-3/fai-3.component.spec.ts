import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { fai3Component } from './fai-3.component';

describe('fai3Component', () => {
  let component: fai3Component;
  let fixture: ComponentFixture<fai3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fai3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(fai3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { fai4Component } from './fai-4.component';

describe('fai4Component', () => {
  let component: fai4Component;
  let fixture: ComponentFixture<fai4Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fai4Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(fai4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

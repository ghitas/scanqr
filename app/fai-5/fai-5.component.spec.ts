import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { fai5Component } from './fai-5.component';

describe('fai5Component', () => {
  let component: fai5Component;
  let fixture: ComponentFixture<fai5Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fai5Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(fai5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

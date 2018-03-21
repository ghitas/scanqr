import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { fai2Component } from './fai-2.component';

describe('fai2Component', () => {
  let component: fai2Component;
  let fixture: ComponentFixture<fai2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fai2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(fai2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

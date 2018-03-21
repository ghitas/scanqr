import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { fai1Component } from './fai-1.component';

describe('fai1Component', () => {
  let component: fai1Component;
  let fixture: ComponentFixture<fai1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fai1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(fai1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

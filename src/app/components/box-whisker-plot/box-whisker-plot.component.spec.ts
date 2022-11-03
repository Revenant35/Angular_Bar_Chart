import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxWhiskerPlotComponent } from './box-whisker-plot.component';

describe('BoxWhiskerPlotComponent', () => {
  let component: BoxWhiskerPlotComponent;
  let fixture: ComponentFixture<BoxWhiskerPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoxWhiskerPlotComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoxWhiskerPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

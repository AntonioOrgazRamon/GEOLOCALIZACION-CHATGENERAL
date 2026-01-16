import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannedMessageComponent } from './banned-message.component';

describe('BannedMessageComponent', () => {
  let component: BannedMessageComponent;
  let fixture: ComponentFixture<BannedMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannedMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BannedMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

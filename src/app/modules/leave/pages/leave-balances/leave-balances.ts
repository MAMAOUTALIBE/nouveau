import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveBalance, LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-balances',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-balances.html',
})
export class LeaveBalancesPage implements OnInit {
  private leaveService = inject(LeaveService);

  balances: LeaveBalance[] = [];

  ngOnInit(): void {
    this.leaveService.getBalances().subscribe((items) => (this.balances = items));
  }

  percent(allocated: number, consumed: number): number {
    if (!allocated) return 0;
    return Math.round((consumed / allocated) * 100);
  }
}

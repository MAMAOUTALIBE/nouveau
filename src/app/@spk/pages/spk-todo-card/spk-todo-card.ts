import { Component, input } from '@angular/core';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
interface TaskCard {
  id: number;
  userImage: string;
  userName: string;
  userRole: string;
  assignedTasks: number;
  assignedClass: string;
  time: string;
  status: string;
  statusClass: string;
  taskTitle: string;
  taskDesc: string;
}
@Component({
  selector: 'spk-todo-card',
  imports: [NgbDropdownModule,NgbTooltipModule],
  templateUrl: './spk-todo-card.html',
  styleUrl: './spk-todo-card.scss',
})
export class SpkTodoCard {
  data = input<TaskCard>()
}

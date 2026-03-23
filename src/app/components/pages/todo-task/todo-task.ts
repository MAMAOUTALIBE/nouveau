import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkTodoCard } from "../../../@spk/pages/spk-todo-card/spk-todo-card";

@Component({
  selector: 'app-todo-task',
  imports: [NgbModule, SpkTodoCard],
  templateUrl: './todo-task.html',
  styleUrl: './todo-task.scss'
})
export class TodoTask {
  navItems = [
    { label: 'All Tasks', icon: 'fe-codepen', color: 'primary' },
    { label: 'Important', icon: 'fe-alert-octagon', color: 'warning', badge: { count: 6, color: 'bg-danger' } },
    { label: 'Starred', icon: 'fe-star', color: 'secondary' },
    { label: 'Spam', icon: 'fe-briefcase', color: 'info' },
    { label: 'Archive', icon: 'fe-bell', color: 'success', badge: { count: 4, color: 'bg-warning' } },
    { label: 'Trash', icon: 'fe-trash-2', color: 'danger' }
  ];

  tasks = [
  {
    id: 1,
    userImage: './assets/images/faces/1.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 9,
    assignedClass:'success',
    time: '10.54am',
    status: 'New',
    statusClass: 'bg-primary-transparent text-primary',
    taskTitle: 'Work Assigned by Clients, try to get new work',
    taskDesc: 'Sed ut perspiciatis unde omnis iste natus'
  },
  {
    id: 2,
    userImage: './assets/images/faces/12.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 2,
    assignedClass:'info',
    time: '10.54am',
    status: 'completed',
    statusClass: 'bg-success-transparent text-success',
    taskTitle: 'voluptatem accusantium dolo laudantium',
    taskDesc: 'inventore veritatis et quasi architecto'
  },
  {
    id: 3,
    userImage: './assets/images/faces/9.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 6,
    assignedClass:'danger',
    time: '10.54am',
    status: 'Pending',
    statusClass: 'bg-danger-transparent text-danger',
    taskTitle: 'Nemo enim ipsam voluptatem quia voluptas',
    taskDesc: 'vero eos et accusamus et iusto odio dignissimos'
  },
  {
    id: 4,
    userImage: './assets/images/faces/4.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 9,
    assignedClass:'info',
    time: '10.54am',
    status: 'completed',
    statusClass: 'bg-success-transparent text-success',
    taskTitle: 'Ut enim ad minima veniam nostrum exercitationem',
    taskDesc: 'Quis autem vel eum iure reprehenderit qui'
  },
  {
    id: 5,
    userImage: './assets/images/faces/15.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 7,
    assignedClass:'danger',
    time: '10.54am',
    status: 'Pending',
    statusClass: 'bg-danger-transparent text-danger',
    taskTitle: 'I must explain to you how all this mistaken',
    taskDesc: 'I will give you a complete account of the system'
  },
  {
    id: 6,
    userImage: './assets/images/faces/5.jpg',
    userName: 'Teri Dactyl',
    userRole: 'Web Designer',
    assignedTasks: 4,
    assignedClass:'info',
    time: '10.54am',
    status: 'New',
    statusClass: 'bg-primary-transparent text-primary',
    taskTitle: 'Rationally encounter quences extremely painful',
    taskDesc: 'Which of us ever undertakes laborious physical'
  }
];
}



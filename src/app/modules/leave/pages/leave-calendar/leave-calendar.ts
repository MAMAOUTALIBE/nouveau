import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LeaveEvent, LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './leave-calendar.html',
})
export class LeaveCalendarPage implements OnInit {
  private leaveService = inject(LeaveService);

  events: LeaveEvent[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay',
    },
    height: 'auto',
    navLinks: true,
    dayMaxEvents: true,
    events: [],
  };

  ngOnInit(): void {
    this.leaveService.getEvents().subscribe((items) => {
      this.events = items;
      this.calendarOptions = {
        ...this.calendarOptions,
        events: items,
      };
    });
  }
}

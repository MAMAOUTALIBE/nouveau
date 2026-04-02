import { ChangeDetectorRef, Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import {  NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGrigPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

import moment from 'moment';
import { EventInput, CalendarOptions } from '@fullcalendar/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { OverlayscrollbarsModule } from 'overlayscrollbars-ngx';


@Component({
  selector: 'app-full-calendar',
  imports: [ FormsModule, ReactiveFormsModule, NgbModule,  FullCalendarModule, OverlayscrollbarsModule],
  templateUrl: './fullcalendar.html',
  styleUrl: './fullcalendar.scss',
})
export class Fullcalendar{
  @ViewChild('fullCalendar') fullCalendar: any;
  @ViewChild('external', { static: false }) external!: ElementRef;
  calendarPlugins = [dayGridPlugin, timeGrigPlugin, interactionPlugin];
  curYear = moment().format('YYYY');
  curMonth = moment().format('MM');
  constructor(private cdr: ChangeDetectorRef) { }
  calendarEvents: EventInput[] = [
    {
      id: '1',
      start: this.curYear + '-' + this.curMonth + '-02',
      end: this.curYear + '-' + this.curMonth + '-02',
      title: 'Spruko Meetup',
      className: 'bg-secondary',
    },
    {
      id: '2',
      start: this.curYear + '-' + this.curMonth + '-17',
      end: this.curYear + '-' + this.curMonth + '-17',
      title: 'Design Review',
      className: "bg-info",

    },
    {
      id: '3',
      start: this.curYear + '-' + this.curMonth + '-13',
      end: this.curYear + '-' + this.curMonth + '-13',
      title: 'Lifestyle Conference',
      className: "bg-primary",

    },
    {
      id: '4',
      start: this.curYear + '-' + this.curMonth + '-21',
      end: this.curYear + '-' + this.curMonth + '-21',
      title: 'Team Weekly Brownbag',
      className: "bg-warning",

    },
    {
      id: '5',
      start: this.curYear + '-' + this.curMonth + '-04T10:00:00',
      end: this.curYear + '-' + this.curMonth + '-06T15:00:00',
      title: 'Music Festival',
      className: "bg-success",

    },
    {
      id: '6',
      start: this.curYear + '-' + this.curMonth + '-08',
      end: this.curYear + '-' + this.curMonth + '-08',
      title: 'Attend Lea\'s Wedding',
      className: "bg-success",

    },
    {
      id: '7',
      start: this.curYear + '-' + this.curMonth + '-06',
      end: this.curYear + '-' + this.curMonth + '-06',
      title: 'Harcates Birthday',
      className: "bg-info",

    },
    {
      id: '8',
      start: this.curYear + '-' + this.curMonth + '-28',
      end: this.curYear + '-' + this.curMonth + '-28',
      title: 'Bunnysin\'s Birthday',
      className: "bg-info",
    },
    {
      id: '9',
      start: this.curYear + '-' + this.curMonth + '-03',
      end: this.curYear + '-' + this.curMonth + '-03',
      title: 'Lee shin\'s Birthday',
      className: "bg-info",
    },
    {
      id: '10',
      start: this.curYear + '-' + 11 + '-11',
      end: this.curYear + '-' + 11 + '-11',
      title: 'Shinchan\'s Birthday',
      className: "bg-info",
    },
  ];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: this.calendarEvents,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay',
    },
    navLinks: true, // can click day/week names to navigate views
    businessHours: true, // display business hours
    editable: true,
    selectable: true,
    selectMirror: true,
    droppable: true,
    weekends: true,
    dayMaxEvents: true, // allow "more" link when too many events
    dateClick: (arg) => this.handleDateClick(arg),
    eventClick: (arg) => this.handleEventClick(arg),
    drop: () => this.handleDrop(),
  };
  handleDrop() {
    this.draggedEventData = null;
  }
  handleDateClick(arg: any) {
    const title = prompt('Event Title:');
    if (title) {
      // Create a new event
      const newEvent: EventInput = {
        id: `${this.calendarEvents.length + 1}`, // Generate a unique ID
        title: title,
        start: arg.date,
        allDay: arg.allDay,
        // className: 'bg-primary-transparent', // Optional: Add a default class
        className: this.draggedEventData?.className ,
      };

      // Update calendarEvents immutably to trigger change detection
      this.calendarEvents = [...this.calendarEvents, newEvent];

      // Notify FullCalendar to refetch events
      if (this.fullCalendar) {
        const calendarApi = this.fullCalendar.getApi();
        calendarApi.addEvent(newEvent); // Add the event directly to the calendar
        // Alternatively, you can use refetchEvents if events are managed externally
        // calendarApi.refetchEvents();
      }

      this.draggedEventData = null;
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }
  handleEventClick(arg: any) {
    if (confirm('Are you sure you want to delete this event?')) {
      // Remove event from calendarEvents
      this.calendarEvents = this.calendarEvents.filter(
        (event) => event.id !== arg.event.id
      );

      // Remove event from FullCalendar
      if (this.fullCalendar) {
        arg.event.remove(); // Directly remove the event
        // Alternatively: this.fullCalendar.getApi().refetchEvents();
      }

      // Trigger change detection
      this.cdr.detectChanges();
    }
  }
  draggedEventData: EventInput | null = null;
  ngAfterViewInit(): void {
    const containerEl = this.external.nativeElement;


    new Draggable(containerEl, {
      itemSelector: '.fc-event',
      eventData: (eventEl: HTMLElement) => {
        const title = eventEl.innerText.trim();
        const className = eventEl.getAttribute('data-class') ;
        this.draggedEventData = {
          title,
          className: className + ' overflow-hidden',
        };
        return this.draggedEventData;
      },
    });
  }
}

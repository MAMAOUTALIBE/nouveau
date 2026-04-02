import { Component } from '@angular/core';
import { SpkCard } from "../../../@spk/spk-card/spk-card";

@Component({
  selector: 'app-widget-notification',
  imports: [SpkCard],
  templateUrl: './widget-notification.html',
  styleUrl: './widget-notification.scss'
})
export class WidgetNotification {
  alerts = [
    {
      type: 'danger',
      icon: 'bi-x-circle',
      title: 'Data Not Found.'
    },
    {
      type: 'success',
      icon: 'bi-check-circle',
      title: 'Success Data'
    },
    {
      type: 'warning',
      icon: 'bi-exclamation-circle',
      title: 'Warning Alert'
    },
    {
      type: 'info',
      icon: 'bi-info-circle',
      title: 'Info Alert'
    }
  ];

  alertWidgets = [
    {
      type: 'danger',
      icon: 'bi-x-circle',
      title: 'Error Data',
      strongText: 'Oh snap!',
      message: 'Change a few things up and try submitting again.'
    },
    {
      type: 'success',
      icon: 'bi-check-circle',
      title: 'Success Data',
      strongText: 'Well done!',
      message: 'You successfully read this important alert message.'
    },
    {
      type: 'warning',
      icon: 'bi-exclamation-circle',
      title: 'Warning Data',
      strongText: 'Well done!',
      message: 'You successfully read this important alert message.'
    },
    {
      type: 'info',
      icon: 'bi-info-circle',
      title: 'Info Data',
      strongText: 'Heads up!',
      message: "This alert needs your attention, but it's not super important."
    }
  ];
  alerts3 = [
    {
      type: 'success',
      icon: 'bi bi-check-circle',
      title: 'Success!',
      colorClass: 'success'
    },
    {
      type: 'info',
      icon: 'bi bi-info-circle',
      title: 'Info!',
      colorClass: 'info'
    },
    {
      type: 'danger',
      icon: 'bi bi-x-circle',
      title: 'Danger!',
      colorClass: 'danger'
    },
    {
      type: 'warning',
      icon: 'bi bi-exclamation-circle',
      title: 'Warning!',
      colorClass: 'warning'
    }
  ];

  alerts4 = [
    { type: 'success', color: 'success', title: 'Success!' },
    { type: 'info',    color: 'info',    title: 'Info!'    },
    { type: 'danger',  color: 'danger',  title: 'Danger!'  },
    { type: 'warning', color: 'warning', title: 'Warning!' }
  ];
  alertCards = [
    {
      type: 'danger',
      bgClass: 'bg-danger',
      icon: 'bi bi-x-circle',
      message: 'Data Not Found.'
    },
    {
      type: 'success',
      bgClass: 'bg-success',
      icon: 'bi bi-check-circle',
      message: 'Submitted Successfully'
    },
    {
      type: 'info',
      bgClass: 'bg-info',
      icon: 'bi bi-info-circle',
      message: 'Info Alert'
    },
    {
      type: 'warning',
      bgClass: 'bg-warning',
      icon: 'bi bi-exclamation-circle',
      message: 'Warning Alert'
    }
  ];


  alerts6 = [
    {
      type: 'danger',
      icon: 'bi bi-x-circle',
      message: 'Data Not Found.'
    },
    {
      type: 'success',
      icon: 'bi bi-check-circle',
      message: 'Submitted Successfully'
    },
    {
      type: 'info',
      icon: 'bi bi-info-circle',
      message: 'Info Alert'
    },
    {
      type: 'warning',
      icon: 'bi bi-exclamation-circle',
      message: 'Warning Alert'
    }
  ];


  emptyStates = [
    {
      image: './assets/images/svgicons/no-data.svg',
      title: 'Items Not Found',
    },
    {
      image: './assets/images/svgicons/note_taking.svg',
      title: 'Its Empty In Here',
    },
    {
      image: './assets/images/svgicons/imac.svg',
      title: 'No Site Selected',
    }
  ];
}



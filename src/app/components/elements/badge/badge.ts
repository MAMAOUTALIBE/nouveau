import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/badge';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-badge',
    imports: [ ShowcodeCard],
    templateUrl: './badge.html',
    styleUrl: './badge.scss'
})
export class Badge {
    prismCodeData = PrismCode;

    Pillbadges = [
        {
            class: 'badge bg-primary',
            title: 'Primary',
        },
        {
            class: 'badge  bg-secondary',
            title: 'Secondary',
        },
        {
            class: 'badge  bg-success',
            title: 'Success',
        },
        {
            class: 'badge  bg-danger',
            title: 'Danger',
        },
        {
            class: 'badge  bg-warning',
            title: 'Warning',
        },
        {
            class: 'badge  bg-info',
            title: 'Info',
        },
        {
            class: 'badge  bg-light text-dark',
            title: 'Light',
        },
        {
            class: 'badge  bg-dark text-light',
            title: 'Dark',
        },
    ]

    LightPillBadges = [
        {
            class: 'badge  bg-primary-transparent',
            title: 'Primary',
        },
        {
            class: 'badge  bg-secondary-transparent',
            title: 'Secondary',
        },
        {
            class: 'badge  bg-success-transparent',
            title: 'Success',
        },
        {
            class: 'badge  bg-danger-transparent',
            title: 'Danger',
        },
        {
            class: 'badge  bg-warning-transparent',
            title: 'Warning',
        },
        {
            class: 'badge  bg-info-transparent',
            title: 'Info',
        },
        {
            class: 'badge bg-light-transparent text-dark',
            title: 'Light',
        },
        {
            class: 'badge  bg-dark-transparent ',
            title: 'Dark',
        },
    ]

    PillRoundedBadges = [
        {
            class: 'badge rounded-pill   bg-primary-transparent',
            title: 'Primary',
        },
        {
            class: 'badge rounded-pill bg-secondary-transparent',
            title: 'Secondary',
        },
        {
            class: 'badge rounded-pill bg-success-transparent',
            title: 'Success',
        },
        {
            class: 'badge rounded-pill bg-danger-transparent',
            title: 'Danger',
        },
        {
            class: 'badge rounded-pill bg-warning-transparent',
            title: 'Warning',
        },
        {
            class: 'badge rounded-pill bg-info-transparent',
            title: 'Info',
        },
        {
            class: 'badge rounded-pill bg-light-transparent text-dark',
            title: 'Light',
        },
        {
            class: 'badge rounded-pill bg-dark-transparent ',
            title: 'Dark',
        },
    ]
    LightPillRoundedBadges = [
        {
            class: 'badge rounded-pill bg-primary-transparent',
            title: 'Primary',
        },
        {
            class: 'badge rounded-pill bg-secondary-transparent',
            title: 'Secondary',
        },
        {
            class: 'badge rounded-pill bg-success-transparent',
            title: 'Success',
        },
        {
            class: 'badge rounded-pill bg-danger-transparent',
            title: 'Danger',
        },
        {
            class: 'badge rounded-pill bg-warning-transparent',
            title: 'Warning',
        },
        {
            class: 'badge rounded-pill bg-info-transparent',
            title: 'Info',
        },
        {
            class: 'badge rounded-pill bg-light-transparent text-dark',
            title: 'Light',
        },
        {
            class: 'badge rounded-pill bg-dark-transparent ',
            title: 'Dark',
        },
    ]
    GradientBadges = [
        {
            class: 'badge bg-primary-gradient',
            title: 'Primary',
        },
        {
            class: 'badge  bg-secondary-gradient',
            title: 'Secondary',
        },
        {
            class: 'badge  bg-success-gradient',
            title: 'Success',
        },
        {
            class: 'badge  bg-danger-gradient',
            title: 'Danger',
        },
        {
            class: 'badge  bg-warning-gradient',
            title: 'Warning',
        },
        {
            class: 'badge  bg-info-gradient',
            title: 'Info',
        },
        {
            class: 'badge  bg-orange-gradient',
            title: 'Orange',
        },
        {
            class: 'badge  bg-purple-gradient ',
            title: 'Purple',
        },
    ]

    GradientPillRoundedBadges = [
        {
            class: 'badge  bg-primary-gradient rounded-pill ',
            title: 'Primary',
        },
        {
            class: 'badge   bg-secondary-gradient rounded-pill ',
            title: 'Secondary',
        },
        {
            class: 'badge   bg-success-gradient rounded-pill ',
            title: 'Success',
        },
        {
            class: 'badge   bg-danger-gradient rounded-pill ',
            title: 'Danger',
        },
        {
            class: 'badge   bg-warning-gradient rounded-pill ',
            title: 'Warning',
        },
        {
            class: 'badge   bg-info-gradient rounded-pill ',
            title: 'Info',
        },
        {
            class: 'badge rounded-pill bg-orange-gradient ',
            title: 'Orange',
        },
        {
            class: 'badge   bg-purple-gradient rounded-pill ',
            title: 'Purple',
        },
    ]

    OutlineBadges = [
        {
            class: 'badge  bg-outline-primary',
            title: 'Primary',
        },
        {
            class: 'badge  bg-outline-secondary',
            title: 'Secondary',
        },
        {
            class: 'badge  bg-outline-success',
            title: 'Success',
        },
        {
            class: 'badge  bg-outline-danger',
            title: 'Danger',
        },
        {
            class: 'badge  bg-outline-warning',
            title: 'Warning',
        },
        {
            class: 'badge  bg-outline-info',
            title: 'Info',
        },
        {
            class: 'badge  bg-outline-light text-dark',
            title: 'Light',
        },
        {
            class: 'badge  bg-outline-dark ',
            title: 'Dark',
        },
    ]

    OutlinePillRoundedBadges = [
        {
            class: 'badge  bg-outline-primary rounded-pill',
            title: 'Primary',
        },
        {
            class: 'badge  bg-outline-secondary rounded-pill',
            title: 'Secondary',
        },
        {
            class: 'badge  bg-outline-success rounded-pill',
            title: 'Success',
        },
        {
            class: 'badge  bg-outline-danger rounded-pill',
            title: 'Danger',
        },
        {
            class: 'badge  bg-outline-warning rounded-pill',
            title: 'Warning',
        },
        {
            class: 'badge  bg-outline-info rounded-pill',
            title: 'Info',
        },
        {
            class: 'badge  bg-outline-light text-dark rounded-pill',
            title: 'Light',
        },
        {
            class: 'badge  bg-outline-dark rounded-pill',
            title: 'Dark',
        },
    ]
    ButtonsWithBadges = [

        {
            buttonClass: 'btn btn-primary my-1 me-2',
            spanClass: "badge ms-2 bg-secondary",
            number: 4
        },
        {
            buttonClass: 'btn btn-secondary my-1 me-2',
            spanClass: "badge ms-2 bg-primary",
            number: 7
        },
        {
            buttonClass: 'btn btn-success my-1 me-2',
            spanClass: "badge ms-2 bg-danger",
            number: 12
        },
        {
            buttonClass: 'btn btn-info my-1 me-2',
            spanClass: "badge ms-2 bg-warning",
            number: 32
        },
    ]

    OutlineButtonBadges = [

        {
            buttonClass: 'btn btn-outline-primary my-1 me-2',

            number: 4
        },
        {
            buttonClass: 'btn btn-outline-secondary my-1 me-2',

            number: 7
        },
        {
            buttonClass: 'btn btn-outline-success my-1 me-2',

            number: 12
        },
        {
            buttonClass: 'btn btn-outline-info my-1 me-2',

            number: 32
        },
    ]

    PositionedBadges = [
        {
            buttonclass: ' me-3 btn btn-primary position-relative',
            title: '  Inbox',
            spanClass: 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger',
            text: ' 99+',
            messages: 'unread messages',
            img: false
        },
        {
            buttonclass: 'me-3  btn btn-secondary position-relative',
            title: '  Profile',
            spanClass: 'position-absolute top-80 start-100 translate-middle p-2 bg-primary border border-light rounded-circle',
            text: ' ',
            messages: 'New alerts',
            img: false
        },
        {
            img: true,
            src: './assets/images/faces/2.jpg',
            spnaClass: 'me-4 position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle',
            title: 'New alerts'
        },
        {
            img: true,
            src: './assets/images/faces/15.jpg',
            spnaClass: 'me-4 position-absolute top-80 start-100 translate-middle p-1 bg-primary border border-light rounded-circle',
            title: 'New alerts'
        },
        {
            img: true,
            src: './assets/images/faces/10.jpg',
            spnaClass: 'me-4 position-absolute top-0 start-100 translate-middle badge bg-secondary rounded-pill shadow-lg',
            title: 'New alerts'
        },
    ]
}


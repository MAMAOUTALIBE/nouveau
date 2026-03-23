import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/buttons';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-buttons',
    imports: [ ShowcodeCard],
    templateUrl: './buttons.html',
    styleUrls: ['./buttons.scss']
})
export class Buttons {
  prismCodeData = PrismCode;
  DefaultButtons = [
    {
      buttonclass: 'btn btn-primary btn-wave ',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary btn-wave ',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success btn-wave ',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger btn-wave ',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning btn-wave ',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info btn-wave ',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light btn-wave ',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark btn-wave  text-white',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link btn-wave ',
      buttonname: 'Link'
    },
  ]
  RoundedButtons = [
    {
      buttonclass: 'btn btn-primary btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light btn-wave rounded-pill',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark btn-wave text-white rounded-pill',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link btn-wave rounded-pill',
      buttonname: 'Link'
    },
  ]

  LightButtons = [
    {
      buttonclass: 'btn btn-primary-light btn-wave',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-light btn-wave',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-light btn-wave',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-light btn-wave',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-light btn-wave',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-light btn-wave',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-purple-light btn-wave',
      buttonname: 'purple'
    },
    {
      buttonclass: 'btn btn-teal-light  btn-wave ',
      buttonname: 'teal'
    },
    {
      buttonclass: 'btn btn-orange-light btn-wave',
      buttonname: 'orange'
    },
  ]
  LightRoundedButtons = [
    {
      buttonclass: 'btn btn-primary-light btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-light btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-light btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-light btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-light btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-light btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-purple-light btn-wave rounded-pill',
      buttonname: 'purple'
    },
    {
      buttonclass: 'btn btn-teal-light  btn-wave rounded-pill',
      buttonname: 'teal'
    },
    {
      buttonclass: 'btn btn-orange-light btn-wave rounded-pill',
      buttonname: 'orange'
    },
  ]
  OutlineButtons = [
    {
      buttonclass: 'btn btn-outline-primary btn-wave ',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-outline-secondary btn-wave ',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-outline-success btn-wave ',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-outline-danger btn-wave ',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-outline-warning btn-wave ',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-outline-info btn-wave ',
      buttonname: 'Info'
    },

    {
      buttonclass: 'btn btn-outline-light btn-wave waves-effect waves-light ',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-outline-dark  btn-wave ',
      buttonname: 'Dark'
    },

  ]
  RoundedOutlineButtons = [
    {
      buttonclass: 'btn btn-outline-primary btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-outline-secondary btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-outline-success btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-outline-danger btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-outline-warning btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-outline-info btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: "btn btn-outline-light rounded-pill btn-wave waves-effect waves-light",
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-outline-dark rounded-pill btn-wave waves-effect waves-light',
      buttonname: 'Dark'
    },

  ]

  GradientButtons = [
    {
      buttonclass: 'btn btn-primary-gradient btn-wave',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-gradient btn-wave',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-gradient btn-wave',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-gradient btn-wave',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-gradient btn-wave',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-gradient btn-wave',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-gradient btn-wave',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-gradient btn-wave',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-gradient btn-wave',
      buttonname: 'Teal'
    },
  ]
  RoundedGradientButtons = [
    {
      buttonclass: 'btn btn-primary-gradient btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-gradient btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-gradient btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-gradient btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-gradient btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-gradient btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-gradient btn-wave rounded-pill',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-gradient btn-wave rounded-pill',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-gradient btn-wave rounded-pill',
      buttonname: 'Teal'
    },
  ]
  GhostButtons = [
    {
      buttonclass: 'btn btn-primary-ghost btn-wave ',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-ghost btn-wave ',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-ghost btn-wave ',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-ghost btn-wave ',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-ghost btn-wave ',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-ghost btn-wave ',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-ghost btn-wave ',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-ghost btn-wave ',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-ghost btn-wave ',
      buttonname: 'Teal'
    },
  ]

  LoadingButtons = [
    {
      class: "btn btn-primary btn-loader"
    },
    {
      class: "btn btn-outline-secondary btn-loader"
    },
    {
      class: "btn btn-info-light btn-loader"
    },
    {
      class: "btn btn-warning-light btn-loader"
    },
    {
      class: "btn btn-success btn-loader disabled"
    },
  ]


  SocialButtons = [
    {
      class: 'btn btn-icon btn-facebook btn-wave',
      iconclass: 'ri-facebook-line',
    },
    {
      class: 'btn btn-icon btn-twitter btn-wave',
      iconclass: 'ri-twitter-x-line',
    },
    {
      class: 'btn btn-icon btn-instagram btn-wave',
      iconclass: 'ri-instagram-line',
    },
    {
      class: 'btn btn-icon btn-github btn-wave',
      iconclass: 'ri-github-line',
    },
    {
      class: 'btn btn-icon btn-youtube btn-wave',
      iconclass: 'ri-youtube-line',
    },
    {
      class: 'btn btn-icon btn-google btn-wave',
      iconclass: 'ri-google-line',
    },


  ]

  DifferentColoredButtonsWithShadows = [
    {
      class: 'btn btn-primary shadow-primary btn-wave'
    },
    {
      class: 'btn btn-secondary shadow-secondary btn-wave'
    },
    {
      class: 'btn btn-success shadow-success btn-wave'
    },
    {
      class: 'btn btn-info shadow-info btn-wave'
    },
    {
      class: 'btn btn-warning shadow-warning btn-wave'
    },
    {
      class: 'btn btn-danger shadow-danger btn-wave'
    },
    {
      class: 'btn btn-purple shadow-purple btn-wave'
    },
    {
      class: 'btn btn-orange shadow-orange btn-wave'
    },

  ]
  RaisedButtons = [
    {
      class: 'btn btn-primary btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-secondary btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-success btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-info btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-warning btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-danger btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-purple btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-orange btn-raised-shadow  btn-wave'
    },

  ]

  LabelButtons = [
    { class: 'btn btn-primary label-btn', icon: 'ri-chat-smile-line label-btn-icon me-2', text: 'Primary' },
    { class: 'btn btn-secondary label-btn', icon: 'ri-settings-4-line label-btn-icon me-2', text: 'Secondary' },
    { class: 'btn btn-warning label-btn rounded-pill', icon: 'ri-spam-2-line label-btn-icon me-2 rounded-pill', text: 'Warning' },
    { class: 'btn btn-info label-btn rounded-pill', icon: 'ri-phone-line label-btn-icon me-2 rounded-pill', text: 'Info' },
    { class: 'btn btn-success label-btn label-end', icon: 'ri-thumb-up-line label-btn-icon ms-2', text: 'Success' },
    { class: 'btn btn-danger label-btn label-end rounded-pill', icon: 'ri-close-line label-btn-icon ms-2 rounded-pill', text: 'Cancel' },
  ]

  customButtons = [
    { class: 'btn btn-info custom-button rounded-pill', icon: 'ri-twitter-x-line text-info', text: 'Twitter' },
    { class: 'btn btn-teal-light btn-border-down', text: 'Border' },
    { class: 'btn btn-secondary-light btn-border-start', text: 'Border' },
    { class: 'btn btn-purple-light btn-border-end', text: 'Border' },
    { class: 'btn btn-warning-light btn-border-top', text: 'Border' },
    { class: 'btn btn-secondary btn-glare', text: 'Glare Button' },
    { class: 'btn btn-danger btn-hover btn-hover-animate', text: 'Like' },
    { class: 'btn btn-success btn-darken-hover', text: 'Hover' },
    { class: 'btn btn-orange btn-custom-border', text: 'Hover' },
  ]

  Blockbutton = [
    { id: 1, class: "Button", color: "btn btn-primary w-100" },
    { id: 2, class: "Button", color: "btn btn-secondary w-100" },
  ]
  Blockbutton1 = [
    { id: 1, class: "Button", color: "btn btn-info" },
    { id: 2, class: "Button", color: "btn btn-success" },
  ]

  Blockbutton2 = [
    { id: 1, class: "Button", color: "btn btn-warning " },
    { id: 2, class: "Button", color: "btn btn-danger " },
  ]
  Blockbutton3 = [
    { id: 1, class: "Button", color: "btn btn-teal" },
    { id: 2, class: "Button", color: "btn btn-success" },
  ]
}


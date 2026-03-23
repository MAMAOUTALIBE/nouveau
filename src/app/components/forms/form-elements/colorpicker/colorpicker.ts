import { Component } from '@angular/core';
import {  FormsModule, } from '@angular/forms';
import { ColorPickerDirective  } from 'ngx-color-picker';
import { NgxColorsModule, } from 'ngx-colors';
import { ShowcodeCard } from "../../../../shared/components/showcode-card/showcode-card";
import {  MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-colorpicker',
    imports: [ColorPickerDirective, NgxColorsModule, FormsModule,MatIconModule,ShowcodeCard],
    templateUrl: './colorpicker.html',
    styleUrl: './colorpicker.scss'
})
export class Colorpicker {

  public color1: string = '#2889e9';
  public color2: string = '#EC407A';
  public color3: string = "#00897B";

}


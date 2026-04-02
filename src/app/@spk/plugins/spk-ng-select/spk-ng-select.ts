import { Component, ElementRef, EventEmitter, Input, Output, Renderer2, SimpleChanges, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgOption, NgSelectModule } from '@ng-select/ng-select';
type NgSelectChangeEvent = Option | Option[] | string | number | string[] | number[] | null;
type SelectValue = string | number | NgOption | (string | number | NgOption)[] | null;
interface Option {
  label: string; // Adjust according to your option structure
  value: any;    // Use the appropriate type based on your data
}
@Component({
  selector: 'spk-ng-select',
  standalone: true,
  imports: [NgSelectModule, FormsModule],
  templateUrl: './spk-ng-select.html',
  styleUrl: './spk-ng-select.scss'
})
export class SpkNgSelect {
  options = input<NgOption[]>([]); // Options for the select
  defaultValue = model<string | number | string[] | number[] | null>([]);   // Default value for the select
  bindValue = input<string>('')
  bindLabel = input<string>('')
  id = input<string>('');       // Additional classes
  mainClass = input<string>('');       // Additional classes
  maxSelectedItems = input<number>();       // Additional classes
  selectClass = input<string>('');       // Additional classes
  disabled = input<boolean>(false); // Disable the select
  clearable = input<boolean | undefined>(true); // Allow clearing of selection
  multiple = input<boolean | undefined>(false);   // Enable multiple selection
  multi = input<boolean | undefined>(false);
  addTag = input<boolean>(false);
  selectOnTab = input<boolean | undefined>(false);   // Enable multiple selection
  searchable = input<boolean | undefined>(true); // Enable searching
  hideSelected = input<boolean>(true); // Enable searching
  placeholder = input<string>('');      // Placeholder text
  value = input<string>('');
  additionalProperties = input<Record<string, string | number | boolean>>({});
  change = output<Option | Option[]>(); // Emit value change
  selectedChange = output<SelectValue>();
  groupBy = input<string>('');
  selectableGroup = input<boolean>(false);


  onSelectionChange(selected: SelectValue): void {
    // Now TypeScript knows 'selected' is one of the allowed types
    this.selectedChange.emit(selected);
  }
  constructor(private renderer: Renderer2, private el: ElementRef) { }

  ngAfterViewInit() {
    this.applyAdditionalProperties();
  }

  private applyAdditionalProperties() {
    const selectElement = this.el.nativeElement.querySelector('ng-select');
    const props = this.additionalProperties();

    if (selectElement && props) {
      Object.keys(props).forEach(prop => {
        const value = props[prop];
        if (this.isValidAttributeName(prop) && value !== null && value !== undefined) {
          // Fix: Wrap 'value' in String() to satisfy the Renderer2 type requirement
          this.renderer.setAttribute(selectElement, prop, String(value));
        }
      });
    }
  }

  // Example attribute validation
  isValidAttributeName(name: string): boolean {
    const invalidCharacters = [' ', '|', ':', '/', '\\', ';', ','];
    return !invalidCharacters.some(char => name.includes(char));
  }

  onValueChange(event: NgSelectChangeEvent) {
    // console.log('Selected Value:', event);
  }
}

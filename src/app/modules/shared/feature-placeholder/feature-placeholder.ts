import { Component, input } from '@angular/core';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-body text-center py-5">
        <h5 class="mb-2">{{ title() }}</h5>
        <p class="text-muted mb-0">Cette fonctionnalité sera livrée dans une prochaine itération.</p>
      </div>
    </div>
  `,
})
export class FeaturePlaceholder {
  title = input<string>('En construction');
}

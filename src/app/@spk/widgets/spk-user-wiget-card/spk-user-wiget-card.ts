import { Component, input } from '@angular/core';
interface UserCard {
  name: string;          // e.g. "Frost Williams"
  role: string;          // e.g. "Founder & CEO"
  image: string;         // path to avatar
  headerColor: string;   // background class for header
  stats: { value: string; label: string }[]; // footer stats
}

@Component({
  selector: 'spk-user-wiget-card',
  imports: [],
  templateUrl: './spk-user-wiget-card.html',
  styleUrl: './spk-user-wiget-card.scss',
})
export class SpkUserWigetCard {
  data = input<UserCard>()
}

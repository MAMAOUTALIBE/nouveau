import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrimAssistantService } from './prim-assistant.service';

interface AssistantKnowledgeEntry {
  id: string;
  title: string;
  module: string;
  route: string;
  keywords: string[];
  answer: string;
  actions: string[];
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
  matchedEntry?: AssistantKnowledgeEntry;
  createdAt: string;
}

@Component({
  selector: 'app-prim-assistant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prim-assistant.html',
})
export class PrimAssistantPage {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private primAssistant = inject(PrimAssistantService);

  /** Vrai pendant que l'assistant IA génère sa réponse. */
  loading = false;

  readonly quickPrompts = [
    'Comment suivre une candidature ?',
    'Comment demander un conge ?',
    'Ou trouver le dossier administratif ?',
    'Comment lancer une formation ?',
    'Comment suivre un workflow ?',
    'Ou suivre la modernisation RH ?',
  ];

  readonly knowledgeBase: AssistantKnowledgeEntry[] = [
    {
      id: 'recruitment-candidate-tracking',
      title: 'Suivi de candidature',
      module: 'Recrutement',
      route: '/recrutement/portail-candidat',
      keywords: ['candidature', 'candidat', 'recrutement', 'suivre', 'dossier candidat', 'reference'],
      answer:
        'Le suivi candidat se fait depuis le Portail candidat. Le candidat peut rechercher son dossier avec sa reference, son e-mail, son telephone ou sa piece d identite.',
      actions: [
        'Ouvrir le Portail candidat',
        'Verifier la reference du dossier',
        'Consulter le statut et les pieces jointes',
      ],
    },
    {
      id: 'leave-request',
      title: 'Demande de conge',
      module: 'Absences',
      route: '/absences/demandes',
      keywords: ['conge', 'absence', 'permission', 'repos', 'solde', 'demande'],
      answer:
        'Les demandes de conge sont saisies dans le module Absences. Le solde est controle avant validation et le calendrier permet de verifier la disponibilite de l equipe.',
      actions: [
        'Ouvrir les demandes d absences',
        'Verifier le solde disponible',
        'Soumettre la demande au manager',
      ],
    },
    {
      id: 'personnel-file',
      title: 'Dossier administratif agent',
      module: 'Personnel',
      route: '/personnel/dossiers',
      keywords: ['dossier', 'agent', 'document', 'administratif', 'piece', 'ocr', 'badge'],
      answer:
        'Le dossier administratif centralise les pieces, le parcours et les controles de conformite. Les documents valides peuvent alimenter la fiche agent et les suivis RH.',
      actions: [
        'Ouvrir les dossiers administratifs',
        'Controler les pieces obligatoires',
        'Consulter la fiche agent si necessaire',
      ],
    },
    {
      id: 'training-request',
      title: 'Formation et developpement',
      module: 'Formation',
      route: '/formation/demandes',
      keywords: ['formation', 'competence', 'catalogue', 'apprentissage', 'certificat', 'certification'],
      answer:
        'Le module Formation permet de consulter le catalogue, instruire les demandes et suivre les sessions. Les recommandations peuvent etre reliees aux besoins de competences.',
      actions: [
        'Ouvrir les demandes de formation',
        'Comparer avec le catalogue',
        'Suivre la session et la certification',
      ],
    },
    {
      id: 'workflow-signature',
      title: 'Workflow et signature',
      module: 'Workflows',
      route: '/workflows/instances',
      keywords: ['workflow', 'signature', 'validation', 'circuit', 'bpmn', 'pv', 'approbation'],
      answer:
        'Les circuits de validation sont suivis dans le module Workflows. Les instances permettent de controler les etapes, responsables et delais de traitement.',
      actions: [
        'Ouvrir les instances de workflow',
        'Identifier l etape bloquante',
        'Relancer le responsable concerne',
      ],
    },
    {
      id: 'reports-bi',
      title: 'Pilotage RH et BI',
      module: 'Rapports',
      route: '/rapports',
      keywords: ['rapport', 'bi', 'dashboard', 'tableau', 'bord', 'turnover', 'indicateur', 'kpi'],
      answer:
        'Les indicateurs RH sont consolides dans les rapports et tableaux de bord. Ils couvrent les effectifs, recrutements, absences, risques et donnees de pilotage.',
      actions: [
        'Ouvrir les rapports RH',
        'Filtrer par direction ou periode',
        'Exporter les indicateurs utiles',
      ],
    },
    {
      id: 'modernization-rh',
      title: 'Modernisation RH',
      module: 'Modernisation RH',
      route: '/modernisation-rh',
      keywords: ['modernisation', 'proposition', 'strategie', 'innovation', 'ocr', 'gpec', 'bpmn', 'assistant'],
      answer:
        'La page Modernisation RH consolide les propositions strategiques, leur niveau d implementation, les signaux IA et la feuille de route restante.',
      actions: [
        'Ouvrir Modernisation RH',
        'Verifier les modules en surveillance',
        'Traiter les signaux IA prioritaires',
      ],
    },
  ];

  messages: AssistantMessage[] = [
    {
      role: 'assistant',
      text:
        'Bonjour, je suis Prim Assistant. Posez une question RH ou choisissez une demande rapide pour etre oriente vers le bon module.',
      createdAt: new Date().toISOString(),
    },
  ];

  form = this.fb.group({
    question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
  });

  askQuick(prompt: string): void {
    this.form.patchValue({ question: prompt });
    this.ask();
  }

  ask(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const question = String(this.form.value.question || '').trim();
    if (!question || this.loading) {
      return;
    }

    this.messages = [
      ...this.messages,
      { role: 'user', text: question, createdAt: new Date().toISOString() },
    ];
    this.form.reset({ question: '' });
    this.loading = true;
    this.cdr.detectChanges();

    // Appel du vrai assistant IA (backend → LLM). En cas d'indisponibilité,
    // repli sur le moteur de mots-clés local.
    this.primAssistant.chat(question).subscribe({
      next: (response) => {
        const text = (response.text_response || '').trim() || this.offlineAnswer();
        this.pushAssistantMessage(
          response.blocked_reason ? `${text}\n\n⚠️ ${response.blocked_reason}` : text,
        );
      },
      error: () => {
        const match = this.findBestMatch(question);
        this.pushAssistantMessage(
          match ? this.buildMatchedAnswer(match) : this.offlineAnswer(),
          match,
        );
      },
    });
  }

  private pushAssistantMessage(text: string, matchedEntry?: AssistantKnowledgeEntry): void {
    this.messages = [
      ...this.messages,
      { role: 'assistant', text, matchedEntry, createdAt: new Date().toISOString() },
    ];
    this.loading = false;
    this.cdr.detectChanges();
  }

  private offlineAnswer(): string {
    return 'Je n ai pas trouve de correspondance exacte. Reformulez avec un mot cle comme conge, candidature, dossier, formation, workflow ou rapport.';
  }

  clearConversation(): void {
    this.messages = this.messages.slice(0, 1);
  }

  private findBestMatch(question: string): AssistantKnowledgeEntry | undefined {
    const normalizedQuestion = this.normalize(question);
    let bestEntry: AssistantKnowledgeEntry | undefined;
    let bestScore = 0;

    this.knowledgeBase.forEach((entry) => {
      const score = entry.keywords.reduce((sum, keyword) => {
        const normalizedKeyword = this.normalize(keyword);
        return normalizedQuestion.includes(normalizedKeyword) ? sum + normalizedKeyword.length : sum;
      }, 0);
      if (score > bestScore) {
        bestEntry = entry;
        bestScore = score;
      }
    });

    return bestScore > 0 ? bestEntry : undefined;
  }

  private buildMatchedAnswer(entry: AssistantKnowledgeEntry): string {
    return `${entry.answer} Prochaines actions: ${entry.actions.join(' | ')}.`;
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}

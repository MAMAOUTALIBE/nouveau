/**
 * Contenu des pages légales — gabarits initiaux.
 *
 * **Important** : ces textes doivent être validés par un juriste avant
 * publication (cf. ADR-011 « budget juriste » et fiche
 * `MODERNISATION_13_CONDUITE_CHANGEMENT_CONFORMITE.md` § P1).
 *
 * Le contenu est en HTML simple (pas de Markdown runtime) pour rester
 * léger et accessible (lecteurs d'écran sans dépendance de parser).
 */

export interface LegalSection {
  readonly heading: string;
  readonly html: string;
}

export interface LegalPageContent {
  readonly title: string;
  readonly subtitle?: string;
  readonly lastUpdated: string; // ISO date
  readonly intro?: string;
  readonly sections: ReadonlyArray<LegalSection>;
  readonly contactBlock?: string;
  readonly status: 'draft-juridique' | 'valide';
}

export const LEGAL_CONTENT: Readonly<Record<string, LegalPageContent>> = {
  // ---------------------------------------------------------------------
  // 1. Mentions légales
  // ---------------------------------------------------------------------
  'mentions-legales': {
    title: 'Mentions légales',
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "Conformément aux exigences de transparence d'un service public, le présent " +
      "site (« GPA-GOUVE ») est édité par la DRH de la République de Guinée.",
    sections: [
      {
        heading: 'Éditeur',
        html:
          '<p><strong>DRH de la République de Guinée</strong><br />' +
          'Adresse : à compléter<br />' +
          'Téléphone : à compléter<br />' +
          'Adresse électronique : <code>contact@prim.gov.gn</code></p>',
      },
      {
        heading: 'Directeur de la publication',
        html: '<p>À désigner par lettre de mission du Cabinet du Premier Ministre.</p>',
      },
      {
        heading: 'Hébergement',
        html: '<p>Hébergement : à compléter (cf. ADR-001 du dossier projet).</p>',
      },
      {
        heading: 'Propriété intellectuelle',
        html:
          '<p>Sauf mention contraire explicite, l’ensemble des contenus, ' +
          'données et logiciels publiés sur ce site relèvent du domaine ' +
          'administratif de la République de Guinée. Toute reproduction ou ' +
          'utilisation non autorisée est susceptible de poursuites.</p>',
      },
    ],
    contactBlock:
      'Pour toute question concernant les présentes mentions, écrivez à ' +
      '<code>dpo@prim.gov.gn</code>.',
  },

  // ---------------------------------------------------------------------
  // 2. CGU
  // ---------------------------------------------------------------------
  cgu: {
    title: "Conditions générales d'utilisation",
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "Les présentes conditions définissent les règles d'usage de l'application " +
      "GPA-GOUVE par les agents de l'État guinéen et les utilisateurs externes " +
      "autorisés (candidats à un concours, partenaires institutionnels).",
    sections: [
      {
        heading: 'Acceptation',
        html:
          '<p>L’accès à l’application implique l’acceptation pleine et entière des ' +
          'présentes conditions. Une charte d’utilisation distincte est présentée ' +
          'au premier accès aux agents.</p>',
      },
      {
        heading: 'Usage autorisé',
        html:
          '<p>L’application est destinée à un usage <strong>strictement ' +
          'professionnel</strong>. Toute utilisation à des fins personnelles, ' +
          'commerciales ou contraires à l’éthique du service public est ' +
          'interdite.</p>',
      },
      {
        heading: 'Compte et identifiants',
        html:
          '<p>Chaque agent est responsable de la confidentialité de ses ' +
          'identifiants. Le partage de comptes est strictement prohibé. ' +
          'L’authentification renforcée (MFA) est obligatoire pour les rôles ' +
          'sensibles.</p>',
      },
      {
        heading: 'Disponibilité et maintenance',
        html:
          '<p>L’éditeur s’efforce d’assurer une disponibilité de niveau service ' +
          'public. Le contrat de service détaillé (SLA) est disponible sur ' +
          'demande à la DSI DRH.</p>',
      },
      {
        heading: 'Limitations de responsabilité',
        html:
          '<p>L’éditeur ne peut être tenu pour responsable d’éventuels ' +
          'dommages résultant d’un usage non conforme aux présentes ' +
          'conditions ou d’un cas de force majeure.</p>',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 3. Politique de confidentialité (RGPD-GN, loi 037/AN/2016)
  // ---------------------------------------------------------------------
  confidentialite: {
    title: 'Politique de confidentialité',
    subtitle: 'Conformité loi 037/AN/2016 et règles de protection des données personnelles',
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "La DRH s'engage à traiter les données personnelles des agents et " +
      "candidats avec rigueur et transparence, conformément à la loi " +
      "037/AN/2016 du 24 octobre 2016 relative à la cyber-sécurité et la " +
      "protection des données à caractère personnel.",
    sections: [
      {
        heading: 'Responsable de traitement',
        html:
          '<p>La DRH de la République de Guinée est responsable du ' +
          'traitement des données collectées et traitées par GPA-GOUVE.</p>',
      },
      {
        heading: 'Délégué à la Protection des Données (DPO)',
        html:
          '<p>Un DPO est désigné. Pour toute demande relative à vos données ' +
          'personnelles, écrivez à <code>dpo@prim.gov.gn</code>.</p>',
      },
      {
        heading: 'Finalités des traitements',
        html:
          '<p>Les données collectées servent exclusivement aux finalités RH ' +
          'légitimes : gestion administrative des agents, paie indiciaire, ' +
          'gestion des congés, recrutement, formation, performance, ' +
          'discipline. Le registre complet des traitements est tenu à jour ' +
          'et consultable sur demande.</p>',
      },
      {
        heading: 'Bases légales',
        html:
          '<p>Les traitements reposent sur le statut général de la fonction ' +
          'publique, l’intérêt légitime de l’employeur public et, ' +
          'subsidiairement, le consentement explicite de l’agent ou du ' +
          'candidat lorsque la base légale l’exige.</p>',
      },
      {
        heading: 'Durées de conservation',
        html:
          '<p>Les données sont conservées pour la durée nécessaire aux ' +
          'finalités du traitement, augmentée des durées légales de ' +
          'conservation administratives. Indicatif : dossier RH 5 ans après ' +
          'cessation de fonction, données pension 50 ans, candidatures non ' +
          'retenues 1 an. Une procédure d’archivage et de purge est ' +
          'automatisée.</p>',
      },
      {
        heading: 'Vos droits',
        html:
          '<p>Vous disposez des droits suivants : accès, rectification, ' +
          'opposition, portabilité, effacement (« droit à l’oubli »). Pour ' +
          'les exercer, rendez-vous sur la page « Mes données » de votre ' +
          'portail self-service ou écrivez au DPO.</p>',
      },
      {
        heading: 'Algorithmes et IA',
        html:
          '<p>Trois algorithmes manipulent vos données : le scoring de ' +
          'risque de turnover, le matching de CV par grand modèle de ' +
          'langage, l’évaluation 360°. Chacun fait l’objet d’une analyse ' +
          'd’impact (DPIA) consultable sur demande. Vous pouvez demander une ' +
          'revue humaine sans intervention algorithmique.</p>',
      },
      {
        heading: 'Sécurité',
        html:
          '<p>Les données sont chiffrées au repos et en transit. ' +
          'L’authentification des agents est renforcée par un second facteur ' +
          'pour les rôles sensibles. Les journaux d’accès sont conservés et ' +
          'audités.</p>',
      },
    ],
    contactBlock:
      "DPO DRH : <code>dpo@prim.gov.gn</code>. Vous pouvez également " +
      "saisir l'autorité nationale (CNPDP-GN) en cas de désaccord persistant.",
  },

  // ---------------------------------------------------------------------
  // 4. Cookies
  // ---------------------------------------------------------------------
  cookies: {
    title: 'Politique cookies',
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "L'application GPA-GOUVE utilise un nombre limité de cookies et " +
      "technologies de stockage local, dont l'usage est explicité ci-dessous.",
    sections: [
      {
        heading: 'Cookies strictement nécessaires',
        html:
          '<ul>' +
          '<li><code>session</code> — cookie d’authentification HttpOnly + ' +
          'Secure + SameSite=Lax. Indispensable au fonctionnement.</li>' +
          '<li><code>csrf_token</code> — protection contre les attaques ' +
          'CSRF.</li>' +
          '</ul>',
      },
      {
        heading: 'Stockage local non sensible',
        html:
          '<ul>' +
          '<li><code>theme</code> — préférence claire/sombre.</li>' +
          '<li><code>nav_collapsed</code> — état du menu latéral.</li>' +
          '</ul>',
      },
      {
        heading: 'Pas de traceurs publicitaires ni de mesure d’audience tierce',
        html:
          '<p>L’application ne place aucun traceur publicitaire, n’utilise ' +
          'aucun service de mesure d’audience tiers (Google Analytics, ' +
          'Matomo cloud, etc.) et n’intègre aucun bouton de partage social.</p>',
      },
      {
        heading: 'Gestion de vos préférences',
        html:
          '<p>Vous pouvez configurer vos préférences sur la page <a href="/preferences-cookies">Préférences cookies</a>.</p>',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 5. Accessibilité
  // ---------------------------------------------------------------------
  accessibilite: {
    title: 'Déclaration d’accessibilité',
    subtitle: 'Conformité au Référentiel Général d’Accessibilité (RGAA 4.1)',
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "La DRH s'engage à rendre le site GPA-GOUVE accessible à toutes " +
      "et à tous, conformément aux principes du RGAA 4.1 et de la norme " +
      "internationale WCAG 2.1 AA.",
    sections: [
      {
        heading: 'État de conformité',
        html:
          '<p><strong>Statut : audit en cours.</strong> Un audit RGAA externe ' +
          'a été commandé (cf. fiche modernisation 13 § P16). Le résultat ' +
          'détaillé sera publié ici dès finalisation.</p>',
      },
      {
        heading: 'Technologies utilisées',
        html:
          '<ul>' +
          '<li>HTML5, CSS3, JavaScript (TypeScript / Angular)</li>' +
          '<li>Aria + rôles WAI-ARIA</li>' +
          '</ul>',
      },
      {
        heading: 'Outils utilisés pour la vérification',
        html:
          '<ul>' +
          '<li>axe-core (intégré aux tests automatisés)</li>' +
          '<li>Lighthouse CI</li>' +
          '<li>NVDA, VoiceOver pour les tests manuels</li>' +
          '</ul>',
      },
      {
        heading: 'Retour d’information',
        html:
          '<p>Si vous rencontrez un défaut d’accessibilité vous empêchant ' +
          'd’accéder à un contenu ou une fonctionnalité, contactez ' +
          '<code>accessibilite@prim.gov.gn</code>.</p>',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 6. Security.txt — politique de divulgation responsable
  // ---------------------------------------------------------------------
  security: {
    title: 'Politique de divulgation responsable',
    subtitle: 'security.txt (RFC 9116)',
    lastUpdated: '2026-05-11',
    status: 'draft-juridique',
    intro:
      "La DRH accueille les rapports de chercheurs en sécurité ayant " +
      "identifié de bonne foi des vulnérabilités sur GPA-GOUVE.",
    sections: [
      {
        heading: 'Contact',
        html:
          '<p>Adresse : <code>security@prim.gov.gn</code><br />' +
          'Clé PGP : <a href="/.well-known/pgp-key.asc">/.well-known/pgp-key.asc</a></p>',
      },
      {
        heading: 'Périmètre',
        html:
          '<p>Domaines : <code>*.prim.gov.gn</code>. Hors périmètre : ' +
          'plateformes tierces, sous-domaines de partenaires.</p>',
      },
      {
        heading: 'Politique',
        html:
          '<ul>' +
          '<li>Pas de test de déni de service ni de campagne d’ingénierie ' +
          'sociale sur les agents.</li>' +
          '<li>Donnez-nous un délai raisonnable (minimum 90 jours) avant ' +
          'toute divulgation publique.</li>' +
          '<li>Nous remercierons les contributeurs dans une page « hall of ' +
          'fame » avec leur consentement.</li>' +
          '</ul>',
      },
      {
        heading: 'Pas de poursuites',
        html:
          '<p>La DRH s’engage à ne pas poursuivre les chercheurs ' +
          'respectant la présente politique.</p>',
      },
    ],
  },
};

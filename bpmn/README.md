# Modèles BPMN — workflows RH versionnés

Ce dossier contient les modèles BPMN 2.0 utilisés par le backend Python
quand `BPMN_PROVIDER=spiff`. Les fichiers sont éditables avec
[bpmn.io](https://bpmn.io) (editor web open-source) et versionnés en Git.

## Fichiers

| Fichier | Code | Description |
|---------|------|-------------|
| `leave_request.bpmn` | `LEAVE_REQUEST_V1` | Validation d'une demande de congé : N+1 → DRH (si > 5 jours). |
| `attestation_request.bpmn` | `ATTESTATION_V1` | Demande d'attestation administrative simple. |
| `recruitment_application.bpmn` | `RECRUITMENT_V1` | Tri des candidatures, présélection, entretien, décision. |

## Convention

- Nom du fichier = code du workflow (snake_case → SCREAMING_SNAKE_CASE).
- Tous les ID techniques doivent commencer par `wf_`.
- Le **start event** doit avoir l'ID `wf_start`.
- Le **end event** d'approbation finale doit avoir l'ID `wf_end_approved`.
- Les **user tasks** (décisions humaines) doivent porter un attribut
  `camunda:assignee` ou utiliser un script SpiffWorkflow.
- Les **gateways exclusives** suivent une convention `wf_gateway_<nom>`.

## Bonnes pratiques

- Versionner via Git, pas via une table SQL : la traçabilité est immédiate.
- Pour modifier un workflow déployé, créer un nouveau fichier suffixé `_v2`
  plutôt qu'écraser : les instances existantes restent rattachées à la
  version d'origine.
- Tester avec SpiffWorkflow Python avant de pousser :
  ```python
  from SpiffWorkflow.bpmn.parser.BpmnParser import BpmnParser
  parser = BpmnParser()
  parser.add_bpmn_file("leave_request.bpmn")
  spec = parser.get_spec("LEAVE_REQUEST_V1")
  ```

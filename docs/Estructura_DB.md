Estructura prototipo de base de datos (MVP): Proponente, Actor, Escuela, Observacion e Historial de Estado.

## Vista de clases

Class Proyecto
- id: UUID
- projectCode: String
- name: String
- description: Text
- context: Text
- type: ProjectType
- status: ProjectStatus
- startDate: Date
- endDate: Date [0..1]
- estimatedCost: Decimal [0..1]
- createdAt: DateTime
- updatedAt: DateTime

Class EscuelaProyecto
- projectId: UUID
- schoolName: String

Class ProponenteNatural
- projectId: UUID
- fullName: String
- idNumber: String
- age: Integer
- email: String

Class ProponenteJuridico
- projectId: UUID
- legalName: String
- taxId: String
- email: String
- phone: String
- contactUrl: String [0..1]

Class Actor
- id: UUID
- fullName: String
- email: String [0..1]
- createdAt: DateTime
- updatedAt: DateTime

Class AsignacionActorProyecto
- id: UUID
- projectId: UUID
- actorId: UUID
- role: ActorRole
- assignedAt: DateTime

Class ObservacionProyecto
- id: UUID
- projectId: UUID
- content: Text
- createdAt: DateTime

Class HistorialEstadoProyecto
- id: UUID
- projectId: UUID
- previousStatus: ProjectStatus [0..1]
- nextStatus: ProjectStatus
- description: Text [0..1]
- authorActorId: UUID [0..1]
- changedAt: DateTime

## Enums

Enum ProjectType
- engineering
- consulting

Enum ProjectStatus
- proposed
- under_review
- approved
- assigned
- in_progress
- closed
- rejected

Enum ActorRole
- director
- coordinator
- student
- evaluator
- administrator

Enum ProposerType
- natural_person
- legal_entity

## Relaciones

Proyecto "1" -- "0..*" EscuelaProyecto : incluye
Proyecto "1" -- "0..1" ProponenteNatural : tiene
Proyecto "1" -- "0..1" ProponenteJuridico : tiene
Proyecto "1" -- "0..*" AsignacionActorProyecto : define
Actor "1" -- "0..*" AsignacionActorProyecto : participa
Proyecto "1" -- "0..*" ObservacionProyecto : registra
Proyecto "1" -- "0..*" HistorialEstadoProyecto : traza
Actor "0..1" -- "0..*" HistorialEstadoProyecto : autor

## Restricciones

- Codigo de proyecto unico. No pueden existir dos proyectos con el mismo projectCode.

- Proponente exclusivo por proyecto, Cada Proyecto debe tener exactamente un tipo de proponente: ProponenteNatural o ProponenteJuridico, nunca ambos al mismo tiempo.

- Un actor, un rol por proyecto. En un mismo Proyecto, un Actor no puede aparecer dos veces en AsignacionActorProyecto.

- Integridad referencial: Toda entidad hija debe pertenecer a un Proyecto existente. Toda asignacion debe referenciar un Actor existente.

- Edad valida para proponente natural >= 18

Transiciones de estado controladas
- Se permiten solo estas transiciones:
  - proposed -> under_review | rejected
  - under_review -> approved | rejected
  - approved -> assigned | rejected
  - assigned -> in_progress | rejected
  - in_progress -> closed | rejected


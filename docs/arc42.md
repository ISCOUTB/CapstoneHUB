# Documentación de Arquitectura CapstoneHUB - arc42

# Introducción y Metas {#section-introduction-and-goals}

## Vista de Requerimientos {#_vista_de_requerimientos}

CapstoneHUB es un sistema web de gestión integral para proyectos Capstone que facilita la postulación, evaluación, seguimiento y cierre de proyectos de titulación. El sistema permite a empresas, docentes y organizaciones sociales proponer proyectos, mientras que estudiantes y profesores pueden gestionar el ciclo completo de desarrollo.

### Requerimientos Funcionales Principales

1. **Gestión de Postulaciones**
   - Permitir postulación de proyectos de ingeniería y consultoría
   - Formato flexible para propuestas de empresas, docentes y proyectos sociales
   - Flujo de evaluación con directivos
   - Proceso de asignación de proyectos a estudiantes

2. **Banco de Proyectos**
   - Listado de proyectos disponibles
   - Seguimiento de proyectos en proceso
   - Hub/galería de proyectos (histórico y activos)
   - Gestión de estados de proyectos

3. **Gestión de Entregas**
   - Entregas parciales (weekly reports)
   - Hitos de entrega programados
   - Documento oficial de proyecto
   - Artículo final
   - Sistema de carga de archivos para estudiantes

4. **Gestión de Usuarios y Roles**
   - Single Sign-On (SSO)
   - Profesores con múltiples roles
   - Responsables internos y externos
   - Estudiantes con permisos de carga

5. **Automatización Administrativa**
   - Generación de cartas de derecho
   - Documentación oficial automatizada

## Metas de Calidad {#_metas_de_calidad}

| Prioridad | Atributo de Calidad | Escenario |
|-----------|---------------------|-----------|
| 1 | **Usabilidad** | El sistema debe ser intuitivo, con manual de usuario completo. Usuarios nuevos deben poder postular proyectos en menos de 15 minutos. |
| 2 | **Mantenibilidad** | Arquitectura modular con NestJS y NextJS que permita actualizaciones independientes de frontend y backend. |
| 3 | **Portabilidad** | Todo el sistema debe ser desplegable mediante Docker en cualquier infraestructura. |
| 4 | **Seguridad** | Implementación de SSO, autenticación robusta y control de acceso basado en roles (RBAC). |
| 5 | **Escalabilidad** | El sistema debe soportar múltiples postulaciones simultáneas y gestión de +100 proyectos concurrentes. |
| 6 | **Disponibilidad** | Sistema disponible 99% del tiempo durante períodos de postulación y entrega. |

## Partes interesadas (Stakeholders) {#_partes_interesadas_stakeholders}

| Rol/Nombre | Contacto | Expectativas |
|------------|----------|--------------|
| **Profesores Coordinadores** | Profesora coordinadora del proyecto | Sistema que simplifique la gestión administrativa de proyectos Capstone, con trazabilidad completa del proceso. |
| **Profesor Técnico** | Profesor de especificaciones técnicas | Infraestructura moderna, escalable y fácil de mantener usando tecnologías específicas (NestJS, NextJS, PostgreSQL, Docker). |
| **Directivos** | Profesores coordinadores | Interfaz clara para revisar y aprobar postulaciones de proyectos según criterios establecidos. |
| **Evaluadores de Expo** | Profesores jurados | Registro y consulta de la evaluación de las presentaciones finales de los proyectos. |
| **Estudiantes** | Alumnos de proyecto Capstone | Plataforma simple para visualizar proyectos disponibles, subir entregas y hacer seguimiento de su progreso. |
| **Empresas Postulantes** | Organizaciones externas | Proceso de postulación flexible y seguimiento del estado de sus propuestas. |
| **Docentes Postulantes** | Profesores con proyectos de investigación | Facilidad para proponer proyectos académicos y dar seguimiento. |
| **Organizaciones Sociales** | ONGs o proyectos comunitarios | Acceso simplificado para postular proyectos de impacto social. |
| **Administradores del Sistema** | IT de la institución | Sistema fácil de desplegar, mantener y monitorear. |

# Restricciones de la Arquitectura {#section-architecture-constraints}

## Restricciones Técnicas

| Restricción | Descripción |
|-------------|-------------|
| **Backend Framework** | Obligatorio usar **NestJS** (Node.js framework) |
| **Frontend Framework** | Obligatorio usar **NextJS** (React framework) |
| **Base de Datos** | Obligatorio usar **PostgreSQL** |
| **Containerización** | El sistema completo debe ser desplegable con **Docker** |
| **Tipo de Aplicación** | Aplicación **web** |

## Restricciones Organizacionales

| Restricción | Descripción |
|-------------|-------------|
| **Equipo de Desarrollo** | Equipo estudiantil con supervisión de profesores |
| **Timeline MVP** | Definir y desarrollar MVP antes de la siguiente reunión de equipo |
| **Reunión de Validación** | Presentación con profesores responsables programadas |

## Restricciones de Convenciones

| Restricción | Descripción |
|-------------|-------------|
| **Manual de Usuario** | Obligatorio proporcionar manual de usuario completo |
| **Formato de Postulación** | Debe ser más flexible que el formato actual manual |

# Alcance y Contexto del Sistema {#section-context-and-scope}

## Contexto de Negocio {#_contexto_de_negocio}

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Empresas     │         │    Docentes     │         │  Organizaciones │
│   Postulantes   │         │   Postulantes   │         │    Sociales     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │     Postulación de Proyectos                          │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                        ┌────────────────────────┐
                        │                        │
                        │   CapstoneHUB System   │
                        │                        │
                        └───────────┬────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │     Comité      │
                           │   Evaluador     │
                           │                 │
                           │ - Evaluar       │
                           │ - Aprobar       │
                           └─────────────────┘
                                    │
         ┌─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌─────────────────┐                                    ┌─────────────────┐
│   Estudiantes   │                                    │    Profesores   │      
│                 │                                    │   Coordinadores │      
│ - Ver proyectos │                                    │                 │      
│ - Subir entregas│                                    │ - Seguimiento   │      
│ - Weekly reports│                                    │ - Gestionar     │      
└─────────────────┘                                    └─────────────────┘      
         │                                                     │
         └─────────────────────────────────────────────────────┘
                                    ▼
                        ┌────────────────────────┐
                        │   Sistema SSO          │
                        │   (Autenticación)      │
                        └────────────────────────┘
```

### Interfases de Negocio

| Interfaz | Actor | Descripción |
|----------|-------|-------------|
| **Postulación de Proyectos** | Empresas, Docentes, ONGs | Formulario flexible para proponer proyectos de ingeniería o consultoría |
| **Evaluación de Propuestas** | Directivos | Sistema para revisar y aprobar/rechazar postulaciones |
| **Asignación de Proyectos** | Profesores Coordinadores | Proceso de matching entre proyectos aprobados y estudiantes |
| **Gestión de Entregas** | Estudiantes | Portal para subir reportes semanales, hitos y entregables |
| **Seguimiento de Proyectos** | Profesores, Estudiantes, Empresas, ONGs | Dashboard con estados, avances y próximos hitos |
| **Generación de Documentos** | Sistema | cartas y documentos oficiales |

## Contexto Técnico {#_contexto_t_cnico}

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet/Intranet                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
                ┌──────────────────────┐
                │   UTB Infra          │
                │                      │
                └──────────┬───────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│   Frontend Service   │       │   Backend Service    │
│                      │       │                      │
│   NextJS (React)     │◄─────►│   NestJS (Node.js)   │
│   - Server-Side      │  API  │   - REST/GraphQL     │
│     Rendering        │       │   - Business Logic   │
│   - Client UI        │       │   - Authentication   │
└──────────────────────┘       └──────────┬───────────┘
                                          │
                           ┌──────────────┴──────────────┐
                           │                             │
                           ▼                             ▼
                ┌──────────────────────┐     ┌──────────────────────┐
                │   PostgreSQL DB      │     │   File Storage       │
                │   - Relational Data  │     │   - Documents        │
                │   - User Management  │     │   - Reports          │
                │   - Project Data     │     │   - Deliverables     │
                └──────────────────────┘     └──────────────────────┘
                           │                             │
                           └──────────────┬──────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │   SSO Provider       │
                              │   (OAuth2/SAML)      │
                              └──────────────────────┘
```

### Interfases Técnicas

| Interfaz | Tecnología | Descripción |
|----------|------------|-------------|
| **Frontend ↔ Backend** | REST API | Comunicación mediante HTTPS |
| **Backend ↔ Database** | (Indefinido) | ORM para PostgreSQL con migraciones |
| **Backend ↔ SSO** | (Indefinido) | Autenticación |
| **Backend ↔ File Storage** | (Infedinido) | Almacenamiento de documentos |
| **Container Orchestration** | Docker Compose | Orquestación de servicios en desarrollo y producción |

### Mapeo de Entrada/Salida a Canales

| Entrada/Salida | Canal | Formato |
|----------------|-------|---------|
| Postulación de proyecto | HTTPS (Frontend → Backend) | JSON (multipart/form-data para archivos) |
| Carga de entregas | HTTPS (Frontend → Backend) | multipart/form-data |
| Consultas de datos | HTTPS (Frontend ↔ Backend) | JSON |
| Notificaciones | Email | HTML/Text plano |
| Generación de PDFs | Backend → File Storage | PDF |
| Autenticación | HTTPS (Backend ↔ SSO) | --- |

# Estrategia de solución {#section-solution-strategy}

## Decisiones Tecnológicas

### Stack Principal

1. **Frontend: NextJS**
   - Server-Side Rendering
   - React para componentes reutilizables
   - TypeScript provee type-safety
   - TailwindCSS para estilos

2. **Backend: NestJS**
   - Arquitectura modular con inyección de dependencias
   - Soporte nativo para TypeScript
   - Integración con ORMs para PostgreSQL

3. **Base de Datos: PostgreSQL**
   - Base de datos relacional robusta
   - Soporte para transacciones ACID
   - Migraciones versionadas

4. **Containerización: Docker**
   - Docker Compose para orquestación local
   - Volúmenes para persistencia de datos

## Enfoque Arquitectónico

### Patrón: Arquitectura en Capas con Microservicios Ligeros

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer (NextJS)                 │
│  - Server Components     - Client Components             │
│  - Pages/Routes          - UI Components                 │
└────────────────────────┬────────────────────────────────┘
                         │ API Calls
┌────────────────────────▼────────────────────────────────┐
│              Application Layer (NestJS)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Projects  │  │    Users    │  │ Submissions │    │
│  │   Module    │  │   Module    │  │   Module    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         Shared: Validators, DTOs           │
└────────────────────────┬────────────────────────────────┘
                         │ ORM
┌────────────────────────▼────────────────────────────────┐
│              Data Layer (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Projects   │  │    Users    │  │ Submissions │    │
│  │   Table     │  │   Table     │  │   Table     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Módulos Principales del Backend

1. **Auth Module**: SSO, control de acceso
2. **Projects Module**: CRUD de proyectos, estados, asignaciones
3. **Submissions Module**: Entregas, reportes, hitos
4. **Users Module**: Gestión de usuarios, roles, perfiles
5. **Evaluation Module**: Directivos, aprobaciones y evaluación de expo
6. **Documents Module**: Generación de PDFs
7. **Notifications Module**: Emails, alertas de deadline

## Enfoque para Alcanzar Metas de Calidad

| Meta de Calidad | Estrategia de Solución |
|-----------------|------------------------|
| **Usabilidad** | Feedback visual inmediato, Manual de usuario integrado |
| **Mantenibilidad** | Arquitectura modular, Separación de frontend y backend, TypeScript en todo el stack, Testing automatizado |
| **Portabilidad** | Docker Compose para desarrollo, Variables de entorno para configuración, Documentación de despliegue |
| **Seguridad** | SSO corporativo, control de acceso con roles, HTTPS es obligatorio |

## Decisiones Organizacionales

### Definición de MVP (Preliminar)

El MVP debe permitir:
1. **Postular proyectos** con formato flexible
2. **Gestionar proyectos** (visualización, estados, asignación)
3. **Cierre básico** (subir entregable final)

**Fuera del MVP inicial:**
- Generación automática de documentos
- reportes semanales
- Notificaciones
- Galería pública de proyectos históricos

---

# Vista de Bloques {#section-building-block-view}

## Sistema General de Caja Blanca {#_sistema_general_de_caja_blanca}

```
┌─────────────────────────────────────────────────────────────────┐
│                        CapstoneHUB System                        │
│                                                                   │
│  ┌────────────────────┐           ┌─────────────────────────┐  │
│  │                    │           │                         │  │
│  │  Frontend Service  │◄─────────►│   Backend Service       │  │
│  │     (NextJS)       │   REST    │      (NestJS)           │  │
│  │                    │   API     │                         │  │
│  └────────────────────┘           └──────────┬──────────────┘  │
│                                               │                  │
│                                    ┌──────────┴──────────┐      │
│                                    │                     │      │
│                         ┌──────────▼─────────┐  ┌───────▼──────┐
│                         │                    │  │              │
│                         │  Database Service  │  │  SSO Service │
│                         │   (PostgreSQL)     │  │   (OAuth2)   │
│                         │                    │  │              │
│                         └────────────────────┘  └──────────────┘
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Motivación

El sistema se divide en cuatro componentes principales desacoplados que se comunican mediante interfaces bien definidas, permitiendo desarrollo, testeo y despliegue independiente.

### Bloques de construcción contenidos

| Componente | Responsabilidad |
|------------|-----------------|
| **Frontend Service** | Interfaz de usuario, renderizado, interacción con usuarios |
| **Backend Service** | Lógica de negocio, validaciones, orquestación de datos |
| **Database Service** | Persistencia de datos, integridad referencial |
| **SSO Service** | Autenticación y autorización de usuarios |

### Interfases importantes

- **Frontend ↔ Backend**: REST API
- **Backend ↔ Database**: PostgreSQL
- **Backend ↔ SSO**: Autenticación con correo institucional

---

*[El resto del documento arc42 con Nivel 2, Nivel 3, Vista de Ejecución, Vista de Despliegue, Conceptos Transversales, etc., se completará en iteraciones futuras una vez validados los requerimientos en la reunión con profesores]*

---

# Decisiones de Diseño {#section-design-decisions}

| N | Decisión | Justificación | Consecuencias |
|----|----------|---------------|---------------|
| **001** | Usar NextJS para frontend | Requerimiento del profesor. SSR mejora SEO y performance. | Curva de aprendizaje moderada, pero buen soporte de comunidad. |
| **002** | Usar NestJS para backend | Requerimiento del profesor. Arquitectura modular escalable. | Estructura de proyecto más compleja que Express simple. |
| **003** | PostgreSQL como base de datos | Requerimiento del profesor. Relacional, robusto, open-source. | Necesidad de modelar schema cuidadosamente. |
| **004** | Implementar SSO | Mayor seguridad, mejor UX, integración con sistemas institucionales. | Dependencia del correo institucional. |
| **005** | Arquitectura monolítica modular | Simplicidad para MVP, fácil de desplegar con Docker. | Puede requerir refactor a microservicios en el futuro. |
| **006** | TypeScript en todo el stack | Type safety, mejor mantenibilidad, menos errores en runtime. | Overhead inicial de configuración y tipado. |

---

# Riesgos y deuda técnica {#section-technical-risks}

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Integración SSO no disponible a tiempo** | Media | Alto | Implementar autenticación básica con JWT como fallback temporal |
| **Alcance del MVP no claro** | Alta | Alto | Realizar reunión de validación con profesores |
| **Formato de postulación flexible muy complejo** | Media | Medio | Usar formularios dinámicos con react-hook-form y JSON schemas |
| **Generación de documentos oficiales compleja** | Media | Medio | Dejar para post-MVP, priorizar funcionalidad principal |
| **Infraestructura de deployment no definida** | Media | Medio | Documentar deployment con Docker Compose desde el inicio |

---

# Glosario {#section-glossary}

| Término | Definición |
|---------|------------|
| **Capstone** | Proyecto de titulación que culmina la carrera de ingeniería |
| **MVP** | Minimum Viable Product - Producto mínimo viable para validación |
| **SSO** | Single Sign-On - Sistema de autenticación única |
| **Hito** | Entrega parcial programada en el cronograma del proyecto |
| **Directivo** | Rol global que revisa y aprueba postulaciones y supervisa los proyectos |
| **Evaluador de Expo** | Rol global que evalúa las presentaciones finales en los proyectos donde se le asigna |
| **Postulación** | Propuesta de proyecto presentada por empresas, docentes u ONGs |
| **Asignación** | Proceso de matching entre proyecto aprobado y estudiantes |
| **RBAC** | Role-Based Access Control - Control de acceso basado en roles |
| **ORM** | Object-Relational Mapping - Mapeo objeto-relacional |
| **Docker Compose** | Herramienta para definir y ejecutar aplicaciones Docker multi-contenedor |


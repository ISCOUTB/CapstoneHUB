CapstoneHUB es un servicio diseñado para apoyar la gestión integral de proyectos que permiten a los estudiantes aplicar conocimientos académicos a situaciones del mundo real, a menudo en colaboración con empresas en entornos de ingeniería aplicada su propósito es facilitar la administración, seguimiento y evaluación de los proyectos de titulación, permitiendo optimizar los recursos disponibles y mejorar la coordinación entre los distintos actores involucrados.

A traves de la plataforma, empresas, docentes y organizaciones sociales pueden proponer proyectos, mientras que estudiantes y profesores gestionan el proceso completo de desarrollo, desde la postulación hasta el cierre de esta manera, CapstoneHUB busca centralizar la información, agilizar los procesos de evaluación y fortalecer la colaboración entre estudiantes, supervisores y administradores dentro del ecosistema académico.

# Objetivos

## General

Desarrollar un servicio de gestion integral para la administracion, postulación, evaluacion y seguimiento de proyectos Capstone, que permita centralizar la informacion, optimizar los procesos administrativos y facilitar la coordinacion entre estudiantes, docentes, comite evaluador y organizaciones externas.

## Específicos

- levantamiento requerimientos o diseñar la plataforma 

- implementación de funcionalidades.

- pruebas

# Requerimientos 

## Requerimientos Funcionales

### Gestión de Postulaciones
- Permitir postulación de proyectos de ingeniería y consultoría
- Formato flexible para propuestas de empresas, docentes y proyectos sociales
- Flujo de evaluación con comité evaluador
- Proceso de asignación de proyectos a estudiantes

### Banco de Proyectos
- Listado de proyectos disponibles
- Seguimiento de proyectos en proceso
- Hub/galería de proyectos (histórico y activos)
- Gestión de estados de proyectos

### Gestión de Entregas
- Entregas parciales (weekly reports)
- Hitos de entrega programados
- Documento oficial de proyecto
- Artículo final
- Sistema de carga de archivos para estudiantes

### Gestión de Usuarios y Roles
- Single Sign-On (SSO)
- Profesores con múltiples roles
- Responsables internos y externos
- Estudiantes con permisos de carga

### Automatización Administrativa
- Generación de cartas de derecho
- Documentación oficial automatizada

## Requerimientos No Funcionales

### Rendimiento
- Debe ser capaz de renderizar listas multiples proyectos sin que se congele el sistema.
- La navegación debe ser rápida, con tiempos de respuesta máximos de 3 segundos.

### Usabilidad
- Debe ser fácil de utilizar, sin necesidad de tener que masterizar la herramienta para ser capaz de usarlo.
- Consistencia Visual con el diseño de la UTB.
- Visualmente accesible, sin colores, efectos o animaciones extremas.
- Tolerancia a fallos del sistema y errores de usuario.

### Mantenibilidad
- El sistema debe ser mantenible, para poder corregir errores o actualizar funcionalidades sin caer en demasiada complejidad.

### Portabilidad
- Debe funcionar bien en los navegadores mayores, 
- Vista adaptativa a diferentes tamaños de pantallas.

# Alcance

El proyecto CapstoneHUB consiste en el desarrollo de un sistema web para gestionar proyectos Capstone dentro del entorno académico. La plataforma permitirá centralizar la postulación, evaluación, asignación y seguimiento de proyectos de titulación propuestos por empresas, docentes y organizaciones sociales.

El sistema será implementado utilizando NextJS para el frontend, NestJS para el backend y PostgreSQL como base de datos, con despliegue mediante Docker. La primera versión del sistema incluirá la postulación de proyectos, la visualización y gestión de proyectos aprobados, y la carga del entregable final por parte de los estudiantes. El desarrollo del MVP se realizará durante el periodo del proyecto y será presentado para validación ante los profesores responsables.

# Cronograma

![Cronograma](./Cronograma-gantt.png)


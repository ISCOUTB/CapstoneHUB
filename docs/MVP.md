# Producto Minimo Viable

## Objetivo del MVP

Entregar una primera version funcional del sistema CapstoneHUB que permita registrar, revisar y gestionar proyectos Capstone de forma centralizada, con trazabilidad basica y despliegue reproducible en contenedores.

El MVP debe validar el siguiente flujo:

1. Un proponente registra un proyecto.
2. Un administrador revisa y decide su estado.
3. Se asignan actores del proyecto.
4. El sistema permite consultar y dar seguimiento basico.

## Alcance Funcional

### Backend

1. Crear proyectos:
   - Persona natural.
   - Persona juridica.
2. Listar proyectos y consultar detalle por identificador.
3. Actualizar estado del proyecto segun flujo definido.
4. Gestionar actores del proyecto en el modelo de dominio.
5. Registrar observaciones basicas del proyecto.
6. Una persona solo puede tener un rol dentro del mismo proyecto.

### Frontend

1. Vista publica de proyectos (listado y detalle basico).
2. Formulario para proponer proyecto.
3. Flujo de formulario simple y guiado por pasos.
4. Vista de administracion para revisar proyectos y cambiar estado.
5. Visualizacion de observaciones y actores por proyecto.
6. Inicio de sesion con correo institucional (SSO), sujeto a disponibilidad institucional.

### Infraestructura

1. Dockerfile para frontend.
2. Dockerfile para backend.
3. Docker Compose para ejecutar el entorno completo local.
4. Servicio PostgreSQL en Docker Compose para desarrollo/pruebas.

## Flujo Principal de Negocio del MVP

1. Proponente registra proyecto.
2. Administrador revisa informacion.
3. Administrador aprueba o rechaza.
4. Proyecto aprobado continua su gestion con cambio de estado y asignacion de actores.
5. Usuarios autorizados consultan estado y observaciones.

## Estados del Proyecto para MVP

Se adopta el flujo de estados actualmente definido en backend:

1. proposed
2. under_review
3. approved
4. assigned
5. in_progress
6. closed
7. rejected

## Criterios de Aceptacion

El MVP se considera aceptado cuando se cumpla lo siguiente:

1. Se puede crear al menos un proyecto de persona natural y uno de persona juridica.
2. Se pueden listar proyectos y consultar un proyecto por id.
3. Se puede cambiar el estado respetando transiciones validas.
4. El dominio rechaza duplicidad de rol por persona dentro del mismo proyecto.
5. El backend y frontend levantan correctamente con Docker Compose.
6. La base de datos PostgreSQL inicia y se conecta correctamente en entorno local.

## Fuera de Alcance en esta Version

1. Automatizacion de documentos oficiales y cartas.
2. Modelado completo de entregables (weekly reports, hitos, articulo final).
3. Notificaciones por correo y recordatorios automaticos.
4. Galeria historica avanzada de proyectos con analitica.
5. Integraciones externas adicionales fuera de SSO.

## Supuestos y Dependencias

1. Disponibilidad de infraestructura institucional para SSO.
2. Definicion funcional validada con docentes responsables.
3. Ambientes de desarrollo con Docker y Docker Compose disponibles.

## Riesgos Iniciales

1. Retraso en integracion SSO institucional.
2. Cambios de alcance durante validaciones funcionales.
3. Ajustes de modelo por nuevos roles, tipos de proyectos o tipos de proponente.

## Definicion de Terminado

1. Funcionalidades incluidas implementadas en frontend y backend.
2. Pruebas minimas de flujo principal ejecutadas.
3. Entorno local reproducible mediante Docker Compose.
4. Documentacion del código y de infraestructura.


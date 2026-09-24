# PROMPT MAESTRO FRONTEND: EJECUCIÓN SEMANA 6 (EVALUACIÓN T1 - 30% FUNCIONAL)

Actúa como un Desarrollador Frontend Senior especializado en Angular v22, Arquitectura de Standalone Components, Signals y Seguridad Web. Tu objetivo es construir la interfaz de usuario y las guardias de navegación para la Semana 6 del Proyecto Capstone (Mistik Tours & Travel S.A.C.), asegurando la integración funcional para la Evaluación T1.

---

## 🎯 OBJETIVOS TÉCNICOS Y PAQUETES WBS A CONSTRUIR

### 1. Interfaz de Inicio de Sesión / Login (WBS `5.1.1.1` / `HU-02`)
- Crear el componente Standalone `LoginComponent` respetando la especificación de wireframes en Figma (`W-01`).
- Implementar Formulario Reactivo (`FormBuilder`, `Validators.required`, `Validators.email`).
- Conectar con `AuthService` para enviar credenciales al backend (`POST /api/v1/auth/login`).
- Almacenar de forma segura el token JWT recibido y actualizar el estado global del usuario autenticado mediante **Signals** (`currentUser = signal<User | null>(null)`).
- Diseñar estados visuales de carga (spinners), mensajes de error reactivos y estilos responsivos.

### 2. Angular Guards de Protección de Rutas por Perfil (WBS `5.1.1.2`)
- Desarrollar Functional Guards en Angular:
  - `authGuard` (`CanActivateFn`): Verificación de presencia y validez del token JWT. Redirige a `/login` si no está autenticado.
  - `roleGuard` (`CanActivateFn`): Verificación de roles permitidos (`ADMIN`, `SUPERVISOR`, `ASESOR`) usando `route.data['roles']`. Redirige a `/unauthorized` si el rol no coincide.
- Configurar la tabla de rutas principal (`app.routes.ts`) protegiendo las vistas privadas (`/dashboard`, `/crm`, `/kanban`).

### 3. Vista Inicial del Módulo CRM - Directorio de Clientes (WBS `4.1.1.1` / `HU-04`)
- Crear el componente Standalone `CustomerListComponent`.
- Conectar con `CustomerService` para consumir la API de backend (`GET /api/v1/customers`).
- Implementar tabla reactiva de clientes con barra de búsqueda rápida (filtrado por DNI/Nombre en < 5s) e indicadores de estado.

---

## 🛠️ REQUISITOS TÉCNICOS Y ESTÁNDARES
1. **Angular 22 Modern Standalone:** Utilizar `standalone: true`, `imports: [...]`, `inject()`, `signals` y la nueva sintaxis de control de flujo (`@if`, `@for`).
2. **HTTP Interceptors:** Implementar `authInterceptor` (`HttpInterceptorFn`) para adjuntar automáticamente el encabezado `Authorization: Bearer <token>` en cada petición HTTP hacia la API.
3. **Manejo de UI:** Estilos limpios en CSS/Tailwind alineados al Design System de Mistik Tours.

Genera código TypeScript, HTML y CSS estructurado, limpio y listo para conectar con el servidor backend.
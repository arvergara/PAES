# PAES Simulator

Simulador de pruebas PAES (Prueba de Acceso a la Educación Superior) de Chile.

## 🚀 Demo

[Link de la aplicación desplegada]

## 📋 Características

- ✅ **1,472 preguntas** verificadas con clavijeros oficiales DEMRE
- ✅ **5 asignaturas**: Historia (301), Matemática 1 (98), Biología (344), Física (372), Química (357)
- ✅ Simulacros cronometrados
- ✅ Seguimiento de progreso
- ✅ Explicaciones detalladas
- ✅ Autenticación de usuarios

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## 🏃‍♂️ Desarrollo Local

### Prerequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone [tu-repo-url]
cd Nuevo_PAES

# Instalar dependencias del frontend
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`

### Build para producción

```bash
cd frontend
npm run build
```

## 📊 Base de Datos

La base de datos usa Supabase con el siguiente esquema:

- `questions` - Preguntas con opciones y respuestas
- `user_answers` - Respuestas de usuarios
- `test_sessions` - Sesiones de examen
- `profiles` - Perfiles de usuario

Ver `SETUP_SUPABASE.sql` para el esquema completo.

## 📝 Scripts de Carga

Para cargar preguntas a la base de datos:

```bash
# Historia
python load_questions_h.py

# Matemática 1
python load_m1_questions.py

# Ciencias (Biología, Física, Química)
python load_ciencias_questions.py
```

## 📄 Licencia

MIT

## 👥 Autor

Andrés Vergara

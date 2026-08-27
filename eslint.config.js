import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * Las reglas de dependencia entre capas se verifican solas o se violan en la
 * tercera semana. Se usa `no-restricted-imports` del nucleo de ESLint en lugar
 * de un plugin externo: menos dependencias que mantener y ningun riesgo de
 * incompatibilidad al subir de version.
 */
export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Scripts de Node ────────────────────────────────────────────────────────
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },

  // ── Capa de dominio: no depende de nada ────────────────────────────────────
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'dexie',
                'dexie-*',
                'lucide-react',
                '@/application/*',
                '@/infrastructure/*',
                '@/presentation/*',
                '@/app/*',
                '@/lib/*',
              ],
              message:
                'domain/ no puede importar nada fuera de domain/. Es lo que mantiene abierta la migracion a SQLite y PostgreSQL.',
            },
          ],
        },
      ],
    },
  },

  // ── Capa de aplicacion: solo dominio ───────────────────────────────────────
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'dexie', 'dexie-*', '@/infrastructure/*', '@/presentation/*', '@/app/*'],
              message: 'application/ solo puede depender de domain/.',
            },
          ],
        },
      ],
    },
  },

  // ── Capa de presentacion: nunca infraestructura ────────────────────────────
  {
    files: ['src/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/infrastructure/*', 'dexie'],
              message:
                'presentation/ no puede importar infraestructura. Usa los repositorios via useRepositorios().',
            },
          ],
        },
      ],
    },
  },

  // ── Unica excepcion: la costura de reactividad ─────────────────────────────
  {
    files: ['src/presentation/hooks/data/useConsulta.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // ── Pruebas ────────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
)

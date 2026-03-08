# Guia Rapida de Versionamiento (Paso a Paso)

Este archivo es una receta operativa para sacar versiones en este proyecto.

## 0) Requisitos
- Tener cambios committeados en Git.
- Estar en la rama correcta (`main` para release).
- Tener dependencias instaladas (`npm install`).

## 1) Elegir tipo de version
Usa SemVer:
- `patch` = correcciones sin cambiar comportamiento publico.
- `minor` = nuevas funcionalidades compatibles.
- `major` = cambios incompatibles.

## 2) Ejecutar release local
Desde la raiz del proyecto, ejecuta uno:

```bash
npm run release:patch
```

```bash
npm run release:minor
```

```bash
npm run release:major
```

## 3) Que hace automaticamente el script
El comando de release:
1. Corre `npm run build`.
2. Aumenta version en `package.json` y `package-lock.json`.
3. Actualiza `CHANGELOG.md`.
4. Crea commit: `chore(release): vX.Y.Z`.
5. Crea tag Git: `vX.Y.Z`.

## 4) Publicar version
Despues del release local:

```bash
git push
git push --tags
```

## 5) Verificar
- Confirmar nueva version en `package.json`.
- Confirmar entrada nueva en `CHANGELOG.md`.
- Confirmar tag con:

```bash
git tag --list "v*"
```

## 6) Flujo recomendado de equipo
1. Trabajar en `feature/*`.
2. Abrir PR a `develop`.
3. Validar CI.
4. Merge de `develop` a `main`.
5. Ejecutar release en `main`.
6. Push + tags.

## 7) Ejemplos rapidos
- Arreglaste un bug visual: `npm run release:patch`
- Agregaste modulo nuevo compatible: `npm run release:minor`
- Cambiaste estructura/contrato de forma incompatible: `npm run release:major`

## 8) Si algo falla
- Si falla `build`, corrige errores y vuelve a ejecutar el mismo comando.
- Si ya genero cambio de version pero no quieres continuar, revisa `git status` antes de hacer push.

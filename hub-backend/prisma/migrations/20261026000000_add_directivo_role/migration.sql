-- Nuevo rol global `directivo`: asume las acciones que antes hacía el
-- `evaluator` global. El rol `evaluator` queda para evaluar la expo y solo
-- actúa en los proyectos donde esté asignado.
--
-- Se recrea el enum en lugar de usar `ALTER TYPE ... ADD VALUE` para poder
-- actualizar las filas en la misma migración y mantener el patrón de
-- `20261014022544_simplify_user_roles`.

CREATE TYPE "UserRole_new" AS ENUM ('admin', 'directivo', 'evaluator', 'teacher', 'proposer', 'student'); -- NOSONAR: literal obligatorio en el enum

ALTER TABLE "user_role_assignment"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'evaluator' THEN 'directivo'
      ELSE "role"::text
    END
  )::"UserRole_new";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old"; -- NOSONAR: el tipo temporal exige identificador citado

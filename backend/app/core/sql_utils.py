"""Helpers SQL pour Alembic — splitter robuste qui respecte les blocks ``$$``.

asyncpg interdit les prepared statements multi-commandes : chaque
``op.execute()`` doit recevoir un seul statement SQL. Les fichiers SQL
de la baseline contiennent des dizaines de statements ; on les splitte
ici en respectant les `do $$ ... $$;`, `function ... $$;` et chaînes
quotées.
"""

from __future__ import annotations


def split_statements(sql: str) -> list[str]:
    """Découpe un script SQL en statements individuels.

    Règles :
    - Sépare sur ``;`` au niveau racine.
    - Ignore les ``;`` à l'intérieur de blocs ``$tag$ ... $tag$`` (PL/pgSQL).
    - Ignore les ``;`` à l'intérieur de chaînes ``'...'`` et identifiants ``"..."``.
    - Ignore les commentaires ``-- ...`` et ``/* ... */``.
    - Retire les statements vides et les ``BEGIN;`` / ``COMMIT;`` externes
      (Alembic gère sa propre transaction).
    """
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(sql)

    in_single_quote = False
    in_double_quote = False
    dollar_tag: str | None = None  # tag actif d'un block $tag$
    in_line_comment = False
    in_block_comment = False

    while i < n:
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""

        # Fin de commentaire ligne
        if in_line_comment:
            buf.append(ch)
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        # Fin de commentaire bloc
        if in_block_comment:
            buf.append(ch)
            if ch == "*" and nxt == "/":
                buf.append(nxt)
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        # Dans un dollar-quoted block
        if dollar_tag is not None:
            buf.append(ch)
            if ch == "$":
                # Cherche la fermeture exacte du tag
                end = sql.find(f"${dollar_tag}$", i)
                if end == i:
                    closing = f"${dollar_tag}$"
                    buf.extend(closing[1:])  # le premier $ déjà ajouté
                    i += len(closing)
                    dollar_tag = None
                    continue
            i += 1
            continue

        if in_single_quote:
            buf.append(ch)
            if ch == "'" and (i + 1 >= n or sql[i + 1] != "'"):
                in_single_quote = False
            elif ch == "'" and i + 1 < n and sql[i + 1] == "'":
                buf.append(sql[i + 1])
                i += 2
                continue
            i += 1
            continue

        if in_double_quote:
            buf.append(ch)
            if ch == '"':
                in_double_quote = False
            i += 1
            continue

        # Démarrage de commentaire ligne
        if ch == "-" and nxt == "-":
            buf.append(ch)
            in_line_comment = True
            i += 1
            continue

        # Démarrage de commentaire bloc
        if ch == "/" and nxt == "*":
            buf.append(ch)
            buf.append(nxt)
            in_block_comment = True
            i += 2
            continue

        # Chaîne simple
        if ch == "'":
            buf.append(ch)
            in_single_quote = True
            i += 1
            continue

        # Identifiant entre guillemets
        if ch == '"':
            buf.append(ch)
            in_double_quote = True
            i += 1
            continue

        # Démarrage d'un dollar-quoted block : $tag$ ou $$
        if ch == "$":
            # Trouver la fin du tag
            j = i + 1
            while j < n and (sql[j].isalnum() or sql[j] == "_"):
                j += 1
            if j < n and sql[j] == "$":
                tag = sql[i + 1 : j]
                buf.append(sql[i : j + 1])
                dollar_tag = tag
                i = j + 1
                continue

        # Séparateur de statement
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt and stmt.lower() not in ("begin", "commit"):
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    # Statement final sans `;` terminal
    leftover = "".join(buf).strip()
    if leftover and leftover.lower() not in ("begin", "commit"):
        statements.append(leftover)

    return statements

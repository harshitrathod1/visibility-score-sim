#!/usr/bin/env python3
"""
Load a CSV with companyId, fetch company names from a database, and save as Excel.

Usage:
  python scripts/enrich_csv_with_company_names.py [input.csv] [output.xlsx]

Environment (or .env):
  DATABASE_URL    e.g. mysql+pymysql://user:pass@localhost:3312/ambitionbox
  COMPANY_TABLE   table name (default: companies)
  COMPANY_ID_COL  column for company id (default: CompanyId)
  COMPANY_NAME_COL  column for company name (default: ShortName)
"""

import os
import sys
from pathlib import Path

import pandas as pd

# Optional: load .env from project root
try:
    from dotenv import load_dotenv
    root = Path(__file__).resolve().parent.parent
    load_dotenv(root / ".env")
except ImportError:
    pass

# Default paths
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
DEFAULT_INPUT = ROOT / "data_2026-02-10 06_18_08 PM.csv"
DEFAULT_OUTPUT = ROOT / "data_2026-02-10_06_18_08_PM_with_company_names.xlsx"


def get_db_connection():
    """Build DB connection from env. Supports PostgreSQL and MySQL."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit(
            "Set DATABASE_URL (e.g. postgresql://user:pass@host:5432/dbname or mysql+pymysql://...) "
            "or use .env file."
        )
    try:
        from sqlalchemy import create_engine
        return create_engine(url)
    except ImportError:
        raise SystemExit(
            "Install DB driver: pip install sqlalchemy psycopg2-binary (PostgreSQL) "
            "or pip install sqlalchemy pymysql (MySQL)"
        )


def fetch_company_names(engine, company_ids, table: str, id_col: str, name_col: str) -> dict:
    """Return mapping company_id -> company_name. Query: SELECT ShortName FROM companies WHERE CompanyId IN (...)."""
    if not company_ids:
        return {}
    from sqlalchemy import text

    result = {}
    batch_size = 2000
    for start in range(0, len(company_ids), batch_size):
        batch = company_ids[start : start + batch_size]
        placeholders = ", ".join([f":id_{i}" for i in range(len(batch))])
        params = {f"id_{i}": (int(x) if str(x).isdigit() else x) for i, x in enumerate(batch)}
        # MySQL uses backticks; PostgreSQL uses double quotes
        url = str(engine.url)
        if "mysql" in url:
            sql = text(
                f"SELECT `{id_col}`, `{name_col}` FROM `{table}` WHERE `{id_col}` IN ({placeholders})"
            )
        else:
            sql = text(
                f'SELECT "{id_col}", "{name_col}" FROM "{table}" WHERE "{id_col}" IN ({placeholders})'
            )
        with engine.connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        for r in rows:
            result[str(r[0])] = r[1] or ""
    return result


def main():
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT

    if not input_path.is_absolute():
        input_path = ROOT / input_path
    if not output_path.is_absolute():
        output_path = ROOT / output_path

    if not input_path.exists():
        print(f"Error: input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Load CSV
    print(f"Loading {input_path}...")
    df = pd.read_csv(input_path)
    if "companyId" not in df.columns:
        print("Error: CSV must have a 'companyId' column.", file=sys.stderr)
        sys.exit(1)

    company_ids = df["companyId"].astype(str).unique().tolist()
    print(f"Found {len(company_ids)} unique company IDs.")

    # DB config (ambitionbox: SELECT ShortName FROM companies WHERE CompanyId IN (...))
    table = os.environ.get("COMPANY_TABLE", "companies")
    id_col = os.environ.get("COMPANY_ID_COL", "CompanyId")
    name_col = os.environ.get("COMPANY_NAME_COL", "ShortName")

    engine = get_db_connection()
    print("Fetching company names from database...")
    id_to_name = fetch_company_names(engine, company_ids, table, id_col, name_col)
    print(f"Resolved {len(id_to_name)} company names.")

    # Map and add column
    df["companyName"] = df["companyId"].astype(str).map(id_to_name)
    missing = df["companyName"].isna() | (df["companyName"] == "")
    if missing.any():
        n = missing.sum()
        df.loc[missing, "companyName"] = ""
        print(f"Warning: {n} rows have no company name in DB.")

    # Reorder so companyName is after companyId
    cols = list(df.columns)
    if "companyName" in cols:
        cols.remove("companyName")
        idx = cols.index("companyId") + 1
        df = df[cols[:idx] + ["companyName"] + cols[idx:]]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()

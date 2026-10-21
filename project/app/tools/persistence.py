"""
Persistence Layer for Research Runs.
Supports SQLite database storage and JSON directory serialization.
Configured via PERSISTENCE_BACKEND, SQLITE_DB_PATH, and RUNS_DIR.
"""

from __future__ import annotations
import datetime
import json
import logging
import os
import sqlite3
import uuid
from typing import Optional, List, Dict, Any
from project.app.schemas.state import ResearchState

logger = logging.getLogger(__name__)

DEFAULT_SQLITE_PATH = os.getenv("SQLITE_DB_PATH", "./data/runs.db")
DEFAULT_RUNS_DIR = os.getenv("RUNS_DIR", "./data/runs")
PERSISTENCE_BACKEND = os.getenv("PERSISTENCE_BACKEND", "sqlite")


def init_sqlite_db(db_path: str = DEFAULT_SQLITE_PATH) -> None:
    """Initialize SQLite database tables for persistent research runs and checkpoints."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS research_runs (
        run_id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        current_node TEXT NOT NULL,
        paper_count INTEGER DEFAULT 0,
        claim_support_rate REAL DEFAULT 1.0,
        gap_statement TEXT,
        report_markdown TEXT,
        state_json TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS human_checkpoints (
        checkpoint_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        checkpoint_name TEXT NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES research_runs (run_id)
    );
    """)

    conn.commit()
    conn.close()
    logger.info("Initialized SQLite database at: %s", db_path)


def save_run_state(
    state: ResearchState,
    db_path: str = DEFAULT_SQLITE_PATH,
    runs_dir: str = DEFAULT_RUNS_DIR,
    backend: str = PERSISTENCE_BACKEND
) -> str:
    """
    Persist research state to SQLite database and/or JSON storage.
    Returns the unique run_id.
    """
    run_id = f"run_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. SQLite Persistence
    if backend in ("sqlite", "both"):
        try:
            init_sqlite_db(db_path)
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            support_rate = state.metrics.get("claim_support_rate", 1.0) if state.metrics else 1.0

            cursor.execute("""
            INSERT INTO research_runs (
                run_id, topic, timestamp, current_node, paper_count,
                claim_support_rate, gap_statement, report_markdown, state_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id,
                state.topic,
                now_iso,
                state.current_node,
                len(state.papers),
                support_rate,
                state.gap_statement,
                state.draft_report,
                state.model_dump_json(indent=2)
            ))

            for override in state.human_overrides:
                cursor.execute("""
                INSERT INTO human_checkpoints (
                    checkpoint_id, run_id, checkpoint_name, action, notes, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    str(uuid.uuid4()),
                    run_id,
                    override.checkpoint_name,
                    override.action,
                    override.notes or "",
                    override.timestamp
                ))

            conn.commit()
            conn.close()
            logger.info("Saved run state to SQLite DB: %s (run_id=%s)", db_path, run_id)
        except Exception as e:
            logger.error("Error saving run state to SQLite: %s", str(e))

    # 2. File / JSON Persistence
    if backend in ("json", "both") or not os.path.exists(db_path):
        try:
            os.makedirs(runs_dir, exist_ok=True)
            json_file = os.path.join(runs_dir, f"{run_id}.json")
            with open(json_file, "w", encoding="utf-8") as f:
                f.write(state.model_dump_json(indent=2))
            logger.info("Saved run state JSON file to: %s", json_file)
        except Exception as e:
            logger.error("Error saving run state JSON: %s", str(e))

    return run_id


def list_saved_runs(db_path: str = DEFAULT_SQLITE_PATH) -> List[Dict[str, Any]]:
    """List recent research runs stored in SQLite."""
    if not os.path.exists(db_path):
        return []

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT run_id, topic, timestamp, paper_count, claim_support_rate, current_node
        FROM research_runs ORDER BY timestamp DESC LIMIT 20
        """)
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "run_id": r[0],
                "topic": r[1],
                "timestamp": r[2],
                "paper_count": r[3],
                "claim_support_rate": r[4],
                "current_node": r[5]
            }
            for r in rows
        ]
    except Exception as e:
        logger.error("Error querying SQLite runs: %s", str(e))
        return []

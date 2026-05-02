from __future__ import annotations

import concurrent.futures
import re
from dataclasses import dataclass
from typing import List, Tuple

from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
REQUEST_TIMEOUT_SECONDS = 10
CHUNK_WORDS = 200
MAX_SUSPICIOUS_SEGMENTS = 10
SUSPICIOUS_THRESHOLD = 0.75

model = SentenceTransformer(MODEL_NAME)


@dataclass
class SegmentMatch:
    text_a: str
    text_b: str
    score: float


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_chunks(text: str, chunk_words: int = CHUNK_WORDS) -> List[str]:
    words = clean_text(text).split()
    if not words:
        return []
    chunks = []
    for i in range(0, len(words), chunk_words):
        chunk = " ".join(words[i : i + chunk_words]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def compute_semantic(text_a: str, text_b: str) -> Tuple[float, List[SegmentMatch]]:
    chunks_a = split_chunks(text_a)
    chunks_b = split_chunks(text_b)

    if not chunks_a or not chunks_b:
        return 0.0, []

    embeddings_a = model.encode(chunks_a, convert_to_tensor=True, normalize_embeddings=True)
    embeddings_b = model.encode(chunks_b, convert_to_tensor=True, normalize_embeddings=True)

    matrix = util.cos_sim(embeddings_a, embeddings_b).cpu().numpy()
    max_for_a = matrix.max(axis=1)
    global_score = float(max_for_a.mean()) if max_for_a.size else 0.0

    suspicious: List[SegmentMatch] = []
    for i, row in enumerate(matrix):
        for j, value in enumerate(row):
            score = float(value)
            if score > SUSPICIOUS_THRESHOLD:
                suspicious.append(
                    SegmentMatch(
                        text_a=chunks_a[i],
                        text_b=chunks_b[j],
                        score=score,
                    )
                )

    suspicious.sort(key=lambda item: item.score, reverse=True)
    suspicious = suspicious[:MAX_SUSPICIOUS_SEGMENTS]
    return max(0.0, min(1.0, global_score)), suspicious


@app.post("/semantic")
def semantic() -> tuple:
    payload = request.get_json(silent=True) or {}
    text_a = payload.get("textA", "")
    text_b = payload.get("textB", "")

    if not isinstance(text_a, str) or not isinstance(text_b, str):
        return jsonify({"error": "Invalid payload"}), 400

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(compute_semantic, text_a, text_b)
        try:
            semantic_score, suspicious_segments = future.result(
                timeout=REQUEST_TIMEOUT_SECONDS
            )
        except concurrent.futures.TimeoutError:
            return jsonify({"error": "Semantic analysis timeout"}), 504

    return (
        jsonify(
            {
                "semantic_score": semantic_score,
                "suspicious_segments": [
                    {
                        "textA": segment.text_a,
                        "textB": segment.text_b,
                        "score": segment.score,
                    }
                    for segment in suspicious_segments
                ],
                "model": MODEL_NAME,
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3002)

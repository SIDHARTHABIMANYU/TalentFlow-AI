from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.modules.rag.company_knowledge import query_company_knowledge

model = SentenceTransformer('all-MiniLM-L6-v2')

# Manual skill synonyms — handles technical terms
SKILL_SYNONYMS = {
    "machine learning": ["tensorflow", "pytorch", "sklearn", "scikit-learn", "ml", "deep learning", "ai", "neural network"],
    "deep learning": ["tensorflow", "pytorch", "keras", "neural network", "cnn", "rnn", "lstm"],
    "sql": ["postgresql", "postgres", "mysql", "sqlite", "database", "mongodb", "nosql"],
    "aws": ["cloud", "azure", "gcp", "google cloud", "ec2", "s3", "lambda"],
    "python": ["django", "fastapi", "flask", "pandas", "numpy"],
    "javascript": ["react", "nodejs", "node.js", "vue", "angular", "typescript"],
    "devops": ["docker", "kubernetes", "ci/cd", "jenkins", "git"],
    "data analysis": ["pandas", "numpy", "matplotlib", "tableau", "powerbi", "excel"],
    "nlp": ["natural language processing", "bert", "gpt", "transformers", "spacy", "nltk"],
    "computer vision": ["opencv", "cnn", "image processing", "yolo"],
}

def check_synonym_match(req_skill: str, candidate_list: list) -> bool:
    req_lower = req_skill.lower()
    synonyms = SKILL_SYNONYMS.get(req_lower, [])
    for candidate in candidate_list:
        candidate_lower = candidate.lower()
        if candidate_lower in synonyms:
            print(f"📚 Synonym match: '{req_skill}' ≈ '{candidate}'")
            return True
        # Check reverse
        for skill, syns in SKILL_SYNONYMS.items():
            if candidate_lower == skill and req_lower in syns:
                print(f"📚 Reverse synonym: '{req_skill}' ≈ '{candidate}'")
                return True
    return False

def semantic_match_skills(
    candidate_skills: str,
    required_skills: str,
    candidate_resume: str = ""
) -> dict:

    if not candidate_skills or not required_skills:
        return {
            "match_score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "semantic_bonus": 0.0,
            "recommendation": "REJECT",
            "company_fit": "LOW"
        }

    candidate_list = [s.strip().lower() for s in candidate_skills.split(",")]
    required_list = [s.strip().lower() for s in required_skills.split(",")]

    matched = []
    missing = []

    for req_skill in required_list:
        # Step 1 — Exact match
        if req_skill in candidate_list:
            matched.append(req_skill)
            continue

        # Step 2 — Partial match
        partial_found = False
        for c in candidate_list:
            if req_skill in c or c in req_skill:
                matched.append(req_skill)
                partial_found = True
                print(f"🔤 Partial match: '{req_skill}' ≈ '{c}'")
                break

        if partial_found:
            continue

        # Step 3 — Synonym match
        if check_synonym_match(req_skill, candidate_list):
            matched.append(req_skill)
            continue

        # Step 4 — Semantic similarity
        req_embedding = model.encode([req_skill])
        candidate_embeddings = model.encode(candidate_list)
        similarities = cosine_similarity(req_embedding, candidate_embeddings)[0]
        max_sim = np.max(similarities)
        best_idx = np.argmax(similarities)

        if max_sim > 0.60:
            matched.append(req_skill)
            print(f"🧠 Semantic: '{req_skill}' ≈ '{candidate_list[best_idx]}' ({max_sim:.0%})")
        else:
            missing.append(req_skill)

    # Base score
    base_score = (len(matched) / len(required_list)) * 100 if required_list else 0

    # Company fit via RAG
    company_fit_score = 0.0
    company_fit_level = "LOW"

    if candidate_resume:
        try:
            relevant_docs = query_company_knowledge(candidate_skills)
            if relevant_docs:
                resume_embedding = model.encode([candidate_resume[:500]])
                doc_embeddings = model.encode(relevant_docs)
                sims = cosine_similarity(resume_embedding, doc_embeddings)[0]
                company_fit_score = float(np.max(sims)) * 100
                if company_fit_score >= 70:
                    company_fit_level = "HIGH"
                elif company_fit_score >= 50:
                    company_fit_level = "MEDIUM"
        except Exception as e:
            print(f"⚠ RAG error: {str(e)}")

    semantic_bonus = min(company_fit_score * 0.1, 10)
    final_score = min(base_score + semantic_bonus, 100)

    if final_score >= 70:
        recommendation = "SHORTLIST"
    elif final_score >= 50:
        recommendation = "CONSIDER"
    else:
        recommendation = "REJECT"

    return {
        "match_score": round(final_score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "semantic_bonus": round(semantic_bonus, 2),
        "recommendation": recommendation,
        "company_fit": company_fit_level
    }
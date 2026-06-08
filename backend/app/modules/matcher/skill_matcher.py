def match_skills(candidate_skills: str, required_skills: str, 
                 candidate_resume: str = "") -> dict:
    try:
        # Use semantic matcher with RAG
        from app.modules.rag.semantic_matcher import semantic_match_skills
        return semantic_match_skills(
            candidate_skills, 
            required_skills,
            candidate_resume
        )
    except Exception as e:
        print(f"⚠ Semantic matching failed, using keyword: {str(e)}")
        # Fallback to keyword matching
        return keyword_match(candidate_skills, required_skills)

def keyword_match(candidate_skills: str, required_skills: str) -> dict:
    if not candidate_skills or not required_skills:
        return {
            "match_score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "recommendation": "REJECT",
            "company_fit": "LOW"
        }

    candidate_list = [s.strip().lower() for s in candidate_skills.split(",")]
    required_list = [s.strip().lower() for s in required_skills.split(",")]

    matched = []
    missing = []

    for req in required_list:
        if req in candidate_list:
            matched.append(req)
        else:
            found = False
            for c in candidate_list:
                if req in c or c in req:
                    matched.append(req)
                    found = True
                    break
            if not found:
                missing.append(req)

    score = (len(matched) / len(required_list)) * 100 if required_list else 0

    if score >= 70:
        recommendation = "SHORTLIST"
    elif score >= 50:
        recommendation = "CONSIDER"
    else:
        recommendation = "REJECT"

    return {
        "match_score": round(score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendation": recommendation,
        "company_fit": "LOW"
    }